import {h} from 'ui/Framework';

export default h('svg', {
  width: '24',
  height: '24',
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  h('title', [`icon-checkmark-done`]),
  h('g', {
    fill: 'none',
    fillRule: 'evenodd'
  }, [
    h('rect', {
      fill: '#0EB87F',
      width: '24',
      height: '24',
      rx: '12'
    }),
    h('path', {
      d: 'M0 0h24v24H0z'
    }),
    h('path', {
      fill: '#FFF',
      fillRule: 'nonzero',
      d: 'M9.455 15.701l-3.341-3.447L5 13.403 9.455 18 19 8.15 17.886 7z'
    })
  ])
]);
