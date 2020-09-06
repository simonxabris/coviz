<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  import type { ReportType } from "./enums";

  const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{1,2}/;

  const width = 1000;
  const height = 500;
  const margin = 60;
  const transitionDuration = 800;
  const circleRadius = 2.5;

  // Report type
  const reportTypes: (keyof typeof ReportType)[] = [
    "Confirmed",
    "Deaths",
    "Recovered",
  ];
  let selectedReportType = reportTypes[0];
  const dataSources = {
    [reportTypes[0]]:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv",
    [reportTypes[1]]:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv",
    [reportTypes[2]]:
      "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv",
  };
  const yText = {
    [reportTypes[0]]: "No. of Infected",
    [reportTypes[1]]: "No. of Deaths",
    [reportTypes[2]]: "No. of Recoveries",
  };

  let chosenCountry = "Hungary";
  let countries = [];
  let allData;

  // axes
  let x;
  let y;

  //line and area
  let line;
  let area;

  // data store
  const fetchedData = {
    [reportTypes[0]]: undefined,
    [reportTypes[1]]: undefined,
    [reportTypes[2]]: undefined,
  };

  // data to operate on
  let data;

  async function fetchData(url: string): Promise<any> {
    const csv = await (await fetch(url)).text();

    const data = d3.csvParse(csv, d3.autoType);

    fetchedData[selectedReportType] = data;

    return data;
  }

  async function main() {
    const allData = await fetchData(dataSources[selectedReportType]);

    countries = [...new Set(allData.map((d) => d["Country/Region"]))];

    const country = allData.find((d) => d["Country/Region"] === chosenCountry);

    data = Object.entries(country)
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([key, value]) => [new Date(key), value])
      .filter((d) => d[1] !== 0);

    x = d3
      .scaleTime()
      .domain([data[0][0], data[data.length - 1][0]])
      .range([margin, width - margin]);

    y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[1])])
      .range([height - margin, margin]);

    line = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));

    area = d3
      .area()
      .x((d) => x(d[0]))
      .y0(y(0))
      .y1((d) => y(d[1]));

    const svg = d3
      .select("body")
      .append("svg")
      .attr("viewBox", [0, 0, width, height]);
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

    let newData = Object.entries(summedCountryData)
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([key, value]) => [new Date(key), value])
      .filter((d) => d[1] !== 0);

    x.domain([newData[0][0], newData[newData.length - 1][0]]);
    y.domain([0, d3.max(newData, (d) => d[1])]);

    data = newData;

    updateAxes();
  }

  function getAxes() {
    const svg = d3.select(".chart");

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
  }

  function updateAxes() {
    const svg = d3.select(".chart");

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
  }

  onMount(async () => {
    await main();

    getAxes();
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

<main>
  {#if countries.length > 1}
    <select bind:value={chosenCountry} on:change={updateData}>
      {#each countries as country}
        <option value={country}>{country}</option>
      {/each}
    </select>
  {/if}
  <select
    bind:value={selectedReportType}
    name="report-type"
    on:change={updateData}>
    {#each reportTypes as reportType}
      <option value={reportType}>{reportType}</option>
    {/each}
  </select>
  {#if data}
    <svg class="chart" viewBox={`0 0 ${width} ${height}`}>
      <g>
        <path
          fill="#cce5df"
          stroke="#69b3a2"
          stroke-width="1.5"
          d={area(data)} />
      </g>
      <g class="circles">
        {#each data as point (point[0])}
          <circle
            cx={x(point[0])}
            cy={y(point[1])}
            r={circleRadius}
            fill="steelblue" />
        {/each}
      </g>
      <text transform={`translate(0, ${margin - 10})`}>
        {yText[selectedReportType]}
      </text>
    </svg>
  {/if}
</main>
