'use strict';

angular.module('contentful')
.factory('EntityStore', ['$injector', function ($injector) {

  var $q = $injector.get('$q');

  return {create: create};

  function create (space, fetchMethod) {
    var store = {};

    return {
      prefetch: prefetch,
      get: get,
      add: add
    };

    function prefetch (links) {
      var ids = _.map(links, function (link) {
        return link.sys.id;
      });

      var skip = !ids.length || _.every(ids, function (id) {
        return _.isObject(store[id]);
      });

      if (!space || !fetchMethod || skip) {
        return $q.resolve();
      }

      return space[fetchMethod]({'sys.id[in]': ids.join(',')})
      .then(function (res) {
        _.forEach(res.items, add);
        return store;
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
