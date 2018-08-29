import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '12',
    height: '8',
    viewBox: '0 0 12 8',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h('path', {
      d: 'M4.667 8h2.666V6.667H4.667V8zM0 0v1.333h12V0H0zm2 4.667h8V3.333H2v1.334z',
      fill: 'currentColor',
      fillRule: 'nonzero'
    })
  ]
);
