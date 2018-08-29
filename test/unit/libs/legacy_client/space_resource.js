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
 * - `describeVersionedResource`
 */

import { cloneDeep } from 'lodash';

const serverData = Object.freeze({
  name: 'my resource',
  sys: Object.freeze({ id: '43', type: 'resource' }),
  fields: 'hey ho'
});

const serverList = Object.freeze({
  sys: Object.freeze({ type: 'Array' }),
  total: 123,
  items: [serverData]
});

/**
 * Describe `getResource(id)` and `getResources(query)` factory
 * methods.
 */
export const describeGetResource = entityDescription('resource factory', names => {
  describe('.getOne(id)', function() {
    it('obtains resource from server', function*() {
      this.request.respond(serverData);
      const resource = yield this.space[names.getOne]('43');
      expect(resource.data).toEqual(serverData);
      sinon.assert.calledWith(this.request, {
        method: 'GET',
        url: `/spaces/42/${names.slug}/43`
      });
    });

    it('returns identical object', function*() {
      this.request.respond(serverData);
      this.request.respond(serverData);

      const resource1 = yield this.space[names.getOne]('43');
      const resource2 = yield this.space[names.getOne]('43');
      expect(resource1).toEqual(resource2);
    });

    it('throws when id not given', function() {
      expect(() => this.space[names.getOne]()).toThrow(new Error('No id provided'));
    });

    it('rejects server error', function*() {
      this.request.throw('server error');

      try {
        yield this.space[names.getOne]('43');
      } catch (err) {
        expect(err).toBe('server error');
        return;
      }
      fail('should reject');
    });
  });

  describe('.getAll(query)', function() {
    it('obtains resource list from server', function*() {
      this.request.respond(serverList);
      const [resource] = yield this.space[names.getAll]('myquery');
      expect(resource.data).toEqual(serverData);
      sinon.assert.calledWith(this.request, {
        method: 'GET',
        url: `/spaces/42/${names.slug}`,
        params: 'myquery'
      });
    });

    it('sets total on returned list', function*() {
      this.request.respond(serverList);
      const entries = yield this.space[names.getAll]('myquery');
      expect(entries.total).toEqual(123);
    });

    it('returns list with identitcal objects', function*() {
      this.request.respond(serverList);
      this.request.respond(serverList);
      const entries1 = yield this.space[names.getAll]('myquery');
      const entries2 = yield this.space[names.getAll]('myquery');
      const identical = entries1.every((_, i) => entries1[i] === entries2[i]);
      expect(identical).toBe(true);
    });
  });
});

/**
 * Describe `createResource(data)` factory method.
 */
export const describeCreateResource = entityDescription('resource factory', names => {
  describe('.createOne(data)', function() {
    it('sends POST request without id', function*() {
      const newData = {
        name: 'my resource',
        fields: null
      };
      this.request.respond(serverData);
      const resource = yield this.space[names.createOne](newData);
      sinon.assert.calledWith(this.request, {
        method: 'POST',
        url: `/spaces/42/${names.slug}`,
        data: newData
      });
      expect(resource.getId()).toEqual('43');
    });

    it('sends PUT request with id', function*() {
      const newData = {
        sys: { id: '55' },
        name: 'my resource',
        fields: null
      };
      this.request.respond(serverData);
      yield this.space[names.createOne](newData);
      sinon.assert.calledWith(this.request, {
        method: 'PUT',
        url: `/spaces/42/${names.slug}/55`,
        data: newData
      });
    });

    it('identical object is retrieved by .getId()', function*() {
      this.request.respond(serverData);
      const resource1 = yield this.space[names.createOne]({ name: 'my resource' });
      expect(resource1.getId()).toEqual('43');

      this.request.respond(serverData);
      const resource2 = yield this.space[names.getOne]('43');
      expect(resource1).toEqual(resource2);
    });
  });
});

/**
 * Describe `newResource(data)` factory method.
 */
export const describeNewResource = entityDescription('resource factory', names => {
  it('.new(data)', function*() {
    // TODO this should be a promise for consistency
    const resource = this.space[names.new]();
    expect(resource.getId()).toBeUndefined();

    resource.data.name = 'new name';
    const saveData = cloneDeep(resource.data);
    this.request.respond(serverData);
    yield resource.save();
    sinon.assert.calledWith(this.request, {
      method: 'POST',
      url: `/spaces/42/${names.slug}`,
      data: saveData
    });
  });
});

/**
 * Describe methods specific to entities which hold content
 */
export const describeContentEntity = entityDescription(
  'content entity methods',
  (names, description) => {
    if (description) description();

    describe('#getName()', function() {
      it('returns id', function() {
        this.entity.data.sys.id = 'myid';
        expect(this.entity.getName()).toEqual('myid');
      });

      it('returns undefined without data', function() {
        delete this.entity.data;
        expect(this.entity.getName()).toBeUndefined();
      });
    });

    describe('#canPublish()', function() {
      it('true if no published version', function() {
        this.entity.setPublishedVersion(null);
        expect(this.entity.canPublish()).toBe(true);
      });

      it('false if entity deleted', function() {
        expect(this.entity.canPublish()).toBe(true);
        delete this.entity.data;
        expect(this.entity.canPublish()).toBe(false);
      });

      it('false if entity is archvied', function() {
        expect(this.entity.canPublish()).toBe(true);
        this.entity.data.sys.archivedVersion = 1;
        expect(this.entity.canPublish()).toBe(false);
      });

      it('false if already published version', function() {
        expect(this.entity.canPublish()).toBe(true);

        const publishedVersion = 123;
        this.entity.setVersion(publishedVersion + 1);
        this.entity.setPublishedVersion(publishedVersion);
        expect(this.entity.canPublish()).toBe(false);
      });

      it('true if entity is updated since publishing', function() {
        const publishedVersion = 123;
        this.entity.setVersion(publishedVersion + 1);
        this.entity.setPublishedVersion(publishedVersion);
        expect(this.entity.canPublish()).toBe(false);

        this.entity.setVersion(publishedVersion + 2);
        expect(this.entity.canPublish()).toBe(true);
      });
    });

    describe('#unpublish', function() {
      it('sends DELETE request', function*() {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.unpublish();
        sinon.assert.calledWith(this.request, {
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid/published`
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
export const describeResource = entityDescription('resource', (names, description) => {
  const contentTypeId = 'ctid';
  const serverData = Object.freeze({
    name: 'my resource',
    sys: Object.freeze({
      id: '43',
      type: 'resource',
      version: 123
    })
  });

  beforeEach(function*() {
    this.request.respond(serverData);
    this.resource = yield this.space[names.getOne](contentTypeId);
    this[names.singular] = this.resource;
    this.request.reset();
  });

  if (description) {
    description(serverData);
  }

  it('#delete()', function*() {
    this.request.respond(null);
    yield this.resource.delete();
    sinon.assert.calledWith(this.request, {
      method: 'DELETE',
      url: `/spaces/42/${names.plural}/43`
    });
  });

  describe('#save() without id', function() {
    beforeEach(function() {
      delete this.resource.data.sys.id;
    });

    it('sends POST request', function*() {
      const resourceData = cloneDeep(this.resource.data);
      this.request.respond(resourceData);
      yield this.resource.save();
      sinon.assert.calledWith(this.request, {
        method: 'POST',
        url: `/spaces/42/${names.plural}`,
        data: resourceData
      });
    });

    it('updates from server response', function*() {
      const serverData = { name: 'server name' };
      this.request.respond(serverData);
      yield this.resource.save();
      expect(this.resource.data).toEqual(serverData);
    });

    it('updates identity map', function*() {
      this.request.respond(serverData);
      yield this.resource.save();

      this.request.respond(serverData);
      const resource = yield this.space[names.getOne]('43');
      expect(resource).toEqual(this.resource);
    });
  });

  describe('#save() with id', function() {
    it('sends PUT request', function*() {
      this.resource.data.name = 'my new resource';
      const resourceData = cloneDeep(this.resource.data);
      this.request.respond(resourceData);
      yield this.resource.save();
      sinon.assert.calledWith(this.request, {
        method: 'PUT',
        url: `/spaces/42/${names.plural}/43`,
        data: resourceData,
        headers: { 'X-Contentful-Version': 123 }
      });
    });

    it('updates from server response', function*() {
      const serverData = { name: 'server name' };
      this.request.respond(serverData);
      yield this.resource.save();
      expect(this.resource.data).toEqual(serverData);
    });

    it('updates identity map', function*() {
      this.request.respond(serverData);
      yield this.resource.save();

      this.request.respond(serverData);
      const resource = yield this.space[names.getOne]('43');
      expect(resource).toEqual(this.resource);
    });
  });
});

/**
 * Describe versioned resource persistence methods `save` and `delete`.
 *
 * The same as `describeResource` except that it checks for version
 * headers.
 */
export const describeVersionedResource = entityDescription('resource', (names, description) => {
  const serverData = Object.freeze({
    name: 'my resource',
    sys: {
      id: '43',
      type: 'resource',
      version: 123
    }
  });

  beforeEach(function*() {
    this.request.respond(serverData);
    this.resource = yield this.space[names.getOne](serverData);
    this[names.singular] = this.resource;
    this.request.reset();
  });

  if (description) {
    description(serverData);
  }

  it('#delete()', function*() {
    this.request.respond(null);
    yield this.resource.delete();
    sinon.assert.calledWith(this.request, {
      method: 'DELETE',
      url: `/spaces/42/${names.plural}/43`
    });
  });

  describe('#save()', function() {
    it('sends put request with id', function*() {
      this.resource.data.name = 'my new resource';
      const resourceData = cloneDeep(this.resource.data);
      this.request.respond(resourceData);
      yield this.resource.save();
      sinon.assert.calledWith(this.request, {
        method: 'PUT',
        url: `/spaces/42/${names.plural}/43`,
        data: resourceData,
        headers: { 'X-Contentful-Version': 123 }
      });
    });
  });
});

function entityDescription(label, descriptor) {
  return function(names, extendedDescriptor) {
    names = makeNames(names);
    describe(`${names.singular} ${label}`, function() {
      descriptor(names, extendedDescriptor);
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
  return input.replace(/[-_](.)/g, function(_match, group1) {
    return group1.toUpperCase();
  });
}
