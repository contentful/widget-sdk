import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '18',
    height: '18',
    viewBox: '-1 -1 20 20'
  },
  [
    h('path', {
      d: 'M1.9 3v2.2h3.8v9h2.2v-9h3.8V3H1.9zm14.2 3.8H9.4V9h2.2v5.2h2.2V9H16V6.8z'
    })
  ]
);
