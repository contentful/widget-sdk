import { h } from 'ui/Framework';

export default h(
  'svg',
  {
    xmlns: 'http://www.w3.org/2000/svg',
    width: '24',
    height: '21',
    viewBox: '0 0 24 21'
  },
  [
    h('path', {
      d:
        'M19 21c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-3c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zM8 21c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-3c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z'
    }),
    h('path', {
      d:
        'M19 18H8c-.2 0-.4-.2-.5-.4L3.6 1H.5C.2 1 0 .8 0 .5S.2 0 .5 0H4c.2 0 .4.2.5.4L8.4 17H19c.3 0 .5.2.5.5s-.2.5-.5.5z'
    }),
    h('path', {
      d:
        'M20.5 16h-13c-.2 0-.5-.2-.5-.5s.3-.5.5-.5h12.6l2.7-8H5.4c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h18.1c.2 0 .3.1.4.2.1.1.1.3.1.5l-3 9c-.1.2-.3.3-.5.3z'
    })
  ]
);
