<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let country: string;

  let group: d3.Selection<SVGGElement, unknown, HTMLElement, any>;

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
      .on("mouseenter", (event, data) => {
        console.log(data);
        country = data.properties["brk_name"];
        d3.select(event.target).attr("fill", "red");
      })
      .on("mouseleave", (event) => {
        d3.select(event.target).attr("fill", "#cce5df");
      })
      .attr("d", d3.geoPath(projection))
      .attr("fill", "#cce5df")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 0.3);

    function onZoom(event, data) {
      console.log(event, data);
      group.selectAll("path").attr("transform", event.transform);
    }
  }

  onMount(async () => {
    await main();
  });
</script>

<div class="stats">
  <h1>Country: {country}</h1>
</div>
<svg class="map" />
