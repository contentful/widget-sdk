import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '48',
    height: '48',
    viewBox: '-1 -1 50 50'
  },
  [
    h('path', {
      fill: '#E4F7F1',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d: 'M14 47h20L24 27z'
    }),
    h('path', {
      fill: 'none',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d:
        'M24 27v-4M14 47l15-10M34 47L19 37M20.5 34h7M40.6 39.9c3.3-3.5 5.5-7.9 6.2-12.9M46.8 21C45.3 9.7 35.7 1 24 1 11.3 1 1 11.3 1 24c0 6.2 2.4 11.8 6.4 15.9'
    }),
    h('path', {
      fill: 'none',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d:
        'M36.2 32.7C38 30.3 39 27.3 39 24c0-3.1-.9-5.9-2.5-8.3M32.3 11.5C29.9 9.9 27.1 9 24 9 15.7 9 9 15.7 9 24c0 3.3 1 6.3 2.8 8.7M21 17.7c-2.3 1.1-4 3.5-4 6.3M31 24c0-2.8-1.7-5.2-4-6.3'
    })
  ]
);
