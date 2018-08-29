import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '9',
    height: '20',
    viewBox: '-1 -1 7 19',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h(
      'g',
      {
        fill: 'currentColor'
      },
      [
        h('path', {
          d: 'M3.75 4H1V1h3v3h-.25zm0 5.8H1v-3h3v3h-.25zm0 5.8H1v-3h3v3h-.25z'
        })
      ]
    )
  ]
);
