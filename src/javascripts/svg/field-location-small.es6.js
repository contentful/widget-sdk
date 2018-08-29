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
            stroke: '#21304A',
            fillOpacity: '0'
          },
          [
            h(
              'g',
              {
                fill: 'none'
              },
              [
                h('rect', {
                  width: '30',
                  height: '30',
                  rx: '5'
                }),
                h('path', {
                  d:
                    'M14.895 25c.464 0 7.894-7.726 7.894-12.093S19.255 5 14.895 5 7 8.54 7 12.907 14.43 25 14.895 25zm0-7.442a4.648 4.648 0 0 0 4.644-4.651 4.648 4.648 0 0 0-4.644-4.651 4.648 4.648 0 0 0-4.644 4.651 4.648 4.648 0 0 0 4.644 4.651z'
                })
              ]
            )
          ]
        )
      ]
    )
  ]
);
