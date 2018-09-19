import { shorten } from 'utils/NumberUtils.es6';

export default {
  axisPointer: {
    zlevel: -1,
    lineStyle: {
      color: '#263545'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    axisTick: { alignWithLabel: true, interval: 6 },
    axisLabel: { interval: 6 }
  },
  yAxis: {
    splitLine: {
      show: false
    },
    position: 'right',
    offset: 10,
    axisLabel: {
      formatter: shorten,
      verticalAlign: 'bottom',
      margin: 15
    },
    axisTick: { length: 8 },
    axisLine: { show: false },
    splitNumber: 4
  }
};

export const seriesBaseFormatting = {
  type: 'line',
  lineStyle: {
    width: 2
  },
  itemStyle: {
    borderColor: '#fff',
    borderWidth: 2
  },
  symbolSize: 6,
  showSymbol: false
};
