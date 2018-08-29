import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '26',
    height: '6',
    viewBox: '-1 -1 28 8'
  },
  [
    h('path', {
      fill: '#8091A5',
      fillRule: 'evenodd',
      d:
        'M3 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
    })
  ]
);
