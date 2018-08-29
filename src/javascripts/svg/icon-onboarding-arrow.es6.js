import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '63',
    height: '47',
    viewBox: '0 0 63 47',
    xmlns: 'http://www.w3.org/2000/svg'
  },
  [
    h('title', ['Onboarding hint arrow']),
    h(
      'g',
      {
        fill: 'none',
        fillRule: 'evenodd'
      },
      [
        h('path', {
          fill: '#14D997',
          d: 'M2.718 46.553L.87 34.486l11.224 4.332z'
        }),
        h('path', {
          d: 'M62 1C42.732 2.944 18.624 18.37 7.228 36.793L6 42',
          stroke: '#14D997',
          strokeWidth: '2'
        })
      ]
    )
  ]
);
