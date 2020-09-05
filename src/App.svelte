<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  import { ReportType } from "./enums";

  const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{1,2}/;

  const width = 1000;
  const height = 500;
  const margin = 60;
  const transitionDuration = 800;
  const circleRadius = 2.5;

  let chosenCountry = "Hungary";
  let countries = [];
  let allData;

  // axes
  let x;
  let y;

  //line and area
  let line;
  let area;

  async function fetchData() {
    return await (
      await fetch(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
      )
    ).text();
  }

  async function main() {
    const csv = await fetchData();

    allData = d3.csvParse(csv, d3.autoType);

    countries = [...new Set(allData.map((d) => d["Country/Region"]))];

    const country = allData.find((d) => d["Country/Region"] === chosenCountry);

    let data = Object.entries(country)
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

    const div = d3.select("#tooltip");

    svg
      .append("g")
      .append("path")
      .data([data])
      .attr("class", "line")
      .attr("fill", "none")
      .attr("d", line);

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
      .attr("transform", `translate(0, ${margin - 10})`)
      .text("Fertőzöttek száma");
  }

  function updateData() {
    const countryData = allData.filter(
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

    let data = Object.entries(summedCountryData)
      .filter(([key]) => key.match(DATE_REGEX))
      .map(([key, value]) => [new Date(key), value])
      .filter((d) => d[1] !== 0);

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
      .attr("cx", (d) => x(d[0]))
      .attr("cy", (d) => y(d[1]))
      .attr("r", circleRadius)
      .attr("fill", "steelblue");

    svg
      .select(".line")
      .data([data])
      .transition()
      .duration(transitionDuration)
      .attr("d", line);

    svg
      .select(".area")
      .data([data])
      .transition()
      .duration(transitionDuration)
      .attr("d", area);
  }

  onMount(() => {
    main();
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
</main>
