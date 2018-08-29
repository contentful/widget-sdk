import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '72',
    height: '34',
    viewBox: '-1 -1 74 36',
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
          h('g', [
            h('path', {
              fill: '#D6DCE4',
              d: 'M0 0h72v34H0z'
            }),
            h('path', {
              d: 'M31 23V12l11 5.5L31 23z',
              fill: '#FFF'
            })
          ])
        ])
      ]
    )
  ]
);
