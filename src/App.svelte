<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  import { ReportType } from "./enums";
  import type { FetchedData, CountryData } from "./types";

  const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{1,2}/;

  const width = 1000;
  const height = 500;
  const margin = 60;
  const transitionDuration = 400;
  const circleRadius = 2.5;

  const reportTypes: (keyof typeof ReportType)[] = [
    "Confirmed",
    "Deaths",
    "Recovered",
  ];
  let selectedReportType = reportTypes[0];

  const dataSources = {
    [ReportType.Confirmed]:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
    [ReportType.Deaths]:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
    [ReportType.Recovered]:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv",
  };

  const yText = {
    [ReportType.Confirmed]: "No. of Infected",
    [ReportType.Deaths]: "No. of Dead",
    [ReportType.Recovered]: "No. of Recovered",
  };

  let chosenCountry: string;
  let countries: string[] = [];

  // axes
  let x: d3.ScaleTime<number, number>;
  let y: d3.ScaleLinear<number, number>;

  //line and area
  let area: d3.Area<[number, number]>;

  // data store
  const fetchedData: FetchedData = {
    [ReportType.Confirmed]: undefined,
    [ReportType.Deaths]: undefined,
    [ReportType.Recovered]: undefined,
  };

  async function fetchData(url: string): Promise<CountryData[]> {
    const csv = await (await fetch(url)).text();

    const data = d3.csvParse<CountryData>(csv, d3.autoType);

    fetchedData[selectedReportType] = data;

    return data;
  }

  async function main() {
    const params = new URLSearchParams(document.location.search);
    chosenCountry = params.get("country") || "Hungary";
    selectedReportType =
      (params.get("type") as keyof typeof ReportType) || "Confirmed";

    const allData = await fetchData(dataSources[selectedReportType]);

    countries = [...new Set(allData.map((d): string => d["Country/Region"]))];

    const country: CountryData = allData.find(
      (d) => d["Country/Region"] === chosenCountry
    );

    const data = Object.entries(country)
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([key, value]) => [new Date(key), value])
      .filter((d) => d[1] !== 0) as [Date, number][];

    x = d3
      .scaleTime()
      .domain([data[0][0], data[data.length - 1][0]])
      .range([margin, width - margin]);

    y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[1])])
      .range([height - margin, margin]);

    area = d3
      .area()
      .x((d) => x(d[0]))
      .y0(y(0))
      .y1((d) => y(d[1]));

    const svg = d3.select(".chart").attr("viewBox", [0, 0, width, height]);

    svg
      .append("path")
      .data([data])
      .attr("class", "area")
      .attr("fill", "#cce5df")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1.5)
      .attr("d", area);

    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d[0]))
      .attr("cy", (d) => y(d[1]))
      .attr("r", circleRadius)
      .attr("fill", "steelblue");

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin})`)
      .call(d3.axisBottom(x));

    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin}, 0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0));

    svg
      .append("text")
      .attr("class", "y-text")
      .attr("transform", `translate(0, ${margin - 10})`)
      .text(yText[selectedReportType]);
  }

  function onSelectChanged() {
    const url = new URL(document.location.href);

    url.search = `country=${chosenCountry}&type=${selectedReportType}`;
    history.pushState(null, document.title, url.toString());

    updateData();
  }

  async function updateData() {
    let dataSource = fetchedData[selectedReportType];

    if (dataSource === undefined) {
      dataSource = await fetchData(dataSources[selectedReportType]);
    }

    const countryData = dataSource.filter(
      (d) => d["Country/Region"] === chosenCountry
    );

    let summedCountryData = {};
    if (countryData.length > 1) {
      for (let data of countryData) {
        for (let [key, value] of Object.entries(data)) {
          if (key.match(DATE_REGEX)) {
            if (summedCountryData.hasOwnProperty(key)) {
              summedCountryData[key] += value;
            } else {
              summedCountryData[key] = value;
            }
          }
        }
      }
    } else {
      summedCountryData = countryData[0];
    }

    const data = Object.entries(summedCountryData)
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([key, value]) => [new Date(key), value])
      .filter((d) => d[1] !== 0) as [Date, number][];

    x.domain([data[0][0], data[data.length - 1][0]]);
    y.domain([0, d3.max(data, (d) => d[1])]);

    const svg = d3.select("svg");

    svg
      .select(".x-axis")
      .transition()
      .duration(transitionDuration)
      .call(d3.axisBottom(x));

    svg
      .select(".y-axis")
      .transition()
      .duration(transitionDuration)
      .call(d3.axisLeft(y).tickSizeOuter(0));

    svg.select(".y-text").text(yText[selectedReportType]);

    const circles = svg.selectAll("circle").data(data);

    circles.exit().remove();

    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d[0]))
      .attr("cy", (d) => y(d[1]))
      .attr("r", circleRadius)
      .attr("fill", "steelblue");

    circles
      .transition()
      .duration(transitionDuration)
      .ease(d3.easeQuadInOut)
      .attr("cx", (d) => x(d[0]))
      .attr("cy", (d) => y(d[1]))
      .attr("r", circleRadius)
      .attr("fill", "steelblue");

    svg
      .select(".area")
      .data([data])
      .transition()
      .duration(transitionDuration)
      .ease(d3.easeQuadInOut)
      .attr("d", area);
  }

  onMount(() => {
    main();

    window.onpopstate = (event: PopStateEvent) => {
      const searchParams = new URLSearchParams(
        (event.target as Window).location.search
      );

      chosenCountry = searchParams.get("country") || "Hungary";
      selectedReportType =
        (searchParams.get("type") as keyof typeof ReportType) ||
        ReportType.Confirmed;

      updateData();
    };
  });
</script>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
  }

  .line {
    fill: none;
    stroke: steelblue;
    stroke-width: 2px;
  }

  #tooltip {
    position: absolute;
    opacity: 0;
  }
</style>

<!-- svelte-ignore a11y-no-onchange -->
<main>
  {#if countries.length > 1}
    <select bind:value={chosenCountry} on:change={onSelectChanged}>
      {#each countries as country}
        <option value={country}>{country}</option>
      {/each}
    </select>
  {/if}
  <select
    bind:value={selectedReportType}
    name="report-type"
    on:change={onSelectChanged}>
    {#each reportTypes as reportType}
      <option value={reportType}>{reportType}</option>
    {/each}
  </select>
  <svg class="chart" />
</main>
