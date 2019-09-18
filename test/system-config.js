/* global SystemJS */

SystemJS.config({
  baseURL: '/base',
  map: {
    // 'legacy-client': '/base/src/javascripts/libs/legacy_client/client.js',
    // 'saved-views-migrator': '/base/src/javascripts/libs/saved-views-migrator/index.js',
    'libs/locales_list.json': '/base/src/javascripts/libs/locales_list.json',

    'loader-json': '/base/test/loader-json.js'
  },
  meta: {
    '*.json': {
      loader: 'loader-json'
    }
  }
});
