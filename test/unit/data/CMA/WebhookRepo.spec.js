import createWebhookRepo from 'data/CMA/WebhookRepo.es6';

describe('Webhook Repo', function() {
  beforeEach(function() {
    this.endpoint = {};
    this.space = { endpoint: sinon.stub().returns(this.endpoint) };

    // chainable methods
    ['payload', 'headers'].forEach(method => {
      this.endpoint[method] = sinon.stub().returns(this.endpoint);
    });

    // terminal methods
    ['get', 'delete', 'post', 'put'].forEach(method => {
      this.endpoint[method] = sinon.stub();
    });

    this.repo = createWebhookRepo(this.space);
  });

  describe('#getAll()', function() {
    it('calls endpoint and extracts items', async function() {
      const items = [1, 2, 3];
      this.endpoint.get.resolves({ items: items });

      const items2 = await this.repo.getAll();
      sinon.assert.calledOnce(this.space.endpoint.withArgs('webhook_definitions'));
      expect(items).toEqual(items2);
    });
  });

  describe('#get()', function() {
    it('calls endpoint with an ID', async function() {
      const webhook = { url: 'http://test.com' };
      this.endpoint.get.resolves(webhook);

      const fetched = await this.repo.get('whid');
      sinon.assert.calledOnce(this.space.endpoint.withArgs('webhook_definitions', 'whid'));
      expect(webhook).toBe(fetched);
    });

    it('stringifies payload transformation', async function() {
      const webhook = { url: 'http://test.com', transformation: { body: { test: true } } };
      this.endpoint.get.resolves(webhook);

      const fetched = await this.repo.get('whid');
      const expected = JSON.stringify({ test: true }, null, 2);
      expect(fetched.transformation.body).toBe(expected);
    });
  });

  describe('#remove()', function() {
    it('calls endpoint with an ID extracted from a webook object', async function() {
      const webhook = { sys: { id: 'whid' } };
      this.endpoint.delete.resolves();

      await this.repo.remove(webhook);
      sinon.assert.calledOnce(this.space.endpoint.withArgs('webhook_definitions', 'whid'));
      sinon.assert.calledOnce(this.endpoint.delete);
    });
  });

  describe('#save()', function() {
    it('for a new entity, posts to the endpoint with a webhook as a payload', async function() {
      const webhook = { url: 'http://test.com' };
      this.endpoint.post.resolves({ ...webhook, sys: { id: 'whid' } });

      const created = await this.repo.save(webhook);
      sinon.assert.calledOnce(this.space.endpoint.withArgs('webhook_definitions'));
      sinon.assert.calledOnce(this.endpoint.payload.withArgs(webhook));
      sinon.assert.calledOnce(this.endpoint.post);
      expect(webhook.url).toBe(created.url);
    });

    it('for existing entity, puts to the endpoint with an ID, webhook as a payload and version header', async function() {
      const webhook = { sys: { id: 'whid', version: 7 }, url: 'http://test.com' };
      this.endpoint.put.resolves({ ...webhook, sys: { id: 'whid', version: 8 } });

      const saved = await this.repo.save(webhook);
      sinon.assert.calledOnce(this.space.endpoint.withArgs('webhook_definitions', 'whid'));
      sinon.assert.calledOnce(this.endpoint.payload);
      sinon.assert.calledOnce(this.endpoint.headers);
      sinon.assert.calledOnce(this.endpoint.put);

      expect(this.endpoint.payload.firstCall.args[0].url).toBe('http://test.com');
      expect(this.endpoint.headers.firstCall.args[0]['X-Contentful-Version']).toBe(7);
      expect(webhook.url).toBe(saved.url);
    });

    it('parses body transformation before saving and stringifies the result', async function() {
      const webhook = { url: 'http://test.com', transformation: { body: '{"test":true}' } };
      this.endpoint.post.resolves({
        ...webhook,
        transformation: { body: { test: true } },
        sys: { id: 'whid' }
      });

      const saved = await this.repo.save(webhook);
      sinon.assert.calledOnce(
        this.endpoint.payload.withArgs({
          url: 'http://test.com',
          transformation: { body: { test: true } }
        })
      );
      expect(saved.transformation.body).toBe(JSON.stringify({ test: true }, null, 2));
    });
  });

  describe('#hasValidBodyTransformation()', function() {
    it('is valid with no body transformation', function() {
      expect(this.repo.hasValidBodyTransformation({})).toBe(true);
      expect(this.repo.hasValidBodyTransformation({ transformation: {} })).toBe(true);
    });

    it('is valid with parseable JSON string', function() {
      const webhook = { transformation: { body: '{"test":true}' } };
      expect(this.repo.hasValidBodyTransformation(webhook)).toBe(true);
      webhook.transformation.body = 'null';
      expect(this.repo.hasValidBodyTransformation(webhook)).toBe(true);
    });

    it('is invalid if a non-string value is given', function() {
      const webhook = { transformation: { body: { test: true } } };
      expect(this.repo.hasValidBodyTransformation(webhook)).toBe(false);
      webhook.transformation.body = null;
      expect(this.repo.hasValidBodyTransformation(webhook)).toBe(false);
    });

    it('is invalid with non-parsable JSON string', function() {
      const webhook = { transformation: { body: '{"test":true' } };
      expect(this.repo.hasValidBodyTransformation(webhook)).toBe(false);
      webhook.transformation.body = '';
      expect(this.repo.hasValidBodyTransformation(webhook)).toBe(false);
    });
  });
});
