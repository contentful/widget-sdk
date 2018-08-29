import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '48',
    height: '48',
    viewBox: '-1 -1 50 50',
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
            strokeWidth: '2',
            stroke: '#21304A'
          },
          [
            h('g', [
              h('g', [
                h('path', {
                  d:
                    'M1.092 31.998c-.766-.424-.767-1.112 0-1.536L19.86 20.087c.766-.424 2.01-.424 2.777 0l18.766 10.375c.767.424.767 1.112 0 1.536L22.636 42.373c-.767.424-2.01.424-2.777 0L1.092 31.998z',
                  fill: '#61BCEA'
                }),
                h('path', {
                  d:
                    'M1.092 22.57c-.766-.423-.767-1.11 0-1.535L19.86 10.66c.766-.424 2.01-.424 2.777 0l18.766 10.375c.767.424.767 1.111 0 1.536L22.636 32.946c-.767.424-2.01.424-2.777 0L1.092 22.57z',
                  fill: '#83CBF0'
                }),
                h('path', {
                  d:
                    'M1.092 13.143c-.766-.424-.767-1.11 0-1.535L19.86 1.233c.766-.424 2.01-.424 2.777 0l18.766 10.375c.767.424.767 1.111 0 1.535L22.636 23.518c-.767.424-2.01.425-2.777 0L1.092 13.143z',
                  fill: '#A8E2FF'
                })
              ]),
              h(
                'g',
                {
                  transform: 'translate(20.231 20.231)',
                  fill: '#FFF'
                },
                [
                  h('circle', {
                    cx: '13.884',
                    cy: '13.884',
                    r: '12.793'
                  }),
                  h('path', {
                    d: 'M6.777 13.884h14.215M13.884 6.777v14.215'
                  })
                ]
              )
            ])
          ]
        )
      ]
    )
  ]
);
