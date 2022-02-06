import { FC } from 'react'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

type TimeData = {
    timestamp: number
    value: number
}

const LineChart: FC<{
    dataSets: {
        name: string
        data: TimeData[]
    }[]
    title: string
    width?: number
    height?: number
}> = ({ dataSets, title, width, height = 350 }) => {
    const series = dataSets.map(s => {
        return {
            name: s.name,
            data: s.data.map(e => [e.timestamp, e.value]),
        }
    })
    const options = {
        chart: {
            type: 'area',
            stacked: false,
            height: height,
            width: width,
            zoom: {
                type: 'x',
                enabled: height! > 250,
                autoScaleYaxis: true,
            },
        },
        dataLabels: {
            enabled: false,
        },
        title: {
            text: title,
            align: 'left',
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0.5,
                opacityTo: 0,
                stops: [0, 90, 100],
            },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => Math.floor(val).toLocaleString(),
            },
            min: 0,
            tickAmount: height < 250 ? Math.floor(height / 30) : undefined,
        },
        xaxis: {
            type: 'datetime',
        },
        tooltip: {
            shared: false,
            y: {
                formatter: (val: number) => Math.floor(val).toLocaleString(),
            },
        },
        markers: {
            size: 4,
            strokeColors: '#fff',
            strokeWidth: 1,
            strokeOpacity: 0.9,
            strokeDashArray: 0,
            fillOpacity: 1,
            discrete: [],
            shape: 'circle',
            radius: 2,
            offsetX: 0,
            offsetY: 0,
            onClick: undefined,
            onDblClick: undefined,
            showNullDataPoints: true,
            hover: {
                size: undefined,
                sizeOffset: 3,
            },
        },
    }

    return (
        <div id='chart'>
            {/* @ts-ignore */}
            <Chart options={options} series={series} type='area' height={height} />
        </div>
    )
}

export default LineChart
