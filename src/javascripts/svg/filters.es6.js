import {h} from 'ui/Framework';

export default h('svg', {
  width: '13',
  height: '13',
  viewBox: '0 0 13 13',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  h('g', {
    fillRule: 'nonzero',
    fill: 'none'
  }, [
    h('path', {
      d: 'M.016 11.19H13V9.783H.016v1.405zm0-4.217H13V5.568H.016v1.405zm0-5.622v1.406H13V1.35H.016z',
      fill: '#5B9FEF'
    }),
    h('circle', {
      stroke: '#5B9FEF',
      fill: '#FFF',
      cx: '4.346',
      cy: '2.046',
      r: '1.346'
    }),
    h('circle', {
      stroke: '#5B9FEF',
      fill: '#FFF',
      cx: '10.346',
      cy: '6.146',
      r: '1.346'
    }),
    h('circle', {
      stroke: '#5B9FEF',
      fill: '#FFF',
      cx: '6.346',
      cy: '10.346',
      r: '1.346'
    })
  ])
]);
