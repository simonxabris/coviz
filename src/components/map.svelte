<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { ReportType } from "../enums";
  import type { CountryData } from "../types";

  const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{1,2}/;

  let group: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

  let countries: {
    name: string;
    infected: number;
    dead: number;
    recovered: number;
  }[] = [];

  let countryData: CountryData[][];

  async function fetchCovidData() {
    const dataSources = {
      [ReportType.Confirmed]:
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
      [ReportType.Deaths]:
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
      [ReportType.Recovered]:
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv",
    };

    const data: CountryData[][] = await Promise.all(
      Object.values(dataSources).map((url) =>
        fetch(url)
          .then((response) => response.text())
          .then((csv) => d3.csvParse<CountryData>(csv, d3.autoType))
      )
    );

    return data;
  }

  async function main() {
    const { offsetHeight, scrollWidth } = document.querySelector(
      ".content"
    ) as HTMLElement;
    const width = scrollWidth;
    const height = offsetHeight;

    const zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", onZoom);

    const svg = d3.select(".map").attr("viewBox", `0 0 ${width} ${height}`);

    group = svg.append("g");

    svg.call(zoom);

    const data = await (await fetch("/world.json")).json();

    const projection = d3
      .geoMercator()
      .translate([width / 2, height / 2])
      .scale(120);

    group
      .selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .on("mouseenter", (event) => {
        d3.select(event.target).attr("fill", "#a1cfc4");
      })
      .on("click", onCountryClicked)
      .on("mouseleave", (event) => {
        const element = d3.select(event.target);

        element.attr("fill", "white");
      })
      .attr("d", d3.geoPath(projection))
      .attr("fill", "white")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 0.8);

    function onZoom(event, data) {
      group.selectAll("path").attr("transform", event.transform);
    }
  }

  function onCountryClicked(event, data) {
    if (d3.select(event.target).classed("selected")) {
      d3.select(event.target).attr("class", "");

      const updatedCountries = countries.filter(
        ({ name }) => name !== data.properties["brk_name"]
      );

      countries = updatedCountries;
    } else {
      d3.select(event.target).attr("class", "selected");

      const stats = getStatsForCountry([
        data.properties["brk_name"],
        data.properties["iso_a2"],
      ]);

      const country = {
        name: data.properties["brk_name"],
        ...stats,
      };

      console.log("country push");

      countries = [...countries, country];
    }
  }

  function getStatsForCountry(
    countryIdentifiers: string[]
  ): { infected: number; dead: number; recovered: number } {
    const infected = Object.entries(
      countryData[0].find((countryData) =>
        countryIdentifiers.some(
          (identifier) => countryData["Country/Region"] === identifier
        )
      )
    )
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([, value]) => value)
      .reduce((acc, value) => acc + value, 0);

    const dead = Object.entries(
      countryData[1].find((countryData) =>
        countryIdentifiers.some(
          (identifier) => countryData["Country/Region"] === identifier
        )
      )
    )
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([, value]) => value)
      .reduce((acc, value) => acc + value, 0);

    const recovered = Object.entries(
      countryData[2].find((countryData) =>
        countryIdentifiers.some(
          (identifier) => countryData["Country/Region"] === identifier
        )
      )
    )
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([, value]) => value)
      .reduce((acc, value) => acc + value, 0);

    return { infected, dead, recovered };
  }

  onMount(async () => {
    countryData = await fetchCovidData();
    await main();
  });
</script>

<style>
  .stats {
    height: 200px;
    display: flex;
  }

  .stat {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;

    margin: 10px;
    padding: 10px;
    height: 200px;
    width: 200px;
    border: 1px solid #e3e3e3;
    border-radius: 5px;
    box-shadow: 5px 5px 11px 3px #e3e3e3, -5px -5px 11px 3px #e3e3e3;
  }

  :global(.selected) {
    fill: #a1cfc4;
  }
</style>

<div class="stats">
  {#if countries.length !== 0}
    {#each countries as country}
      <div class="stat">
        <h1>{country.name}</h1>
        <p>Infected: {new Intl.NumberFormat().format(country.infected)}</p>
        <p>Dead: {new Intl.NumberFormat().format(country.dead)}</p>
        <p>Recovered {new Intl.NumberFormat().format(country.recovered)}</p>
      </div>
    {/each}
  {:else}
    <h1>Click a country to select it.</h1>
  {/if}
</div>
<svg class="map" />
