import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '15',
    height: '14',
    viewBox: '-1 -1 17 16',
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
          d: 'M0 11h15v3H0zM6 5V0h3v5zM3 5h9l-4.5 5z'
        })
      ]
    )
  ]
);
