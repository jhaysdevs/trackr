'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';
import styles from './DonutChart.module.scss';

export interface DonutSlice {
	label: string;
	value: number;
	color: string;
}

interface DonutChartProps {
	data: DonutSlice[];
	className?: string;
}

const SIZE = 220;
const OUTER_R = SIZE / 2 - 8;
const INNER_R = OUTER_R * 0.58;
const PAD_ANGLE = 0.025;

export function DonutChart({ data, className }: DonutChartProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const activeSlices = data.filter((d) => d.value > 0);
	const total = data.reduce((s, d) => s + d.value, 0);

	useEffect(() => {
		if (!svgRef.current || activeSlices.length === 0) return;

		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove();

		const cx = SIZE / 2;
		const cy = SIZE / 2;

		const g = svg
			.attr('viewBox', `0 0 ${SIZE} ${SIZE}`)
			.append('g')
			.attr('transform', `translate(${cx},${cy})`);

		const pie = d3
			.pie<DonutSlice>()
			.value((d) => d.value)
			.sort(null)
			.padAngle(PAD_ANGLE);

		const arc = d3
			.arc<d3.PieArcDatum<DonutSlice>>()
			.innerRadius(INNER_R)
			.outerRadius(OUTER_R)
			.cornerRadius(3);

		const arcHover = d3
			.arc<d3.PieArcDatum<DonutSlice>>()
			.innerRadius(INNER_R - 2)
			.outerRadius(OUTER_R + 7)
			.cornerRadius(3);

		const arcs = pie(activeSlices);

		// ── Center label ──
		const centerVal = g
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '-0.15em')
			.attr('fill', '#e8eaf0')
			.attr('font-size', '26px')
			.attr('font-weight', '600')
			.attr('font-family', 'inherit')
			.text(total.toLocaleString());

		g.append('text')
			.attr('text-anchor', 'middle')
			.attr('dy', '1.3em')
			.attr('fill', '#5c6070')
			.attr('font-size', '11px')
			.attr('font-family', 'inherit')
			.text('total');

		// ── Tooltip ──
		const tooltip = d3
			.select('body')
			.append('div')
			.attr('class', styles.tooltip)
			.style('opacity', '0')
			.style('position', 'fixed')
			.style('pointer-events', 'none');

		// ── Slices ──
		const paths = g
			.selectAll<SVGPathElement, d3.PieArcDatum<DonutSlice>>('path')
			.data(arcs)
			.enter()
			.append('path')
			.attr('fill', (d) => d.data.color)
			.attr('opacity', 0.88)
			.style('cursor', 'pointer');

		// entrance animation — each slice grows from its start angle
		paths
			.attr('d', (d) => arc({ ...d, endAngle: d.startAngle }))
			.transition()
			.duration(650)
			.delay((_, i) => i * 55)
			.ease(d3.easeCubicOut)
			.attrTween('d', function (d) {
				const interp = d3.interpolate(d.startAngle, d.endAngle);
				return (t) => arc({ ...d, endAngle: interp(t) }) ?? '';
			});

		// hover
		paths
			.on('mouseenter', function (event: MouseEvent, d) {
				d3.select(this)
					.raise()
					.transition()
					.duration(120)
					.attr('opacity', 1)
					.attr('d', arcHover(d) ?? '');

				const pct = ((d.data.value / total) * 100).toFixed(1);
				tooltip
					.html(
						`<strong>${d.data.label}</strong><span>${d.data.value.toLocaleString()} (${pct}%)</span>`
					)
					.style('opacity', '1')
					.style('left', `${event.clientX}px`)
					.style('top', `${event.clientY}px`);

				centerVal.text(d.data.value.toLocaleString());
			})
			.on('mousemove', function (event: MouseEvent) {
				tooltip.style('left', `${event.clientX}px`).style('top', `${event.clientY}px`);
			})
			.on('mouseleave', function (_, d) {
				d3.select(this)
					.transition()
					.duration(120)
					.attr('opacity', 0.88)
					.attr('d', arc(d) ?? '');

				tooltip.style('opacity', '0');
				centerVal.text(total.toLocaleString());
			});

		return () => {
			tooltip.remove();
			svg.selectAll('*').interrupt().remove();
		};
	}, [activeSlices, total]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className={cn(styles.wrapper, className)}>
			<div className={styles.chartRow}>
				<div className={styles.svgWrap}>
					{activeSlices.length === 0 ? (
						<div className={styles.empty}>No data</div>
					) : (
						<svg ref={svgRef} />
					)}
				</div>
				<div className={styles.legend}>
					{data.map((d) => (
						<div key={d.label} className={styles.legendItem}>
							<div className={styles.legendLeft}>
								<span className={styles.dot} style={{ background: d.color }} />
								<span className={styles.label}>{d.label}</span>
							</div>
							<span className={styles.count}>{d.value.toLocaleString()}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
