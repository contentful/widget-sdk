'use strict';

angular.module('contentful').factory('FilterQueryString', ['$injector', function ($injector) {

  var querystring  = $injector.get('querystring');
  var $location    = $injector.get('$location');
  var spaceContext = $injector.get('spaceContext');
  var TheStore     = $injector.get('TheStore');

  return { create: create };

  function create(entityType) {

    var isInitialized = false;

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
      TheStore.set(getKey(), viewData);
      var qs = querystring.stringify(viewData);
      $location.search(qs);
      $location.replace();

      function processViewItems(item, key) {
        if (key === 'title') { return; }
        if (_.isNull(item) || _.isUndefined(item) || item === '') { return; }

        if (_.isObject(item) && !_.isArray(item)) {
          _.extend(viewData, flatten(key, item));
        } else {
          viewData[key] = item;
        }
      }
    }

    function read() {
      var currentQS  = $location.search();
      var previousQS = TheStore.get(getKey()) || {};
      var qs = _.keys(currentQS).length ? currentQS : previousQS;
      var view = dotty.transform(qs);

      toBool(view, 'contentTypeHidden');
      isInitialized = true;

      return view;
    }

    function getKey() {
      return 'lastFilterQueryString.' + entityType + '.' + getSpaceId();
    }
  }

  function flatten(key, item) {
    var nested = {};
    nested[key] = item;
    return dotty.flatten(nested);
  }

  function toBool(obj, key) {
    if (_.has(obj, key)) {
      var value = obj[key];
      obj[key] = value !== 'false';
    }
  }

  function getSpaceId() {
    return dotty.get(spaceContext, 'space.data.sys.id', 'undef');
  }
}]);
