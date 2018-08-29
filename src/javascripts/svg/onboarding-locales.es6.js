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
    h('circle', {
      fill: 'none',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      cx: '25.5',
      cy: '16',
      r: '14'
    }),
    h('path', {
      fill: '#E4F7F1',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d:
        'M26.2 2s1.9 2.8 1.1 5.4c-2.1 1.3-2.6 4.3-2.1 3.9.4-.4 2.6.9 2.6.9.9 0 1.3-1.3 1.3-1.3 2.2 0 1.3 4.7 1.7 5.2.4.4 1.7-.4 1.7.9s-.4 2.1-.4 2.1c2.2 2.2 0 4.3-.4 4.7-.4.4-3-.4-3.4-.9-.4-.4-.4-1.3-.9-1.7-.4-.4-2.1-.4-2.1-.4-1.7-1.7-2.6 0-3.9 1.3-1.3 1.3-3-.4-3-.4s-3-3-1.3-5.6c1.7-2.6 2.6-1.7 2.6-1.7 1.7 0 2.6-2.6 3.4-3.4 0 0-2.6-3.4-3-2.1-.4 1.3-1.5 1.7-2.6.9-1.5-1.2 1.6-5.9 1.6-5.9'
    }),
    h('path', {
      fill: '#EEFFF7',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d: 'M15.5 6l-5-5'
    }),
    h('path', {
      fill: 'none',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d: 'M35.5 26l6 6c0 10-15 9-15 9'
    }),
    h('path', {
      fill: 'none',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d: 'M38.9 29.4c-7.4 7.4-19.5 7.4-26.9 0C4.6 22 4.6 10 12.1 2.6'
    }),
    h('path', {
      fill: 'none',
      stroke: '#0EB87F',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d: 'M24 47h16.5c0-2.8-6.3-6-14-6s-14 3.2-14 6H18'
    })
  ]
);
