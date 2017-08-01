import {h} from 'ui/Framework';

export default h('svg', {
  width: '27',
  height: '27',
  viewBox: '-1 -1 29 29',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  h('g', {
    fill: 'none',
    fillRule: 'evenodd'
  }, [
    h('g', {
      stroke: '#FFF',
      strokeWidth: '1.5'
    }, [
      h('g', [
        h('rect', {
          fill: '#21304A',
          x: '4',
          width: '22.256',
          height: '22.475',
          rx: '2'
        }),
        h('rect', {
          fill: '#21304A',
          y: '4',
          width: '22.256',
          height: '22.475',
          rx: '2'
        }),
        h('path', {
          d: 'M.718 18.3l7.18-5.8 9.333 13.05',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: '#21304A'
        }),
        h('path', {
          d: 'M13.641 18.909l2.872-2.784L21 18.909',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }),
        h('ellipse', {
          cx: '14.718',
          cy: '10.688',
          rx: '1.795',
          ry: '1.813'
        })
      ])
    ])
  ])
]);
