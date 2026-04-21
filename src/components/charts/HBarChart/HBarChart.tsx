'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import styles from './HBarChart.module.scss';

export interface BarDatum {
	label: string;
	value: number;
	color: string;
}

interface HBarChartProps {
	data: BarDatum[];
	className?: string;
}

const ROW_H = 26;
const LABEL_W = 160;
const VALUE_W = 42;
const BAR_GAP = 5;
const MARGIN = { top: 4, right: VALUE_W + 8, bottom: 4, left: LABEL_W };

export function HBarChart({ data, className }: HBarChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);

	const sorted = [...data].sort((a, b) => b.value - a.value);
	const total = data.reduce((s, d) => s + d.value, 0);

	useEffect(() => {
		if (!svgRef.current || !containerRef.current || sorted.length === 0 || total === 0) return;

		const containerW = containerRef.current.getBoundingClientRect().width || 600;
		const innerW = containerW - MARGIN.left - MARGIN.right;
		const innerH = sorted.length * ROW_H;
		const svgH = innerH + MARGIN.top + MARGIN.bottom;

		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove();
		svg.attr('height', svgH).attr('width', containerW);

		const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

		const xMax = d3.max(sorted, (d) => d.value) ?? 1;
		const x = d3.scaleLinear().domain([0, xMax]).range([0, innerW]);

		const rows = g
			.selectAll<SVGGElement, BarDatum>('g.row')
			.data(sorted)
			.enter()
			.append('g')
			.attr('class', 'row')
			.attr('transform', (_, i) => `translate(0,${i * ROW_H + BAR_GAP / 2})`);

		// track bg
		rows
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', innerW)
			.attr('height', ROW_H - BAR_GAP)
			.attr('fill', 'rgba(255,255,255,0.02)')
			.attr('rx', 3);

		// filled bar — animated
		const bars = rows
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('height', ROW_H - BAR_GAP)
			.attr('rx', 3)
			.attr('fill', (d) => d.color)
			.attr('opacity', 0.82)
			.attr('width', 0);

		bars
			.transition()
			.duration(600)
			.delay((_, i) => i * 35)
			.ease(d3.easeCubicOut)
			.attr('width', (d) => x(d.value));

		// label (left, outside bar area)
		g.selectAll<SVGTextElement, BarDatum>('text.label')
			.data(sorted)
			.enter()
			.append('text')
			.attr('class', 'label')
			.attr('x', -8)
			.attr('y', (_, i) => i * ROW_H + (ROW_H - BAR_GAP) / 2 + BAR_GAP / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'end')
			.attr('fill', '#9da3b4')
			.attr('font-size', '11.5px')
			.attr('font-family', 'inherit')
			.text((d) => d.label);

		// count label (right, outside)
		const valueLabels = g
			.selectAll<SVGTextElement, BarDatum>('text.val')
			.data(sorted)
			.enter()
			.append('text')
			.attr('class', 'val')
			.attr('x', innerW + 8)
			.attr('y', (_, i) => i * ROW_H + (ROW_H - BAR_GAP) / 2 + BAR_GAP / 2)
			.attr('dy', '0.35em')
			.attr('text-anchor', 'start')
			.attr('fill', '#e8eaf0')
			.attr('font-size', '11px')
			.attr('font-weight', '500')
			.attr('font-family', 'inherit')
			.attr('font-variant-numeric', 'tabular-nums')
			.text('0');

		valueLabels
			.transition()
			.duration(600)
			.delay((_, i) => i * 35)
			.ease(d3.easeCubicOut)
			.tween('text', function (d) {
				const interp = d3.interpolateNumber(0, d.value);
				return (t) => {
					this.textContent = Math.round(interp(t)).toLocaleString();
				};
			});

		// tooltip
		const tooltip = d3
			.select('body')
			.append('div')
			.attr('class', styles.tooltip)
			.style('opacity', '0')
			.style('position', 'fixed')
			.style('pointer-events', 'none');

		rows
			.on('mouseenter', function (event: MouseEvent, d) {
				d3.select(this).select('rect:nth-child(2)').attr('opacity', 1);
				const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
				tooltip
					.html(
						`<strong>${d.label}</strong><span>${d.value.toLocaleString()} tasks &middot; ${pct}%</span>`
					)
					.style('opacity', '1')
					.style('left', `${event.clientX}px`)
					.style('top', `${event.clientY}px`);
			})
			.on('mousemove', function (event: MouseEvent) {
				tooltip.style('left', `${event.clientX}px`).style('top', `${event.clientY}px`);
			})
			.on('mouseleave', function () {
				d3.select(this).select('rect:nth-child(2)').attr('opacity', 0.82);
				tooltip.style('opacity', '0');
			});

		return () => {
			tooltip.remove();
			svg.selectAll('*').interrupt().remove();
		};
	}, [sorted, total]); // eslint-disable-line react-hooks/exhaustive-deps

	if (total === 0) return <div className={cn(styles.empty, className)}>No data</div>;

	return (
		<div className={cn(styles.wrapper, className)} ref={containerRef}>
			<div className={styles.chart}>
				<svg ref={svgRef} />
			</div>
		</div>
	);
}
