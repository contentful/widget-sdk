import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '3',
    height: '15',
    viewBox: '-1 -1 5 17',
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
            fill: '#000'
          },
          [
            h('g', [
              h('path', {
                d: 'M2.75 3H0V0h3v3h-.25zm0 5.8H0v-3h3v3h-.25zm0 5.8H0v-3h3v3h-.25z'
              })
            ])
          ]
        )
      ]
    )
  ]
);
