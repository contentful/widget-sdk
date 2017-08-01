import {h} from 'ui/Framework';

export default h('svg', {
  width: '30',
  height: '26',
  viewBox: '-1 -1 32 28',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  h('g', {
    fill: 'none',
    fillRule: 'evenodd'
  }, [
    h('g', {
      stroke: '#FFF'
    }, [
      h('g', [
        h('rect', {
          strokeWidth: '1.5',
          fill: '#21304A',
          width: '20.25',
          height: '26',
          rx: '2'
        }),
        h('g', {
          transform: 'rotate(45 6.656 27.76)'
        }, [
          h('path', {
            d: 'M6 20.58L.294 11.31l2.18-3.742h7.053l2.18 3.741L6 20.58z',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            fill: '#21304A'
          }),
          h('rect', {
            strokeWidth: '1.5',
            fill: '#21304A',
            x: '.75',
            y: '4.541',
            width: '10.5',
            height: '3.784',
            rx: '2'
          }),
          h('path', {
            d: 'M2.25 4.919L1.5 0M9.75 4.919L10.5 0',
            strokeWidth: '1.5',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          }),
          h('path', {
            d: 'M6 20.045v-5.352',
            strokeLinecap: 'square'
          }),
          h('ellipse', {
            cx: '6',
            cy: '12.8',
            rx: '1.125',
            ry: '1.135'
          })
        ]),
        h('path', {
          d: 'M5 5h11M5 9h8.515M5 13h5.523M5 17h4.528',
          strokeWidth: '1.5',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      ])
    ])
  ])
]);
