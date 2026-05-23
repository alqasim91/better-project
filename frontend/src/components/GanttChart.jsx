import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function GanttChart({ phases }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!phases || phases.length === 0) return;

    const validPhases = phases.filter((p) => p.name && p.startDate && p.endDate);
    if (validPhases.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 140 };
    const width = 700;
    const barHeight = 36;
    const barGap = 12;
    const height = margin.top + margin.bottom + validPhases.length * (barHeight + barGap);

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%');

    const parseDate = d3.timeParse('%Y-%m-%d');
    const data = validPhases.map((p) => ({
      name: p.name,
      start: parseDate(p.startDate),
      end: parseDate(p.endDate),
    }));

    const xMin = d3.min(data, (d) => d.start);
    const xMax = d3.max(data, (d) => d.end);

    const x = d3
      .scaleTime()
      .domain([xMin, xMax])
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.25);

    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    // X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
      .attr('fill', '#666');

    // Y axis
    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain')
      .remove();

    svg.selectAll('.tick text').attr('fill', '#333').style('font-size', '13px');

    // Grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-(height - margin.top - margin.bottom)).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');

    svg.select('.grid .domain').remove();

    // Bars
    const bars = svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar');

    bars
      .append('rect')
      .attr('x', (d) => x(d.start))
      .attr('y', (d) => y(d.name))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', (_, i) => colors(i))
      .attr('opacity', 0.85)
      .transition()
      .duration(600)
      .attr('width', (d) => Math.max(x(d.end) - x(d.start), 4));

    // Duration labels
    bars
      .append('text')
      .attr('x', (d) => x(d.start) + (x(d.end) - x(d.start)) / 2)
      .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text((d) => {
        const days = Math.round((d.end - d.start) / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days}d` : '';
      });
  }, [phases]);

  return (
    <div className="gantt-chart">
      <h2>Project Timeline</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
}
