import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '30',
    height: '30',
    viewBox: '-1 -1 32 32',
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
        h(
          'g',
          {
            stroke: '#21304A'
          },
          [
            h('rect', {
              fill: 'none',
              width: '30',
              height: '30',
              rx: '5'
            }),
            h(
              'g',
              {
                transform: 'translate(5 5)'
              },
              [
                h('rect', {
                  fill: 'none',
                  x: '8',
                  y: '6.2',
                  width: '12',
                  height: '13',
                  rx: '2'
                }),
                h('rect', {
                  fill: 'none',
                  y: '.2',
                  width: '12',
                  height: '13',
                  rx: '2'
                }),
                h('path', {
                  d: 'M6 6.146l7.5 5',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                }),
                h('circle', {
                  fill: 'none',
                  cx: '4.75',
                  cy: '4.896',
                  r: '1.75'
                }),
                h('circle', {
                  fill: 'none',
                  cx: '15.25',
                  cy: '12.396',
                  r: '1.75'
                })
              ]
            )
          ]
        )
      ]
    )
  ]
);
