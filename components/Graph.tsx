import React, { FC, useEffect, useRef, useState } from 'react'
import { select, selectAll, Selection } from 'd3-selection'
import { scaleLinear, scaleBand, scaleUtc, ScaleTime } from 'd3-scale'
import { extent, map, max, range } from 'd3-array'
import { axisLeft, axisBottom } from 'd3-axis'
import { easeBounce, easeElastic, easeQuadIn, easeQuadOut, easeSinOut } from 'd3-ease'
import 'd3-transition'

import '../styles/Graph.module.css'
import { CurveFactory, curveLinear, curveMonotoneX, curveNatural, curveStep, line as d3Line } from 'd3-shape'

const dimensions = {
    width: 800,
    height: 500,
    chartWidth: 700,
    chartHeight: 450,
    marginLeft: 75,
    marginTop: 50,
}

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
    curve = curveNatural, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 50, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    yFormat, // a format specifier string for the y-axis
    yLabel = '', // a label for the y-axis
    color = 'currentColor', // stroke color of line
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
        const xScale = scaleUtc(xDomain as [number, number], xRange)
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

        svg.append('g')
            .attr('transform', `translate(0,${height - marginBottom})`)
            .call(xAxis)

        svg.append('g')
            .attr('transform', `translate(${marginLeft},0)`)
            .call(yAxis)
            .call(g => g.select('.domain').remove())
            .call(g =>
                g
                    .selectAll('.tick line')
                    .clone()
                    .attr('x2', width - marginLeft - marginRight)
                    .attr('stroke-opacity', 0.1)
            )
            .call(g =>
                g
                    .append('text')
                    .attr('x', -marginLeft)
                    .attr('y', 10)
                    .attr('fill', 'currentColor')
                    .attr('text-anchor', 'start')
                    .text(yLabel)
            )

        svg.append('path')
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', strokeWidth)
            .attr('stroke-linecap', strokeLinecap)
            .attr('stroke-linejoin', strokeLinejoin)
            .attr('stroke-opacity', strokeOpacity)
            .attr('d', line(I))
    }, [svg])

    return (
        <div>
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        </div>
    )
}

export default Graph
