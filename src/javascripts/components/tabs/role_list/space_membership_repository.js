'use strict';

angular.module('contentful').factory('SpaceMembershipRepository', [function () {

  return { getInstance: getInstance };

  function getInstance(space) {

    return {
      getAll: getAll,
      remove: remove
    };

    function getAll() {
      return getBaseCall()
      .payload({ limit: 100 })
      .get().then(function (res) { return res.items; });
    }

    function remove(id) {
      return getBaseCall(id).delete();
    }

    function getBaseCall(id) {
      return space.endpoint('space_memberships', id);
    }
  }
}]);
