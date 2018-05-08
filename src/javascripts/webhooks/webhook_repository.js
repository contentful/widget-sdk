'use strict';

angular.module('contentful').factory('WebhookRepository', [function () {
  return {getInstance: getInstance};

  function getInstance (space) {
    return {
      getAll: getAll,
      get: get,
      save: save,
      remove: remove,
      logs: {
        getCall: getCall,
        getCalls: getCalls,
        getHealth: getHealth
      }
    };

    function getAll () {
      return getBaseCall()
      .payload({ limit: 100 })
      .get().then(function (res) { return res.items; });
    }

    function get (id) {
      return getBaseCall(id).get();
    }

    function getCall (webhookId, callId) {
      return getLogsBaseCall(webhookId)
      .paths(['calls', callId])
      .get();
    }

    function getCalls (webhookId) {
      return getLogsBaseCall(webhookId)
      .paths(['calls'])
      .payload({ limit: 500 })
      .get();
    }

    function getHealth (webhookId) {
      return getLogsBaseCall(webhookId)
      .paths(['health'])
      .get();
    }

    function save (webhook) {
      if (!_.get(webhook, 'sys.id')) {
        return create(webhook);
      }

      return getBaseCall(webhook.sys.id, webhook.sys.version)
      .payload(webhook)
      .put();
    }

    function create (webhook) {
      return getBaseCall()
      .payload(webhook)
      .post();
    }

    function remove (webhook) {
      return getBaseCall(webhook.sys.id).delete();
    }

    function getBaseCall (id, version) {
      var headers = {};
      if (version) { headers['X-Contentful-Version'] = version; }

      return space.endpoint('webhook_definitions', id).headers(headers);
    }

    function getLogsBaseCall (webhookId) {
      return space.endpoint('webhooks/' + webhookId);
    }
  }
}]);
