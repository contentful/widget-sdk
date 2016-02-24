'use strict';

describe('Webhook Repository', function () {

  var space, endpoint, repo;

  beforeEach(function () {
    module('contentful/test');

    endpoint = {};
    space = {endpoint: sinon.stub().returns(endpoint)};

    // chainable methods
    ['payload', 'headers'].forEach(function (method) {
      endpoint[method] = sinon.stub().returns(endpoint);
    });

    // terminal methods
    ['get', 'delete', 'post', 'put'].forEach(function (method) {
      endpoint[method] = sinon.stub();
    });

    repo = this.$inject('WebhookRepository').getInstance(space);
  });

  describe('#getAll()', function () {
    pit('calls endpoint and extracts items', function () {
      var items = [1, 2, 3];
      endpoint.get.resolves({items: items});

      return repo.getAll().then(function (items2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions'));
        expect(items).toBe(items2);
      });
    });
  });

  describe('#get()', function () {
    pit('calls endpoint with an ID', function () {
      var webhook = {url: 'http://test.com'};
      endpoint.get.resolves(webhook);

      return repo.get('whid').then(function (webhook2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions', 'whid'));
        expect(webhook).toBe(webhook2);
      });
    });
  });

  describe('#remove()', function () {
    pit('calls endpoint with an ID extracted from a webook object', function () {
      var webhook = {sys: {id: 'whid'}};
      endpoint.delete.resolves();

      return repo.remove(webhook).then(function () {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions', 'whid'));
        sinon.assert.calledOnce(endpoint.delete);
      });
    });
  });

  describe('#create()', function () {
    pit('calls endpoint with a webhook as a payload', function () {
      var webhook = {url: 'http://test.com'};
      endpoint.post.resolves(_.extend({sys: {id: 'whid'}}, webhook));

      return repo.create(webhook).then(function (webhook2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions'));
        sinon.assert.calledOnce(endpoint.payload.withArgs(webhook));
        expect(webhook.url).toBe(webhook2.url);
      });
    });
  });

  describe('#save()', function () {
    pit('calls endpoint with an ID, webhook as a payload and version header', function () {
      var webhook = {sys: {id: 'whid', version: 7}, url: 'http://test.com'};
      endpoint.put.resolves(_.extend({sys: {id: 'whid', version: 8}}, webhook));

      return repo.save(webhook).then(function (webhook2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions', 'whid'));
        sinon.assert.calledOnce(endpoint.payload);
        sinon.assert.calledOnce(endpoint.headers);

        expect(endpoint.payload.firstCall.args[0].url).toBe('http://test.com');
        expect(endpoint.payload.firstCall.args[0].sys).toBeUndefined();
        expect(endpoint.headers.firstCall.args[0]['X-Contentful-Version']).toBe(7);
        expect(webhook.url).toBe(webhook2.url);
      });
    });
  });
});
