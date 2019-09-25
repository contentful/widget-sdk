/* global SystemJS */

SystemJS.config({
  baseURL: '/base',
  map: {
    'libs/locales_list.json': '/base/src/javascripts/libs/locales_list.json',

    'loader-json': '/base/test/loader-json.js'
  },
  meta: {
    '*.json': {
      loader: 'loader-json'
    }
  }
});
