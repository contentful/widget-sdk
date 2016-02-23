'use strict';

angular.module('contentful').factory('WebhookRepository', [function () {

  return {getInstance: getInstance};

  function getInstance(space) {

    return {
      getAll: getAll,
      get: get,
      create: create,
      save: save,
      remove: remove
    };

    function getAll() {
      return getBaseCall()
      .payload({ limit: 100 })
      .get().then(function (res) { return res.items; });
    }

    function get(id) {
      return getBaseCall(id).get();
    }

    function create(webhook) {
      return getBaseCall()
      .payload(webhook)
      .post();
    }

    function save(webhook) {
      return getBaseCall(webhook.sys.id, webhook.sys.version)
      .payload(_.omit(webhook, 'sys'))
      .put();
    }

    function remove(webhook) {
      return getBaseCall(webhook.sys.id).delete();
    }

    function getBaseCall(id, version) {
      var headers = {};
      if (version) { headers['X-Contentful-Version'] = version; }

      return space.endpoint('webhook_definitions', id).headers(headers);
    }
  }

}]);
