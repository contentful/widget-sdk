/* global SystemJS */

SystemJS.config({
  baseURL: '/base',
  map: {
    'loader-json': '/base/test/loader-json.js',
    'loader-html': '/base/test/loader-html.js',
  },
  meta: {
    '*.json': {
      loader: 'loader-json',
    },
    '*.html': {
      loader: 'loader-html',
    },
  },
});
