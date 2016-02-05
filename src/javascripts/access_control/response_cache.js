'use strict';

angular.module('contentful').factory('accessChecker/responseCache', [function () {

  var cache = {};
  var context = null;

  return {
    reset: reset,
    getResponse: getResponse
  };

  function reset(_context) {
    cache = {};
    context = _context;
  }

  function getResponse(action, entity) {
    if (!context) {
      return false;
    }

    var key = getCanResponseKey(action, entity);
    if (key) {
      var response = cache[key];
      if (!_.contains([true, false], response)) {
        response = context.can(action, entity);
        cache[key] = response;
      }
      return response;
    }

    return context.can(action, entity);
  }

  function getCanResponseKey(action, entity) {
    var category = null;
    var id = null;

    if (_.isObject(entity)) {
      id = dotty.get(entity, 'sys.id', null);
      var type = dotty.get(entity, 'sys.type', null);
      category = _.contains(['Entry', 'Asset'], type) ? ('specific' + type) : null;
    } else if (_.isString(entity)) {
      id = 'none';
      category = 'general';
    }

    var segments = [action, category, id];
    if (_.every(segments, _.isString)) {
      return segments.join(',');
    }
  }
}]);
