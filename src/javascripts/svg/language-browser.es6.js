import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '30',
    height: '24',
    viewBox: '-1 -1 32 26'
  },
  [
    h('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      fill: '#8091A5',
      d:
        'M27 0H3C1.4 0 0 1.4 0 3v18c0 1.6 1.4 3 3 3h24c1.6 0 3-1.4 3-3V3c0-1.6-1.4-3-3-3zM3 21h16.5v-6H3v6zm0-7.5h16.5v-6H3v6zM21 21h6V7.5h-6V21z'
    })
  ]
);
