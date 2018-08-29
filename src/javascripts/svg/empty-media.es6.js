import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '200',
    height: '200',
    viewBox: '0 0 200 200'
  },
  [
    h('circle', {
      cx: '100',
      cy: '100',
      r: '100',
      fill: '#f4fffb'
    }),
    h('circle', {
      cx: '100',
      cy: '100',
      r: '70',
      fill: '#e6fff4'
    }),
    h('path', {
      d:
        'M30 117.3c-.8-.8-1.9-1-2.9-.6s-1.6 1.4-1.6 2.4v11.6c0 1.5 1.2 2.7 2.7 2.7 1.5 0 2.6-1.2 2.6-2.7v-5.4c1 .4 2.2.3 3-.5 1-1 1-2.7 0-3.7l-3.8-3.8zM25 176c-1-.4-2.1-.2-2.9.6l-3.8 3.8c-1 1-1 2.7 0 3.7.5.5 1.2.8 1.9.8.4 0 .8-.1 1.1-.2v5.4c0 1.5 1.2 2.7 2.7 2.7 1.5 0 2.6-1.2 2.6-2.7v-11.6c0-1.1-.7-2.1-1.6-2.5zM38.2 41.5l1.6-1.6c1.1-1.1 1.1-2.9 0-4s-2.9-1.1-4 0l-1.6 1.6-1.6-1.6c-1.1-1.1-2.9-1.1-4 0-.5.5-.8 1.3-.8 2 0 .8.3 1.5.8 2l1.6 1.6-1.6 1.6c-1.1 1.1-1.1 2.9 0 4 .6.6 1.3.8 2 .8s1.5-.3 2-.8l1.6-1.6 1.6 1.6c.5.5 1.2.8 2 .8s1.5-.3 2-.8c1.1-1.1 1.1-2.9 0-4l-1.6-1.6zM176 173.9c-1.5 0-2.7 1.2-2.7 2.7 0 1.5 1.2 2.7 2.6 2.7h.1c.5 0 1 .4 1 1v4.4c0 .5-.4 1-1 1h-.1c-.5 0-1-.4-1-1 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 3.5 2.8 6.3 6.3 6.3h.1c3.5 0 6.3-2.8 6.3-6.3v-4.4c.1-3.6-2.8-6.4-6.2-6.4zM155.1 63h-5.6c-2.6 0-4.7-2.1-4.7-4.7v-5.6c0-2.6 2.1-4.7 4.7-4.7h5.6c2.6 0 4.7 2.1 4.7 4.7v5.6c0 2.6-2.1 4.7-4.7 4.7zm-5.6-11.2c-.5 0-.9.4-.9.9v5.6c0 .5.4.9.9.9h5.6c.5 0 .9-.4.9-.9v-5.6c0-.5-.4-.9-.9-.9h-5.6z',
      fill: '#c0f2d6'
    }),
    h('path', {
      d:
        'M73 128.5h52.5c5 0 9-4 9-9v-36h-54V121c0 4.1-3.4 7.5-7.5 7.5s-7.5-3.4-7.5-7.5V71.5h21v6h39v6',
      fill: 'none',
      stroke: '#0eb87f',
      strokeWidth: '3',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10'
    }),
    h('path', {
      fill: 'none',
      stroke: '#0eb87f',
      strokeWidth: '3',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10',
      d: 'M92.5 116.5h30L115 100l-9 10.5-6-3z'
    }),
    h('circle', {
      cx: '98.5',
      cy: '97',
      r: '4.5',
      fill: 'none',
      stroke: '#0eb87f',
      strokeWidth: '3',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10'
    }),
    h('path', {
      d: 'M125.5 77.5v6h-45V121c0 4.1-3.4 7.5-7.5 7.5-4.2 0-7.5-3.4-7.5-7.5V71.5h21v6h39z',
      fill: '#c0f2d6',
      stroke: '#0eb87f',
      strokeWidth: '3',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeMiterlimit: '10'
    })
  ]
);
