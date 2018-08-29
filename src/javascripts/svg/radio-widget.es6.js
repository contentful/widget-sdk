import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '56',
    height: '40',
    viewBox: '-1 -1 58 42',
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
          h(
            'g',
            {
              transform: 'translate(0 -3)'
            },
            [
              h(
                'text',
                {
                  fontFamily: 'Avenir Next',
                  fontSize: '11',
                  fill: '#A3A9B2'
                },
                [
                  h(
                    'tspan',
                    {
                      x: '10',
                      y: '11.56'
                    },
                    ['Breakfast']
                  ),
                  h(
                    'tspan',
                    {
                      x: '10',
                      y: '26.56'
                    },
                    ['Lunch']
                  ),
                  h(
                    'tspan',
                    {
                      x: '10',
                      y: '41.56'
                    },
                    ['Dinner']
                  )
                ]
              ),
              h('ellipse', {
                stroke: '#B7C2CC',
                cx: '3.5',
                cy: '9.06',
                rx: '3.5',
                ry: '3.5'
              }),
              h('ellipse', {
                fill: '#B7C2CC',
                cx: '3.5',
                cy: '9.06',
                rx: '1.5',
                ry: '1.5'
              }),
              h('ellipse', {
                stroke: '#B7C2CC',
                cx: '3.5',
                cy: '23.06',
                rx: '3.5',
                ry: '3.5'
              }),
              h('ellipse', {
                stroke: '#B7C2CC',
                cx: '3.5',
                cy: '38.06',
                rx: '3.5',
                ry: '3.5'
              })
            ]
          )
        ])
      ]
    )
  ]
);
