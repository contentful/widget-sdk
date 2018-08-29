import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '40',
    height: '37',
    viewBox: '-1 -1 42 39',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('g', [
          h('g', [
            h('rect', {
              stroke: '#21304A',
              strokeWidth: '2',
              fill: '#F3EFBC',
              width: '27',
              height: '37',
              rx: '2'
            }),
            h(
              'g',
              {
                transform: 'rotate(45 15.593 40.104)'
              },
              [
                h('path', {
                  stroke: '#21304A',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  fill: '#F8F8F8',
                  d: 'M10 35.195l-7.608-12.25L5.298 18h9.404l2.906 4.944z'
                }),
                h('path', {
                  d:
                    'M16.146 7.282S11.13 1.128 4.06 6.785c.707 4.95.746 7.541.746 7.541l9.927.028 1.414-7.072z',
                  fill: '#16C98D'
                }),
                h('rect', {
                  stroke: '#21304A',
                  strokeWidth: '2',
                  fill: '#16C98D',
                  x: '3',
                  y: '14',
                  width: '14',
                  height: '5',
                  rx: '2'
                }),
                h('path', {
                  d: 'M5 14.5L4 8M15 14.5L16 8',
                  stroke: '#21304A',
                  strokeWidth: '2',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                }),
                h('path', {
                  d: 'M10 34.488v-7.073',
                  stroke: '#21304A',
                  strokeLinecap: 'square'
                }),
                h('circle', {
                  stroke: '#21304A',
                  fill: '#F3EFBB',
                  cx: '10',
                  cy: '24.914',
                  r: '1.5'
                })
              ]
            ),
            h('path', {
              d:
                'M6.218 6.791h14.5M6.218 11.791h14.5M6.218 16.791h12M6.218 21.791h10M6.218 26.791h9',
              stroke: '#21304A',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round'
            })
          ])
        ])
      ]
    )
  ]
);
