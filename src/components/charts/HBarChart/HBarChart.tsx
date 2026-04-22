'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import styles from './HBarChart.module.scss';

export interface BarDatum {
	/** Stable bucket id (e.g. type key) for navigation / filters */
	id: string;
	label: string;
	value: number;
	color: string;
}

interface HBarChartProps {
	data: BarDatum[];
	className?: string;
	onRowClick?: (row: BarDatum) => void;
}

const ROW_H = 26;
const LABEL_W = 160;
const VALUE_W = 42;
const BAR_GAP = 5;
const MARGIN = { top: 4, right: VALUE_W + 8, bottom: 4, left: LABEL_W };

/** Match dashboard / donut narrow layout — wrap category labels in the SVG */
const NARROW_BREAKPOINT = 466;
const LABEL_FONT_PX = 11.5;
const LABEL_LINE_HEIGHT_PX = LABEL_FONT_PX * 1.2;

/** Greedy word-wrap for SVG tspans; breaks very long tokens into chunks */
function wrapLabelToLines(label: string, maxWidthPx: number): string[] {
	const avgCharPx = LABEL_FONT_PX * 0.52;
	const maxChars = Math.max(4, Math.floor(maxWidthPx / avgCharPx));
	const words = label.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return [''];

	const lines: string[] = [];
	let line = '';

	const flush = () => {
		if (line) {
			lines.push(line);
			line = '';
		}
	};

	const pushLongWord = (word: string) => {
		for (let i = 0; i < word.length; i += maxChars) {
			lines.push(word.slice(i, i + maxChars));
		}
	};

	for (const word of words) {
		if (word.length > maxChars) {
			flush();
			pushLongWord(word);
			continue;
		}
		const candidate = line ? `${line} ${word}` : word;
		if (candidate.length <= maxChars) {
			line = candidate;
		} else {
			flush();
			line = word;
		}
	}
	flush();
	return lines.length ? lines : [''];
}

type RowLayout = {
	top: number;
	inner: number;
	rowH: number;
	lines: string[];
	datum: BarDatum;
};

export function HBarChart({ data, className, onRowClick }: HBarChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const [resizeTick, setResizeTick] = useState(0);

	const sorted = [...data].sort((a, b) => b.value - a.value);
	const total = data.reduce((s, d) => s + d.value, 0);

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setResizeTick((n) => n + 1));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	useEffect(() => {
		if (!svgRef.current || !containerRef.current || sorted.length === 0 || total === 0) return;

		const containerW = containerRef.current.getBoundingClientRect().width || 600;
		const narrow = containerW <= NARROW_BREAKPOINT;
		const labelSlotW = LABEL_W - 12;

		const layouts: RowLayout[] = [];
		let cum = 0;
		for (const datum of sorted) {
			const lines = narrow ? wrapLabelToLines(datum.label, labelSlotW) : [datum.label];
			const inner = Math.max(ROW_H - BAR_GAP, lines.length * LABEL_LINE_HEIGHT_PX);
			const rowH = inner + BAR_GAP;
			layouts.push({
				top: cum,
				inner,
				rowH,
				lines,
				datum,
			});
			cum += rowH;
		}

		const innerW = containerW - MARGIN.left - MARGIN.right;
		const innerH = cum;
		const svgH = innerH + MARGIN.top + MARGIN.bottom;

		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove();
		svg.attr('height', svgH).attr('width', containerW);

		const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

		const xMax = d3.max(sorted, (d) => d.value) ?? 1;
		const x = d3.scaleLinear().domain([0, xMax]).range([0, innerW]);

		const rows = g
			.selectAll<SVGGElement, RowLayout>('g.row')
			.data(layouts)
			.enter()
			.append('g')
			.attr('class', 'row')
			.attr('transform', (d) => `translate(0,${d.top + BAR_GAP / 2})`);

		// track bg
		rows
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', innerW)
			.attr('height', (d) => d.inner)
			.attr('fill', 'rgba(255,255,255,0.02)')
			.attr('rx', 3);

		// filled bar — animated
		const bars = rows
			.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('height', (d) => d.inner)
			.attr('rx', 3)
			.attr('fill', (d) => d.datum.color)
			.attr('opacity', 0.82)
			.attr('width', 0);

		bars
			.transition()
			.duration(600)
			.delay((_, i) => i * 35)
			.ease(d3.easeCubicOut)
			.attr('width', (d) => x(d.datum.value));

		// label (left) — multi-line tspans when narrow
		rows.each(function (d) {
			const row = d3.select(this);
			const text = row
				.append('text')
				.attr('class', 'label')
				.attr('x', -8)
				.attr('y', d.inner / 2)
				.attr('text-anchor', 'end')
				.attr('fill', '#9da3b4')
				.attr('font-size', `${LABEL_FONT_PX}px`)
				.attr('font-family', 'inherit');

			const n = d.lines.length;
			d.lines.forEach((line, j) => {
				text
					.append('tspan')
					.attr('x', -8)
					.attr('dy', j === 0 ? `${-((n - 1) / 2) * 1.2}em` : '1.2em')
					.text(line);
			});
		});

		// count label (right, outside)
		const valueLabels = rows
			.append('text')
			.attr('class', 'val')
			.attr('x', innerW + 8)
			.attr('y', (d) => d.inner / 2)
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
				const interp = d3.interpolateNumber(0, d.datum.value);
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
			.on('mouseenter', function (event: MouseEvent, layout: RowLayout) {
				d3.select(this).select('rect:nth-child(2)').attr('opacity', 1);
				const d = layout.datum;
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

		if (onRowClick) {
			rows.style('cursor', 'pointer').on('click', (event: MouseEvent, layout: RowLayout) => {
				event.stopPropagation();
				onRowClick(layout.datum);
			});
		}

		return () => {
			tooltip.remove();
			svg.selectAll('*').interrupt().remove();
		};
	}, [sorted, total, onRowClick, resizeTick]);

	if (total === 0) return <div className={cn(styles.empty, className)}>No data</div>;

	return (
		<div className={cn(styles.wrapper, className)} ref={containerRef}>
			<div className={styles.chart}>
				<svg ref={svgRef} />
			</div>
		</div>
	);
}
