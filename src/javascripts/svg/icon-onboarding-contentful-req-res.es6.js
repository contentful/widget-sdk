import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '151',
    height: '223',
    viewBox: '0 0 151 223',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h('title', ['Contentful request response diagram']),
    h('defs', [
      h(
        'radialGradient#a',
        {
          cy: '-45.638%',
          fx: '50%',
          fy: '-45.638%',
          r: '121.39%',
          gradientTransform: 'matrix(.1347 .99068 -.97942 .13625 -.014 -.89)',
          id: 'a'
        },
        [
          h('stop', {
            stopColor: '#135A9F',
            offset: '0%'
          }),
          h('stop', {
            stopColor: '#173757',
            offset: '20.825%'
          }),
          h('stop', {
            stopColor: '#192532',
            offset: '100%'
          })
        ]
      )
    ]),
    h(
      'g',
      {
        transform: 'translate(1 1)',
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('circle', {
          stroke: '#E8F7FF',
          opacity: '.3',
          cx: '74.5',
          cy: '74.5',
          r: '74.5'
        }),
        h('circle', {
          stroke: '#E8F7FF',
          opacity: '.8',
          cx: '74.5',
          cy: '74.5',
          r: '64.5'
        }),
        h('circle', {
          stroke: '#E8F7FF',
          cx: '74.5',
          cy: '74.5',
          r: '53.5'
        }),
        h('ellipse', {
          fill: 'url(#a)',
          cx: '75',
          cy: '74.5',
          rx: '44',
          ry: '43.5'
        }),
        h('path', {
          d:
            'M68.01 80.836l.003-.003c-1.834-1.815-2.964-4.314-2.953-7.062.01-2.754 1.16-5.244 3.01-7.043l-.006-.005a3.865 3.865 0 0 0 .021-5.542 4.05 4.05 0 0 0-5.651-.021c-3.301 3.212-5.35 7.66-5.37 12.582-.018 4.921 1.997 9.382 5.274 12.617a4.049 4.049 0 0 0 5.651.02 3.864 3.864 0 0 0 .022-5.542h-.001z',
          fill: '#FFD85F'
        }),
        h('path', {
          d:
            'M68.064 66.724l.004.004a10.247 10.247 0 0 1 7.198-2.899 10.23 10.23 0 0 1 7.18 2.954l.003-.006c1.557 1.538 4.086 1.547 5.65.022a3.868 3.868 0 0 0 .021-5.546c-3.274-3.238-7.808-5.249-12.823-5.267-5.018-.018-9.565 1.96-12.862 5.173a3.87 3.87 0 0 0-.021 5.546c1.552 1.537 4.083 1.546 5.649.02l.001-.001z',
          fill: '#3BB4E7'
        }),
        h('path', {
          d:
            'M82.395 80.889l-.004-.003a10.246 10.246 0 0 1-7.198 2.897 10.221 10.221 0 0 1-7.178-2.953l-.005.005c-1.556-1.537-4.085-1.547-5.65-.02a3.867 3.867 0 0 0-.02 5.544c3.273 3.239 7.808 5.25 12.823 5.268 5.017.018 9.564-1.96 12.862-5.174a3.87 3.87 0 0 0 .02-5.545c-1.552-1.536-4.083-1.546-5.649-.02z',
          fill: '#ED5C68'
        }),
        h('path', {
          d:
            'M68.064 66.723a4.05 4.05 0 0 1-5.651-.021 3.865 3.865 0 0 1 .02-5.542 4.05 4.05 0 0 1 5.653.021 3.866 3.866 0 0 1-.022 5.542',
          fill: '#308BC5'
        }),
        h('path', {
          d:
            'M67.99 86.38a4.05 4.05 0 0 1-5.651-.02 3.867 3.867 0 0 1 .02-5.544 4.052 4.052 0 0 1 5.652.022 3.866 3.866 0 0 1-.021 5.542',
          fill: '#D5465F'
        }),
        h('g', [
          h('path', {
            d: 'M57 150.5V216M92 150.5V216',
            stroke: '#8091A5',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDasharray: '1,6'
          }),
          h('path', {
            fill: '#FFF',
            d: 'M12 168h61v15H12z'
          }),
          h(
            'text',
            {
              fontFamily: 'AvenirNext-Regular, Avenir Next',
              fontSize: '14',
              fill: '#536171',
              transform: 'translate(12 145)'
            },
            [
              h(
                'tspan',
                {
                  x: '6',
                  y: '34'
                },
                ['request']
              )
            ]
          ),
          h('path', {
            fill: '#FFF',
            d: 'M79 190h61v15H79z'
          }),
          h(
            'text',
            {
              fontFamily: 'AvenirNext-Regular, Avenir Next',
              fontSize: '14',
              fill: '#536171',
              transform: 'translate(12 145)'
            },
            [
              h(
                'tspan',
                {
                  x: '68',
                  y: '55'
                },
                ['response']
              )
            ]
          ),
          h('path', {
            stroke: '#8091A5',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            d: 'M52 151l4.978-6L62 151M97 215l-4.978 6L87 215'
          })
        ])
      ]
    )
  ]
);
