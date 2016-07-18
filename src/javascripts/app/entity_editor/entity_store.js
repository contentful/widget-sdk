'use strict';

angular.module('cf.app')
.factory('EntityStore', ['require', function (require) {

  var $q = require('$q');

  var MAX_IN_IDS = 200;

  return {create: create};

  function create (space, fetchMethod) {
    var store = {};
    var instance = {
      prefetch: prefetch,
      get: get,
      add: add
    };

    return instance;

    function prefetch (links) {
      var ids = _.uniq(_.map(links, function (link) {
        return link.sys.id;
      }));

      var skip = !ids.length || _.every(ids, function (id) {
        return _.isObject(store[id]);
      });

      if (!space || !fetchMethod || skip) {
        return $q.resolve(instance);
      }

      var queries = _.chunk(ids, MAX_IN_IDS)
      .map(function (ids) {
        return space[fetchMethod]({
          'sys.id[in]': ids.join(','),
          limit: MAX_IN_IDS
        });
      });

      return $q.all(queries)
      .then(function (responses) {
        _(responses).map('items').flatten().forEach(add);
        return instance;
      });
    }

    function get (linkOrId) {
      var id = dotty.get(linkOrId, 'sys.id');
      if (!id && _.isString(linkOrId)) {
        id = linkOrId;
      }

      return store[id];
    }

    function add (entity) {
      store[entity.sys.id] = entity;
    }
  }
}]);
