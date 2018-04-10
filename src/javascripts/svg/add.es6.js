import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    height: '24',
    viewBox: '0 0 24 24',
    width: '24',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h('path', {
      d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
    }),
    h('path', {
      d: 'M0 0h24v24H0z',
      fill: 'none'
    })
  ]
);
