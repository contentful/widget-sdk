import { createWebhookRepo } from './WebhookRepo';
import { createClient } from 'contentful-management';

describe('Webhook Repo', function () {
  let webhookMocks;
  let repo;
  let client;

  beforeEach(async function () {
    client = createClient(
      { accessToken: 'token' },
      { type: 'plain', defaults: { spaceId: 'space-id' } }
    );

    webhookMocks = {
      getMany: jest.fn(),
      get: jest.fn(),
      getCallDetails: jest.fn(),
      getHealthStatus: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    client.webhook = webhookMocks;

    repo = createWebhookRepo({ client });
  });

  describe('#getAll()', function () {
    it('calls endpoint and extracts items', async function () {
      const items = [1, 2, 3];
      webhookMocks.getMany.mockResolvedValue({ items: items });

      const items2 = await repo.getAll();

      expect(webhookMocks.getMany).toHaveBeenCalledTimes(1);
      expect(webhookMocks.getMany).toHaveBeenCalledWith({ query: { limit: 100 } });
      expect(items).toEqual(items2);
    });
  });

  describe('#get()', function () {
    it('calls endpoint with an ID', async function () {
      const webhook = { url: 'http://test.com' };

      webhookMocks.get.mockResolvedValue(webhook);

      const fetched = await repo.get('whid');
      expect(webhookMocks.get).toHaveBeenCalledTimes(1);
      expect(webhookMocks.get).toHaveBeenCalledWith({ webhookDefinitionId: 'whid' });
      expect(webhook).toBe(fetched);
    });

    it('stringifies payload transformation', async function () {
      const webhook = { url: 'http://test.com', transformation: { body: { test: true } } };

      webhookMocks.get.mockResolvedValue(webhook);

      const fetched = await repo.get('whid');
      const expected = JSON.stringify({ test: true }, null, 2);
      expect(fetched.transformation.body).toBe(expected);
    });
  });

  describe('#remove()', function () {
    it('calls endpoint with an ID extracted from a webook object', async function () {
      const webhook = { sys: { id: 'whid' } };
      webhookMocks.delete.mockResolvedValue();

      await repo.remove(webhook);

      expect(webhookMocks.delete).toHaveBeenCalledTimes(1);
      expect(webhookMocks.delete).toHaveBeenCalledWith({ webhookDefinitionId: 'whid' });
    });
  });

  describe('#save()', function () {
    it('for a new entity, posts to the endpoint with a webhook as a payload', async function () {
      const webhook = { url: 'http://test.com' };
      webhookMocks.create.mockResolvedValue({ ...webhook, sys: { id: 'whid' } });

      const created = await repo.save(webhook);
      expect(webhookMocks.create).toHaveBeenCalledTimes(1);
      expect(webhookMocks.create).toHaveBeenCalledWith({}, { url: 'http://test.com' });
      expect(webhook.url).toBe(created.url);
    });

    it('for existing entity, puts to the endpoint with an ID, webhook as a payload and version header', async function () {
      const webhook = { sys: { id: 'whid', version: 7 }, url: 'http://test.com' };
      webhookMocks.update.mockResolvedValue({ ...webhook, sys: { id: 'whid', version: 8 } });

      const saved = await repo.save(webhook);
      expect(webhookMocks.update).toHaveBeenCalledWith(
        { webhookDefinitionId: 'whid' },
        { sys: { id: 'whid', version: 7 }, url: 'http://test.com' }
      );
      expect(webhook.url).toBe(saved.url);
    });

    it('parses body transformation before saving and stringifies the result', async function () {
      const webhook = { url: 'http://test.com', transformation: { body: '{"test":true}' } };
      webhookMocks.create.mockResolvedValue({
        ...webhook,
        transformation: { body: { test: true } },
        sys: { id: 'whid' },
      });

      const saved = await repo.save(webhook);
      expect(webhookMocks.create).toHaveBeenCalledWith(
        {},
        {
          transformation: { body: { test: true } },
          url: 'http://test.com',
        }
      );
      expect(saved.transformation.body).toBe(JSON.stringify({ test: true }, null, 2));
    });
  });

  describe('#hasValidBodyTransformation()', function () {
    it('is valid with no body transformation', function () {
      expect(repo.hasValidBodyTransformation({})).toBe(true);
      expect(repo.hasValidBodyTransformation({ transformation: {} })).toBe(true);
    });

    it('is valid with parseable JSON string', function () {
      const webhook = { transformation: { body: '{"test":true}' } };
      expect(repo.hasValidBodyTransformation(webhook)).toBe(true);
      webhook.transformation.body = 'null';
      expect(repo.hasValidBodyTransformation(webhook)).toBe(true);
    });

    it('is invalid if a non-string value is given', function () {
      const webhook = { transformation: { body: { test: true } } };
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
      // @ts-expect-error mute typescript
      webhook.transformation.body = null;
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
    });

    it('is invalid with non-parsable JSON string', function () {
      const webhook = { transformation: { body: '{"test":true' } };
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
      webhook.transformation.body = '';
      expect(repo.hasValidBodyTransformation(webhook)).toBe(false);
    });
  });
});
