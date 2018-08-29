import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '9',
    height: '3',
    viewBox: '-1 -1 11 5'
  },
  [
    h('path', {
      d: 'M0 2.5h9',
      stroke: '#424b57',
      strokeDasharray: '1,3'
    })
  ]
);
