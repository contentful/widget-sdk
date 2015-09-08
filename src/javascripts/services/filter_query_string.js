'use strict';

angular.module('contentful').factory('FilterQueryString', ['$injector', function ($injector) {

  var querystring = $injector.get('querystring');
  var $location   = $injector.get('$location');
  var TheStore    = $injector.get('TheStore');

  return { create: create };

  function create(entityType) {

    var isInitialized = false;
    var KEY           = 'lastFilterQueryString.' + entityType;

    return {
      createInitHandler: createInitHandler,
      update:            update
    };

    function createInitHandler(cb) {
      return function (entities) {
        if (!entities || isInitialized) { return; }
        cb(read());
      };
    }

    function update(view) {
      if (!isInitialized) { return; }

      var viewData = {};
      _.forEach(view, processViewItems);
      TheStore.set(KEY, viewData);
      var qs = querystring.stringify(viewData);
      $location.search(qs).replace();

      function processViewItems(item, key) {
        if (key === 'title') { return; }
        if (_.isNull(item) || item === '') { return; }
        _.extend(viewData, flatten(item, key));
      }
    }

    function flatten(item, key) {
      var result = {};
      if (_.isObject(item) && !_.isArray(item)) {
        addNested(item);
      } else {
        result[key] = item;
      }

      return result;

      function addNested(item) {
        _.forEach(item, function (nestedItem, nestedKey) {
          result[key + '.' + nestedKey] = nestedItem;
        });
      }
    }

    function read() {
      var view = {};
      var currentQS  = $location.search();
      var previousQS = TheStore.get(KEY) || {};
      var qs = _.keys(currentQS).length ? currentQS : previousQS;

      _.forEach(qs, function (item, key) {
        if (key.indexOf('.') > -1) {
          addNested(key, item);
        } else {
          view[key] = item;
        }
      });

      toBool(view, 'contentTypeHidden');
      isInitialized = true;

      return view;

      function addNested(key, item) {
        var parts = key.split('.');
        if (!view[parts[0]]) { view[parts[0]] = {}; }
        view[parts[0]][parts[1]] = item;
      }
    }
  }

  function toBool(obj, key) {
    var value = obj[key];
    obj[key] = value !== 'false';
  }
}]);
