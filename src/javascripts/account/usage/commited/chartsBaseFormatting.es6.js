import formatNumber from './formatNumber.es6';

export default {
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
      formatter: number => formatNumber(number, 1),
      verticalAlign: 'bottom',
      margin: 15
    },
    axisTick: { length: 8 },
    axisLine: { show: false },
    splitNumber: 4
  }
};
