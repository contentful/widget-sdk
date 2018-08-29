import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '12',
    height: '8',
    viewBox: '-1 -1 14 10',
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
            fill: '#9B9B9B'
          },
          [
            h('g', [
              h('path', {
                d:
                  'M11.11 1.917a.45.45 0 0 0 0-.635L9.952.13a.442.442 0 0 0-.628 0L5.62 3.835 1.917.13a.442.442 0 0 0-.628 0L.13 1.28a.45.45 0 0 0 0 .636l5.176 5.168a.442.442 0 0 0 .627 0l5.176-5.168z'
              })
            ])
          ]
        )
      ]
    )
  ]
);
