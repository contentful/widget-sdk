import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '21',
    height: '21',
    viewBox: '0 0 21 21',
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
        h('path', {
          d: 'M1 0h20v20H1z'
        }),
        h(
          'g.icon-svg-info-stroke',
          {
            transform: 'translate(1 .833)',
            stroke: '#FFF',
            strokeLinejoin: 'round'
          },
          [
            h('circle', {
              strokeLinecap: 'round',
              cx: '9.583',
              cy: '9.583',
              r: '9.167'
            }),
            h('path', {
              strokeLinecap: 'round',
              d: 'M7.917 7.917h1.666V15'
            }),
            h('path', {
              d: 'M9.167 4.167a.417.417 0 1 0 0 .833.417.417 0 0 0 0-.833z'
            })
          ]
        )
      ]
    )
  ]
);
