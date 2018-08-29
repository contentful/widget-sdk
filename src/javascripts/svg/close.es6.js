import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '18',
    height: '18',
    viewBox: '-1 -1 20 20',
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
            fill: '#21304A'
          },
          [
            h('g', [
              h('path', {
                d:
                  'M6.23 9L1.386 4.154 0 2.769 2.77 0l1.384 1.385L9 6.23l4.846-4.846L15.231 0 18 2.77l-1.385 1.384L11.77 9l4.846 4.846L18 15.231 15.23 18l-1.384-1.385L9 11.77l-4.846 4.846L2.769 18 0 15.23l1.385-1.384L6.23 9z'
              })
            ])
          ]
        )
      ]
    )
  ]
);
