'use strict';

angular.module('contentful')

.factory('FilterQueryString', ['require', function (require) {

  var querystring = require('querystring');
  var $location = require('$location');
  var spaceContext = require('spaceContext');
  var TheStore = require('TheStore');

  return { create: create };

  function create (entityType) {

    return {
      readView: readView,
      update: update
    };

    function update (view) {
      var viewData = processView(view);
      TheStore.set(getKey(), viewData);
      var qs = querystring.stringify(viewData);
      $location.search(qs);
      $location.replace();
    }

    function readView () {
      var currentQS = $location.search();
      var previousQS = TheStore.get(getKey()) || {};
      var qs = _.keys(currentQS).length ? currentQS : previousQS;

      var view = dotty.transform(qs);
      toBool(view, 'contentTypeHidden');

      // migration of faulty query strings
      if (view && _.isObject(view.order)) {
        delete view.order.sys;
        delete view.order.isSys;
      }

      return view;
    }

    function getKey () {
      var spaceId = spaceContext.getId() || 'undef';
      return 'lastFilterQueryString.' + entityType + '.' + spaceId;
    }
  }

  function processView (view) {
    view = _.omitBy(view, function (item, key) {
      return key === 'title' || _.isNull(item) || _.isUndefined(item) || item === '';
    });

    return dotty.flatten(view);
  }

  function toBool (obj, path) {
    var value = dotty.get(obj, path, undefined);
    if (value !== undefined) {
      dotty.put(obj, path, value.toString() !== 'false');
    }
  }
}]);
