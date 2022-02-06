import React, { FC, useEffect, useRef, useState } from 'react'
import { select, selectAll, Selection } from 'd3-selection'
import { scaleLinear, scaleTime } from 'd3-scale'
import { extent, map, max, range } from 'd3-array'
import { axisLeft, axisBottom } from 'd3-axis'
import 'd3-transition'

import '../styles/Graph.module.css'
import { CurveFactory, curveLinear, curveMonotoneX, curveNatural, curveStep, line as d3Line } from 'd3-shape'

type TimeData = {
    timestamp: number
    value: number
}

const Graph: FC<{
    data: TimeData[]
    x?: (d: TimeData) => number
    y?: (d: TimeData) => number
    isDefined?: (d: TimeData, index: number) => boolean
    curve?: CurveFactory
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number
    width?: number
    height?: number
    xDomain?: [number, number] | [undefined, undefined]
    xRange?: [number, number]
    yDomain?: [number, number] | [undefined, undefined]
    yRange?: [number, number]
    yFormat?
    yLabel?: string
    color?: string
    strokeLinecap?: string
    strokeLinejoin?: string
    strokeWidth?: number
    strokeOpacity?: number
}> = ({
    data,
    x = d => d.timestamp, // given d in data, returns the (temporal) x-value
    y = d => d.value, // given d in data, returns the (quantitative) y-value
    isDefined, // for gaps in data
    curve = curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 60, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    yFormat, // a format specifier string for the y-axis
    yLabel = '', // a label for the y-axis
    color = 'white', // stroke color of line
    strokeLinecap = 'round', // stroke line cap of the line
    strokeLinejoin = 'round', // stroke line join of the line
    strokeWidth = 1.5, // stroke width of line, in pixels
    strokeOpacity = 1, // stroke opacity of line
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const [svg, setSvg] = useState<Selection<SVGSVGElement | null, unknown, null, undefined> | null>(null)

    const X = map(data, x)
    const Y = map(data, y)
    const I = range(X.length)
    if (isDefined === undefined) isDefined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i])
    const D = map(data, isDefined)

    // Compute default domains.
    if (xDomain === undefined) xDomain = extent(X)!
    if (yDomain === undefined) yDomain = [0, max(Y)!]

    useEffect(() => {
        if (!svg) {
            setSvg(select(svgRef.current))
            return
        }

        console.log(svg)

        // Construct scales and axes.
        const xScale = scaleTime(xDomain as [number, number], xRange)
        const yScale = scaleLinear(yDomain as [number, number], yRange)

        const xAxis = axisBottom(xScale)
            .ticks(width / 80)
            .tickSizeOuter(0)
        const yAxis = axisLeft(yScale).ticks(height / 40, yFormat)

        // Construct a line generator.
        const line = d3Line()
            .defined((_, i) => D[i])
            .curve(curve)
            .x((_, i) => xScale(X[i]))
            .y((_, i) => yScale(Y[i]))

        svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#3b76ef').style('rx', '10px')

        const xAxisG = svg
            .append('g')
            .attr('transform', `translate(0,${height - marginBottom})`)
            .call(xAxis)

        xAxisG.selectAll('line').style('stroke', 'white')
        xAxisG.selectAll('path').style('stroke', 'white')
        xAxisG.selectAll('text').style('fill', 'white')

        const yAxisG = svg
            .append('g')
            .attr('transform', `translate(${marginLeft},0)`)
            .call(yAxis)
            .call(g => g.select('.domain').remove())
            .call(g =>
                g
                    .selectAll('.tick line')
                    .clone()
                    .attr('x2', width - marginLeft - marginRight)
                    .attr('stroke-opacity', 0.5)
            )
        yAxisG.selectAll('line').style('stroke', 'white')
        yAxisG.selectAll('path').style('stroke', 'white')
        yAxisG.selectAll('text').style('fill', 'white')

        yAxisG.call(g =>
            g
                .append('text')
                .attr('x', -marginLeft)
                .attr('y', 10)
                .attr('fill', 'white')
                .attr('text-anchor', 'start')
                .text(yLabel)
        )

        // Draw main Line
        svg.append('path')
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', strokeWidth)
            .attr('stroke-linecap', strokeLinecap)
            .attr('stroke-linejoin', strokeLinejoin)
            .attr('stroke-opacity', strokeOpacity)
            // @ts-ignore
            .attr('d', line(I))

        // Draw rects on each data point
        svg.append('g')
            .selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('width', 5)
            .attr('height', 5)
            .attr('x', d => xScale(d.timestamp) - 2.5)
            .attr('y', d => yScale(d.value) - 2.5)
            .attr('fill', 'white')
    }, [svg])

    return (
        <div>
            <svg ref={svgRef} width={width} height={height} />
        </div>
    )
}

export default Graph
