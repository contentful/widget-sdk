'use strict';

angular.module('contentful').factory('WebhookRepository', [function () {

  return {getInstance: getInstance};

  function getInstance(space) {

    return {
      getAll: getAll,
      get: get,
      create: create,
      remove: remove
    };

    function getAll() {
      return space.endpoint('webhook_definitions')
      .payload({ limit: 100 })
      .get().then(function (res) { return res.items; });
    }

    function get(id) {
      return space.endpoint('webhook_definitions', id)
      .get();
    }

    function create(webhook) {
      return space.endpoint('webhook_definitions')
      .payload(webhook)
      .post();
    }

    function remove(webhook) {
      return space.endpoint('webhook_definitions', webhook.sys.id)
      .delete();
    }
  }

}]);
