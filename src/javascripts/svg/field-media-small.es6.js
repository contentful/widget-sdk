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
                h(
                  'g',
                  {
                    transform: 'translate(5 5)'
                  },
                  [
                    h('rect', {
                      y: '.263',
                      width: '20.497',
                      height: '19.972',
                      rx: '2'
                    }),
                    h('path', {
                      d:
                        'M.656 12.564l6.563-5.25 8.531 11.812M12.469 13.22l2.625-2.625 4.594 4.102',
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round'
                    }),
                    h('circle', {
                      cx: '13.453',
                      cy: '5.673',
                      r: '1.641'
                    })
                  ]
                )
              ]
            )
          ]
        )
      ]
    )
  ]
);
