import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '220',
    height: '200',
    viewBox: '0 0 220 200'
  },
  [
    h('circle', {
      cx: '110',
      cy: '100',
      r: '100',
      fill: '#f4fffb'
    }),
    h('circle', {
      cx: '110',
      cy: '100',
      r: '70',
      fill: '#e6fff4'
    }),
    h('path', {
      d:
        'M25 24.4c-.8-.8-1.9-1-2.9-.6s-1.6 1.4-1.6 2.4v11.6c0 1.5 1.2 2.7 2.7 2.7 1.5 0 2.6-1.2 2.6-2.7v-5.4c1 .4 2.2.3 3-.5 1-1 1-2.7 0-3.7L25 24.4zM49.4 144.7c-1-.4-2.1-.2-2.9.6l-3.8 3.8c-1 1-1 2.7 0 3.7.5.5 1.2.8 1.9.8.4 0 .8-.1 1.1-.2v5.4c0 1.5 1.2 2.7 2.7 2.7 1.5 0 2.6-1.2 2.6-2.7v-11.6c0-1.1-.6-2.1-1.6-2.5zM148.5 38.5l1.6-1.6c1.1-1.1 1.1-2.9 0-4s-2.9-1.1-4 0l-1.6 1.6-1.6-1.6c-1.1-1.1-2.9-1.1-4 0-.5.5-.8 1.3-.8 2 0 .8.3 1.5.8 2l1.6 1.6-1.6 1.6c-1.1 1.1-1.1 2.9 0 4 .6.6 1.3.8 2 .8s1.5-.3 2-.8l1.6-1.6 1.6 1.6c.5.5 1.2.8 2 .8s1.5-.3 2-.8c1.1-1.1 1.1-2.9 0-4l-1.6-1.6zM212 106.9c-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.6 2.7h.1c.5 0 1 .4 1 1v4.4c0 .5-.4 1-1 1h-.1c-.5 0-1-.4-1-1 0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 3.5 2.8 6.3 6.3 6.3h.1c3.5 0 6.3-2.8 6.3-6.3v-4.4c.1-3.6-2.8-6.4-6.2-6.4zM165.1 196h-5.6c-2.6 0-4.7-2.1-4.7-4.7v-5.6c0-2.6 2.1-4.7 4.7-4.7h5.6c2.6 0 4.7 2.1 4.7 4.7v5.6c0 2.6-2.1 4.7-4.7 4.7zm-5.6-11.2c-.5 0-.9.4-.9.9v5.6c0 .5.4.9.9.9h5.6c.5 0 .9-.4.9-.9v-5.6c0-.5-.4-.9-.9-.9h-5.6zM144.5 104.5v-9h-9.7c-.6-2.6-1.7-6.5-3-8.8l6.9-6.9-8.5-8.5-6.9 6.9c-2.2-1.4-6.2-2.4-8.8-3v-9.7h-9v9.7c-2.6.6-6.5 1.7-8.8 3l-6.9-6.9-8.5 8.5 6.9 6.9c-1.4 2.2-2.4 6.2-3 8.8h-9.7v9h9.7c.6 2.6 1.7 6.5 3 8.8l-6.9 6.9 8.5 8.5 6.9-6.9c2.2 1.4 6.2 2.4 8.8 3v9.7h9v-9.7c2.6-.6 6.5-1.7 8.8-3l6.9 6.9 8.5-8.5-6.9-6.9c1.4-2.2 2.4-6.2 3-8.8h9.7zm-34.5 9c-7.5 0-13.5-6-13.5-13.5s6-13.5 13.5-13.5 13.5 6 13.5 13.5-6 13.5-13.5 13.5z',
      fill: '#c0f2d6'
    }),
    h('path', {
      d:
        'M114.5 136h-9c-.8 0-1.5-.7-1.5-1.5v-8.6c-2.4-.6-5-1.4-7-2.3l-6.1 6.1c-.6.6-1.5.6-2.1 0l-8.5-8.5c-.3-.3-.4-.7-.4-1.1 0-.4.2-.8.4-1.1l6.1-6.1c-1-2-1.7-4.6-2.3-7h-8.6c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5h8.6c.6-2.4 1.4-5 2.3-7l-6.1-6.1c-.3-.3-.4-.7-.4-1.1s.2-.8.4-1.1l8.5-8.5c.6-.6 1.5-.6 2.1 0l6.1 6.1c2-1 4.6-1.7 7-2.3v-8.6c0-.8.7-1.5 1.5-1.5h9c.8 0 1.5.7 1.5 1.5v8.6c2.4.6 5 1.4 7 2.3l6.1-6.1c.6-.6 1.5-.6 2.1 0l8.5 8.5c.3.3.4.7.4 1.1 0 .4-.2.8-.4 1.1l-6.1 6.1c1 2 1.7 4.6 2.3 7h8.6c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-8.6c-.6 2.4-1.4 5-2.3 7l6.1 6.1c.6.6.6 1.5 0 2.1l-8.5 8.5c-.6.6-1.5.6-2.1 0l-6.1-6.1c-2 1-4.6 1.7-7 2.3v8.6c0 .9-.7 1.6-1.5 1.6zm-7.5-3h6v-8.2c0-.7.5-1.3 1.1-1.5 1.7-.4 6.1-1.5 8.3-2.8.6-.4 1.4-.3 1.8.2l5.8 5.8 6.4-6.4-5.8-5.8c-.5-.5-.6-1.3-.2-1.8 1.4-2.2 2.4-6.7 2.8-8.3.2-.7.8-1.1 1.5-1.1h8.2v-6h-8.2c-.7 0-1.3-.5-1.5-1.1-.4-1.7-1.5-6.1-2.8-8.3-.4-.6-.3-1.4.2-1.8l5.8-5.8-6.4-6.4-5.8 5.8c-.5.5-1.3.6-1.8.2-2.2-1.4-6.7-2.4-8.3-2.8-.7-.2-1.1-.8-1.1-1.5V67h-6v8.2c0 .7-.5 1.3-1.1 1.5-1.7.4-6.1 1.5-8.3 2.8-.6.4-1.4.3-1.8-.2L90 73.5l-6.4 6.4 5.8 5.8c.5.5.6 1.3.2 1.8-1.4 2.2-2.4 6.7-2.8 8.3-.2.7-.8 1.1-1.5 1.1H77v6h8.2c.7 0 1.3.5 1.5 1.1.4 1.7 1.5 6.1 2.8 8.3.4.6.3 1.4-.2 1.8l-5.8 5.8 6.4 6.4 5.8-5.8c.5-.5 1.3-.6 1.8-.2 2.2 1.4 6.7 2.4 8.3 2.8.7.2 1.1.8 1.1 1.5v8.4zm3-18c-8.3 0-15-6.7-15-15s6.7-15 15-15 15 6.7 15 15-6.7 15-15 15zm0-27c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12z',
      fill: '#0eb87f'
    })
  ]
);
