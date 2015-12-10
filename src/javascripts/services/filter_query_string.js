'use strict';

angular.module('contentful').factory('FilterQueryString', ['$injector', function ($injector) {

  var querystring  = $injector.get('querystring');
  var $location    = $injector.get('$location');
  var spaceContext = $injector.get('spaceContext');
  var TheStore     = $injector.get('TheStore');

  return { create: create };

  function create(entityType) {

    return {
      readView: readView,
      update:   update
    };

    function update(view) {
      var viewData = processView(view);
      TheStore.set(getKey(), viewData);
      var qs = querystring.stringify(viewData);
      $location.search(qs);
      $location.replace();
    }

    function readView() {
      var currentQS  = $location.search();
      var previousQS = TheStore.get(getKey()) || {};
      var qs = _.keys(currentQS).length ? currentQS : previousQS;
      var view = dotty.transform(qs);
      toBool(view, 'contentTypeHidden');

      return view;
    }

    function getKey() {
      var spaceId = spaceContext.getId() || 'undef';
      return 'lastFilterQueryString.' + entityType + '.' + spaceId;
    }
  }

  function processView(view) {
    view = _.omit(view, function (item, key) {
      return key === 'title' || _.isNull(item) || _.isUndefined(item) || item === '';
    });

    return dotty.flatten(view);
  }

  function toBool(obj, key) {
    if (_.has(obj, key)) {
      var value = obj[key].toString();
      obj[key] = value !== 'false';
    }
  }
}]);
