import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '15',
  height: '19',
  viewBox: '-1 -1 17 21',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink'
}, [
  h('defs', [
    h('rect#a', {
      id: 'a',
      width: '13',
      height: '16',
      x: '2',
      y: '2.375',
      rx: '2'
    }),
    h('mask#d', {
      id: 'd',
      width: '13',
      height: '16',
      x: '0',
      y: '0',
      fill: '#fff'
    }, [
      h('use', {
        'xlink:href': '#a'
      })
    ]),
    h('rect#b', {
      id: 'b',
      width: '13',
      height: '16',
      y: '.375',
      rx: '2'
    }),
    h('mask#e', {
      id: 'e',
      width: '13',
      height: '16',
      x: '0',
      y: '0',
      fill: '#fff'
    }, [
      h('use', {
        'xlink:href': '#b'
      })
    ]),
    h('mask#c', [
      h('rect', {
        width: '100%',
        height: '100%',
        fill: '#fff'
      }),
      h('use', {
        'xlink:href': '#b'
      })
    ])
  ]),
  h('g', {
    fill: 'none',
    fillRule: 'evenodd',
    stroke: 'currentColor'
  }, [
    h('use', {
      strokeWidth: '2',
      mask: 'url(#b)',
      'xlink:href': '#rect'
    }),
    h('g', {
      mask: 'url(#c)'
    }, [
      h('use', {
        fill: 'currentColor',
        fillOpacity: '.1',
        strokeWidth: '2',
        mask: 'url(#d)',
        'xlink:href': '#a'
      })
    ]),
    h('use', {
      strokeWidth: '2',
      mask: 'url(#e)',
      'xlink:href': '#b'
    }),
    h('g', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', {
        d: 'M3.516 4.5H9.35m-5.833 2H9.35m-5.833 2H9.35m-5.833 2H9.35m-5.833 2H5.85'
      })
    ])
  ])
]);
