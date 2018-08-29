import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h('title', ['Relauch onboarding']),
    h(
      'g',
      {
        transform: 'rotate(45 14.172 17.142)',
        stroke: '#FFF',
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('path', {
          d: 'M14.272 6.5l-10.353 16H14.5v-16h-.228z'
        }),
        h('path', {
          d: 'M11.5 16v5.562',
          strokeLinecap: 'square'
        }),
        h('path', {
          d: 'M.5 16.207v5.056l3-1.567v-6.489l-3 3zM17.5 16.207v5.056l-3-1.567v-6.489l3 3z'
        }),
        h('path', {
          d: 'M6.5 16v5.562',
          strokeLinecap: 'square'
        }),
        h('path', {
          d: 'M3.5 5.5h11v-.266L9 .651 3.5 5.234V5.5z'
        }),
        h('path', {
          d: 'M3.5 22.5v-16',
          strokeLinecap: 'square'
        }),
        h('circle', {
          cx: '9',
          cy: '9',
          r: '2'
        }),
        h('path', {
          d: 'M4.815 22.5l1.524 3h5.353l1.5-3H4.814z'
        }),
        h('path', {
          d: 'M10.5 28.5v-1M7.5 28.5v-1',
          strokeLinecap: 'square'
        })
      ]
    )
  ]
);
