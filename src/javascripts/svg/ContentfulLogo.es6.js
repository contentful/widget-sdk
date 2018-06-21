import {h} from 'ui/Framework';

export default h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '157',
  height: '32'
}, [
  h('path', {
    fill: '#FFD85F',
    d: 'M9.7 22.3C8 20.7 7 18.5 7 16s1-4.7 2.6-6.3c1.4-1.4 1.4-3.6 0-5s-3.6-1.4-5 0C1.8 7.6 0 11.6 0 16s1.8 8.4 4.7 11.3c1.4 1.4 3.6 1.4 5 0 1.3-1.4 1.3-3.6 0-5z'
  }),
  h('path', {
    fill: '#3BB4E7',
    d: 'M9.7 9.7C11.3 8 13.5 7 16 7s4.7 1 6.3 2.6c1.4 1.4 3.6 1.4 5 0s1.4-3.6 0-5C24.4 1.8 20.4 0 16 0S7.6 1.8 4.7 4.7c-1.4 1.4-1.4 3.6 0 5 1.4 1.3 3.6 1.3 5 0z'
  }),
  h('path', {
    fill: '#ED5C68',
    d: 'M22.3 22.3C20.7 24 18.5 25 16 25s-4.7-1-6.3-2.6c-1.4-1.4-3.6-1.4-5 0s-1.4 3.6 0 5C7.6 30.2 11.6 32 16 32s8.4-1.8 11.3-4.7c1.4-1.4 1.4-3.6 0-5-1.4-1.3-3.6-1.3-5 0z'
  }),
  h('circle', {
    cx: '7.2',
    cy: '7.2',
    r: '3.5',
    fill: '#308BC5'
  }),
  h('circle', {
    cx: '7.2',
    cy: '24.8',
    r: '3.5',
    fill: '#D5465F'
  }),
  h('path', {
    fillRule: 'evenodd',
    d: 'M43 19.3c1-.8 1.2-.3 2 .5.4.4 1.6 1.2.8 1.8-1.6 1.3-3 1.9-5.1 1.9-4.6 0-7.9-3.5-7.7-8 .1-2.1.9-4 2.5-5.3C37 9 38.8 8.4 40.7 8.5c1 0 1.8.2 2.7.5.6.2 1.2.5 1.7.9 1 .8.5 1.2-.2 2-.2.2-.3.4-.5.5-.4.4-.7.7-1.2.3-1-.7-2.4-1.1-3.6-.8-4 1-3.8 8.1 1.1 8.1.8.1 1.7-.2 2.3-.7zm111.1 3.9c-.7 0-1.2-.5-1.2-1.2V6.3c0-.7.5-1.2 1.2-1.2h1.3c.7 0 1.2.5 1.2 1.2V22c0 .7-.5 1.2-1.2 1.2h-1.3zm-6.9-1.8c-1.4 1.3-2.8 2-4.8 2-4.1 0-6-3.4-6-7.1V9.9c0-.7.5-1.2 1.2-1.2h1.3c.7 0 1.2.5 1.2 1.2v6.4c0 2.1 1.1 3.7 3.4 3.7 2.2 0 3.6-1.9 3.6-3.9V9.9c0-.7.5-1.2 1.2-1.2h1.3c.7 0 1.2.5 1.2 1.2V22c0 .7-.5 1.2-1.2 1.2h-1.1c-.7 0-1.1-.6-1.2-1.2l-.1-.6zM131.6 8.8h2.5c.7 0 1.2.6 1.2 1.2v.8c0 .7-.5 1.2-1.2 1.2h-2.5v10c0 .7-.5 1.2-1.2 1.2h-1.3c-.7 0-1.2-.5-1.2-1.2V8.3c0-3 1.7-5.4 4.8-5.7h1.9c.7 0 1.2.6 1.2 1.2v.8c0 .7-.5 1.2-1.2 1.2h-1c-1.5 0-2.1 1.1-2.1 2.5v.5h.1zm-9.1 0h2.8c.7 0 1.2.5 1.2 1.2v.8c0 .7-.5 1.2-1.2 1.2h-2.8v6.1c0 1.2.6 1.8 1.8 1.8h.6c.7 0 1.2.5 1.2 1.2v.9c0 .7-.5 1.2-1.2 1.2h-1.7c-3-.2-4.3-2.1-4.3-5.1V6.3c0-.7.5-1.2 1.2-1.2h1.3c.7 0 1.2.5 1.2 1.2v2.5h-.1zm-40.1 0h2.8c.7 0 1.2.5 1.2 1.2v.8c0 .7-.5 1.2-1.2 1.2h-2.8v6.1c0 1.2.6 1.9 1.8 1.9h.6c.7 0 1.2.5 1.2 1.2v.8c0 .7-.5 1.2-1.2 1.2H84c-3.3 0-5.2-1.4-5.2-5.1V6.3c0-.7.5-1.2 1.2-1.2h1.3c.7 0 1.2.5 1.2 1.2v2.5h-.1zm-16.3 1.7c1.3-1.3 2.8-2 4.6-2 4.1 0 6.2 3.3 6.2 7.1V22c0 .7-.5 1.2-1.2 1.2h-1.3c-.7 0-1.2-.5-1.2-1.2v-6.4c0-2.1-1.1-3.7-3.4-3.7-2.2 0-3.6 1.8-3.6 3.9V22c0 .7-.5 1.2-1.2 1.2h-1.3c-.7 0-1.2-.5-1.2-1.2V9.9c0-.7.5-1.2 1.2-1.2h1.1c.7 0 1.1.6 1.2 1.2l.1.6zm40.2 0c1.3-1.3 2.8-2 4.6-2 4.1 0 6.2 3.3 6.2 7.1V22c0 .7-.5 1.2-1.2 1.2h-1.3c-.7 0-1.2-.5-1.2-1.2v-6.4c0-2.1-1.1-3.7-3.4-3.7-2.2 0-3.6 1.8-3.6 3.9V22c0 .7-.5 1.2-1.2 1.2h-1.3c-.7 0-1.2-.5-1.2-1.2V9.9c0-.7.5-1.2 1.2-1.2h1.1c.7 0 1.1.6 1.2 1.2l.1.6zM53.8 8.4c-4.4 0-7.5 3.2-7.5 7.6 0 4.4 3.1 7.6 7.5 7.6 4.5 0 7.6-3.1 7.6-7.6 0-4.4-3.2-7.6-7.6-7.6zm36.6 8.9c.3 2 2.3 2.9 4.2 2.9.9 0 1.9-.2 2.7-.6.1-.1.3-.1.4-.2.5-.3.9-.4 1.3 0l.7.7.6.6c.6.8.2 1-.5 1.4-1.5 1-3.4 1.5-5.2 1.5-4.8 0-8-2.9-8-7.7 0-4.6 3.2-7.6 7.7-7.6 4.7 0 7.3 2.7 7.4 7.4 0 1.3.1 1.7-1.2 1.7H90.4v-.1zm-36.6-5.5c2.3 0 3.8 2 3.8 4.2 0 2.3-1.4 4.1-3.8 4.1S50 18.3 50 16s1.5-4.2 3.8-4.2zm36.7 2.4H98c-.3-1.9-1.8-2.6-3.6-2.6-1.9 0-3.4.9-3.9 2.6z',
    clipRule: 'evenodd'
  })
]);
