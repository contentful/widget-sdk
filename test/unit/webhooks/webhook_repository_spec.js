'use strict';

describe('Webhook Repository', function () {
  let space, endpoint, repo;

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
    it('calls endpoint and extracts items', function () {
      const items = [1, 2, 3];
      endpoint.get.resolves({items: items});

      return repo.getAll().then(function (items2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions'));
        expect(items).toBe(items2);
      });
    });
  });

  describe('#get()', function () {
    it('calls endpoint with an ID', function () {
      const webhook = {url: 'http://test.com'};
      endpoint.get.resolves(webhook);

      return repo.get('whid').then(function (webhook2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions', 'whid'));
        expect(webhook).toBe(webhook2);
      });
    });
  });

  describe('#remove()', function () {
    it('calls endpoint with an ID extracted from a webook object', function () {
      const webhook = {sys: {id: 'whid'}};
      endpoint.delete.resolves();

      return repo.remove(webhook).then(function () {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions', 'whid'));
        sinon.assert.calledOnce(endpoint.delete);
      });
    });
  });

  describe('#save()', function () {
    it('for a new entity, posts to the endpoint with a webhook as a payload', function () {
      const webhook = {url: 'http://test.com'};
      endpoint.post.resolves(_.extend({sys: {id: 'whid'}}, webhook));

      return repo.save(webhook).then(function (webhook2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions'));
        sinon.assert.calledOnce(endpoint.payload.withArgs(webhook));
        sinon.assert.calledOnce(endpoint.post);
        expect(webhook.url).toBe(webhook2.url);
      });
    });

    it('for existing entity, puts to the endpoint with an ID, webhook as a payload and version header', function () {
      const webhook = {sys: {id: 'whid', version: 7}, url: 'http://test.com'};
      endpoint.put.resolves(_.extend({sys: {id: 'whid', version: 8}}, webhook));

      return repo.save(webhook).then(function (webhook2) {
        sinon.assert.calledOnce(space.endpoint.withArgs('webhook_definitions', 'whid'));
        sinon.assert.calledOnce(endpoint.payload);
        sinon.assert.calledOnce(endpoint.headers);
        sinon.assert.calledOnce(endpoint.put);

        expect(endpoint.payload.firstCall.args[0].url).toBe('http://test.com');
        expect(endpoint.headers.firstCall.args[0]['X-Contentful-Version']).toBe(7);
        expect(webhook.url).toBe(webhook2.url);
      });
    });
  });
});
