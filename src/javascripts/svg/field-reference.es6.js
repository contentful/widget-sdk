import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '40',
    height: '39',
    viewBox: '-1 -1 42 41',
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
            stroke: '#21304A',
            strokeWidth: '2'
          },
          [
            h('g', [
              h('path', {
                d:
                  'M0 2.41C0 1.3.897.4 2.005.4h19.99C23.102.4 24 1.293 24 2.407V14h-4.002A2.005 2.005 0 0 0 18 16.009V26H1.995A2 2 0 0 1 0 23.991V2.41z',
                fill: 'none'
              }),
              h('path', {
                d:
                  'M16 14.006c0-1.108.897-2.006 2.005-2.006h19.99c1.107 0 2.005.894 2.005 2.006v22.388a2.005 2.005 0 0 1-2.005 2.006h-19.99A2.003 2.003 0 0 1 16 36.394V14.006z',
                fill: 'none'
              }),
              h('path', {
                d: 'M13 12l14 10.291',
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
              }),
              h('circle', {
                fill: 'none',
                cx: '9.5',
                cy: '9.791',
                r: '3.5'
              }),
              h('circle', {
                fill: 'none',
                cx: '30.5',
                cy: '24.791',
                r: '3.5'
              })
            ])
          ]
        )
      ]
    )
  ]
);
