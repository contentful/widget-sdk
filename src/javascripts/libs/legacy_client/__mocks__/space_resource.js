/**
 * This module tests generic factory and persistence methods for
 * child resources of `Space`.
 *
 * The factory methods that are tested on the space are
 * - `describeGetResource`
 * - `describeNewResource`
 * - `describeCreateResource`
 *
 * Persistence methods on resources are described by
 * - `describeResource`
 */

import { cloneDeep } from 'lodash';

const serverData = Object.freeze({
  name: 'my resource',
  sys: Object.freeze({ id: '43', type: 'resource' }),
  fields: 'hey ho',
});

const serverList = Object.freeze({
  sys: Object.freeze({ type: 'Array' }),
  total: 123,
  items: [serverData],
});

/**
 * Describe `getResource(id)` and `getResources(query)` factory
 * methods.
 */
export const describeGetResource = entityDescription('resource factory', (names, _, context) => {
  describe('.getOne(id)', function () {
    it('obtains resource from server', async function () {
      context.request.respond(serverData);
      const resource = await context.space[names.getOne]('43');
      expect(resource.data).toEqual(serverData);
      expect(context.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/spaces/42/${names.slug}/43`,
      });
    });

    it('returns identical object', async function () {
      context.request.respond(serverData);
      context.request.respond(serverData);

      const resource1 = await context.space[names.getOne]('43');
      const resource2 = await context.space[names.getOne]('43');
      expect(resource1).toEqual(resource2);
    });

    it('throws when id not given', function () {
      expect(() => context.space[names.getOne]()).toThrow(new Error('No id provided'));
    });

    it('rejects server error', async function () {
      context.request.throw('server error');

      try {
        await context.space[names.getOne]('43');
      } catch (err) {
        expect(err).toBe('server error');
        return;
      }
    });
  });

  describe('.getAll(query)', function () {
    it('obtains resource list from server', async function () {
      context.request.respond(serverList);
      const [resource] = await context.space[names.getAll]('myquery');
      expect(resource.data).toEqual(serverData);
      expect(context.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/spaces/42/${names.slug}`,
        params: 'myquery',
      });
    });

    it('sets total on returned list', async function () {
      context.request.respond(serverList);
      const entries = await context.space[names.getAll]('myquery');
      expect(entries.total).toEqual(123);
    });

    it('returns list with identitcal objects', async function () {
      context.request.respond(serverList);
      context.request.respond(serverList);
      const entries1 = await context.space[names.getAll]('myquery');
      const entries2 = await context.space[names.getAll]('myquery');
      const identical = entries1.every((_, i) => entries1[i] === entries2[i]);
      expect(identical).toBe(true);
    });
  });
});

/**
 * Describe `createResource(data)` factory method.
 */
export const describeCreateResource = entityDescription('resource factory', (names, _, context) => {
  describe('.createOne(data)', function () {
    it('sends POST request without id', async function () {
      const newData = {
        name: 'my resource',
        fields: null,
      };
      context.request.respond(serverData);
      const resource = await context.space[names.createOne](newData);
      expect(context.request).toHaveBeenCalledWith({
        method: 'POST',
        url: `/spaces/42/${names.slug}`,
        data: newData,
      });
      expect(resource.getId()).toEqual('43');
    });

    it('sends PUT request with id', async function () {
      const newData = {
        sys: { id: '55' },
        name: 'my resource',
        fields: null,
      };
      context.request.respond(serverData);
      await context.space[names.createOne](newData);
      expect(context.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: `/spaces/42/${names.slug}/55`,
        data: newData,
      });
    });

    it('identical object is retrieved by .getId()', async function () {
      context.request.respond(serverData);
      const resource1 = await context.space[names.createOne]({ name: 'my resource' });
      expect(resource1.getId()).toEqual('43');

      context.request.respond(serverData);
      const resource2 = await context.space[names.getOne]('43');
      expect(resource1).toEqual(resource2);
    });
  });
});

/**
 * Describe `newResource(data)` factory method.
 */
export const describeNewResource = entityDescription('resource factory', (names, _, context) => {
  it('.new(data)', async function () {
    // TODO this should be a promise for consistency
    const resource = context.space[names.new]();
    expect(resource.getId()).toBeUndefined();

    resource.data.name = 'new name';
    const saveData = cloneDeep(resource.data);
    context.request.respond(serverData);
    await resource.save();
    expect(context.request).toHaveBeenCalledWith({
      method: 'POST',
      url: `/spaces/42/${names.slug}`,
      data: saveData,
    });
  });
});

/**
 * Describe methods specific to entities which hold content
 */
export const describeContentEntity = entityDescription(
  'content entity methods',
  (names, description, context) => {
    if (description) {
      description();
    }

    describe('#getName()', function () {
      it('returns id', function () {
        context.entity.data.sys.id = 'myid';
        expect(context.entity.getName()).toEqual('myid');
      });

      it('returns undefined without data', function () {
        delete context.entity.data;
        expect(context.entity.getName()).toBeUndefined();
      });
    });

    describe('#canPublish()', function () {
      it('true if no published version', function () {
        context.entity.setPublishedVersion(null);
        expect(context.entity.canPublish()).toBe(true);
      });

      it('false if entity deleted', function () {
        expect(context.entity.canPublish()).toBe(true);
        delete context.entity.data;
        expect(context.entity.canPublish()).toBe(false);
      });

      it('false if entity is archvied', function () {
        expect(context.entity.canPublish()).toBe(true);
        context.entity.data.sys.archivedVersion = 1;
        expect(context.entity.canPublish()).toBe(false);
      });

      it('false if already published version', function () {
        expect(context.entity.canPublish()).toBe(true);

        const publishedVersion = 123;
        context.entity.setVersion(publishedVersion + 1);
        context.entity.setPublishedVersion(publishedVersion);
        expect(context.entity.canPublish()).toBe(false);
      });

      it('true if entity is updated since publishing', function () {
        const publishedVersion = 123;
        context.entity.setVersion(publishedVersion + 1);
        context.entity.setPublishedVersion(publishedVersion);
        expect(context.entity.canPublish()).toBe(false);

        context.entity.setVersion(publishedVersion + 2);
        expect(context.entity.canPublish()).toBe(true);
      });
    });

    describe('#unpublish', function () {
      it('sends DELETE request', async function () {
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.unpublish();
        expect(context.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid/published`,
        });
      });
    });
  }
);

/**
 * Describe resource persistence methods `save` and `delete`.
 *
 * Sets up a new resource beforehand.
 */
export const describeResource = entityDescription('resource', (names, description, context) => {
  const contentTypeId = 'ctid';
  const serverData = Object.freeze({
    name: 'my resource',
    sys: Object.freeze({
      id: '43',
      type: 'resource',
      version: 123,
    }),
  });

  beforeEach(async function () {
    context.request.respond(serverData);
    context.resource = await context.space[names.getOne](contentTypeId);
    context[names.singular] = context.resource;
    context.request.reset();
  });

  if (description) {
    description(serverData);
  }

  it('#delete()', async function () {
    context.request.respond(null);
    await context.resource.delete();
    expect(context.request).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `/spaces/42/${names.plural}/43`,
    });
  });

  describe('#save() without id', function () {
    beforeEach(function () {
      delete context.resource.data.sys.id;
    });

    it('sends POST request', async function () {
      const resourceData = cloneDeep(context.resource.data);
      context.request.respond(resourceData);
      await context.resource.save();
      expect(context.request).toHaveBeenCalledWith({
        method: 'POST',
        url: `/spaces/42/${names.plural}`,
        data: resourceData,
      });
    });

    it('updates from server response', async function () {
      const serverData = { name: 'server name' };
      context.request.respond(serverData);
      await context.resource.save();
      expect(context.resource.data).toEqual(serverData);
    });

    it('updates identity map', async function () {
      context.request.respond(serverData);
      await context.resource.save();

      context.request.respond(serverData);
      const resource = await context.space[names.getOne]('43');
      expect(resource).toEqual(context.resource);
    });
  });

  describe('#save() with id', function () {
    it('sends PUT request', async function () {
      context.resource.data.name = 'my new resource';
      const resourceData = cloneDeep(context.resource.data);
      context.request.respond(resourceData);
      await context.resource.save();
      expect(context.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: `/spaces/42/${names.plural}/43`,
        data: resourceData,
        headers: { 'X-Contentful-Version': 123 },
      });
    });

    it('updates from server response', async function () {
      const serverData = { name: 'server name' };
      context.request.respond(serverData);
      await context.resource.save();
      expect(context.resource.data).toEqual(serverData);
    });

    it('updates identity map', async function () {
      context.request.respond(serverData);
      await context.resource.save();

      context.request.respond(serverData);
      const resource = await context.space[names.getOne]('43');
      expect(resource).toEqual(context.resource);
    });
  });
});

function entityDescription(label, descriptor) {
  return function (names, extendedDescriptor, context) {
    names = makeNames(names);
    describe(`${names.singular} ${label}`, function () {
      descriptor(names, extendedDescriptor, context);
    });
  };
}

function makeNames(names) {
  if (typeof names === 'string') {
    names = { singular: names };
  } else {
    names = cloneDeep(names);
  }
  names.plural = names.plural || names.singular + 's';
  names.slug = names.slug || names.plural;
  names.Plural = capitalize(names.plural);
  names.Singular = capitalize(names.singular);
  names.getOne = `get${camelCase(names.Singular)}`;
  names.getAll = `get${camelCase(names.Plural)}`;
  names.createOne = `create${camelCase(names.Singular)}`;
  names.new = `new${camelCase(names.Singular)}`;
  return names;
}

function capitalize(string) {
  return string.substr(0, 1).toUpperCase() + string.substr(1);
}

function camelCase(input) {
  return input.replace(/[-_](.)/g, function (_match, group1) {
    return group1.toUpperCase();
  });
}
