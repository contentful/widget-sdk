import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '33',
    height: '33',
    viewBox: '-1 -1 35 35',
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
              fill: 'none',
              width: '30',
              height: '30',
              rx: '5'
            }),
            h('path', {
              d:
                'M5 31.432a5.972 5.972 0 0 0 3.746 1.314h18.002a6 6 0 0 0 5.999-5.999V8.745A5.973 5.973 0 0 0 31.434 5a5.01 5.01 0 0 1 .313 1.75v19.992a4.998 4.998 0 0 1-5.005 5.004H6.752c-.617 0-1.207-.11-1.752-.314z',
              fill: '#21304A'
            }),
            h(
              'g',
              {
                transform: 'translate(6 6)',
                stroke: '#21304A',
                fillOpacity: '0',
                fill: 'none'
              },
              [
                h('rect', {
                  y: '.25',
                  width: '19.521',
                  height: '19.021',
                  rx: '2'
                }),
                h('path', {
                  d: 'M.625 11.966l6.25-5L15 18.216M11.875 12.59l2.5-2.5 4.375 3.907',
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                }),
                h('circle', {
                  cx: '12.813',
                  cy: '5.403',
                  r: '1.563'
                })
              ]
            )
          ])
        ])
      ]
    )
  ]
);
