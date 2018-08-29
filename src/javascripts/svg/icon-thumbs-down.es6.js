import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    width: '13',
    height: '12',
    viewBox: '0 0 14 13',
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
          d: 'M0-1h14v14H0z'
        }),
        h('path', {
          d:
            'M8.75.75H3.5c-.484 0-.898.292-1.073.712L.665 5.574A1.153 1.153 0 0 0 .583 6v1.114l.006.006-.006.047A1.17 1.17 0 0 0 1.75 8.333h3.68L4.878 11l-.018.187c0 .239.1.46.257.618l.618.613 3.844-3.845c.21-.21.339-.501.339-.822V1.917A1.17 1.17 0 0 0 8.75.75zm2.333 0v7h2.334v-7h-2.334z',
          fill: '#536171',
          fillRule: 'nonzero'
        })
      ]
    )
  ]
);
