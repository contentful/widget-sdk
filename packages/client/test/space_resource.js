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


/* jshint expr: true */
const _ = require('lodash');
const co = require('co');
const {coit, clone} = require('./support');
const {expect} = require('chai');


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
exports.describeGetResource =
entityDescription('resource factory', (names) => {
  describe('.getOne(id)', function () {
    coit('obtains resource from server', function* () {
      this.request.respond(serverData);
      var resource = yield this.space[names.getOne]('43');
      expect(resource.data).to.deep.equal(serverData);
      expect(this.request).to.be.calledWith({
        method: 'GET',
        url: `/spaces/42/${names.slug}/43`
      });
    });

    coit('returns identical object', function* () {
      this.request.respond(serverData);
      this.request.respond(serverData);

      var resource1 = yield this.space[names.getOne]('43');
      var resource2 = yield this.space[names.getOne]('43');
      expect(resource1).to.equal(resource2);
    });

    it('throws when id not given', function () {
      expect(() => this.space[names.getOne]()).to.throw('No id provided');
    });

    coit('rejects server error', function* () {
      this.request.throw('server error');
      var resource = this.space[names.getOne]('43');
      yield expect(resource).to.be.rejectedWith('server error');
    });
  });

  describe('.getAll(query)', function () {
    coit('obtains resource list from server', function* () {
      this.request.respond(serverList);
      var [resource] = yield this.space[names.getAll]('myquery');
      expect(resource.data).to.deep.equal(serverData);
      expect(this.request).to.be.calledWith({
        method: 'GET',
        url: `/spaces/42/${names.slug}`,
        params: 'myquery'
      });
    });

    coit('sets total on returned list', function* () {
      this.request.respond(serverList);
      var entries = yield this.space[names.getAll]('myquery');
      expect(entries.total).to.equal(123);
    });

    coit('returns list with identitcal objects', function* () {
      this.request.respond(serverList);
      this.request.respond(serverList);
      var entries1 = yield this.space[names.getAll]('myquery');
      var entries2 = yield this.space[names.getAll]('myquery');
      expect(entries1).to.have.members(entries2);
    });
  });
});


/**
 * Describe `createResource(data)` factory method.
 */
exports.describeCreateResource =
entityDescription('resource factory', (names) => {
  describe('.createOne(data)', function () {
    coit('sends POST request without id', function* () {
      var newData = {
        name: 'my resource',
        fields: null
      };
      this.request.respond(serverData);
      var resource = yield this.space[names.createOne](newData);
      expect(this.request).to.be.calledWith({
        method: 'POST',
        url: `/spaces/42/${names.slug}`,
        data: newData
      });
      expect(resource.getId()).to.equal('43');
    });

    coit('sends PUT request with id', function* () {
      var newData = {
        sys: { id: '55' },
        name: 'my resource',
        fields: null
      };
      this.request.respond(serverData);
      yield this.space[names.createOne](newData);
      expect(this.request).to.be.calledWith({
        method: 'PUT',
        url: `/spaces/42/${names.slug}/55`,
        data: newData
      });
    });

    coit('identical object is retrieved by .getId()', function* () {
      this.request.respond(serverData);
      var resource1 = yield this.space[names.createOne]({name: 'my resource'});
      expect(resource1.getId()).to.equal('43');

      this.request.respond(serverData);
      var resource2 = yield this.space[names.getOne]('43');
      expect(resource1).to.equal(resource2);
    });
  });
});


/**
 * Describe `newResource(data)` factory method.
 */
exports.describeNewResource =
entityDescription('resource factory', (names) => {
  coit('.new(data)', function* () {
    // TODO this should be a promise for consistency
    var resource = this.space[names.new]();
    expect(resource.getId()).to.be.undefined;

    resource.data.name = 'new name';
    var saveData = clone(resource.data);
    this.request.respond(serverData);
    yield resource.save();
    expect(this.request).to.be.calledWith({
      method: 'POST',
      url: `/spaces/42/${names.slug}`,
      data: saveData
    });
  });
});


/**
 * Describe methods specific to entities which hold content
 */
exports.describeContentEntity =
entityDescription('content entity methods', (names, description) => {
  if (description) description();

  describe('#getName()', function () {
    it('returns id', function () {
      this.entity.data.sys.id = 'myid';
      expect(this.entity.getName()).to.equal('myid');
    });

    it('returns undefined without data', function () {
      delete this.entity.data;
      expect(this.entity.getName()).to.be.undefined;
    });
  });

  describe('#canPublish()', function () {
    it('true if no published version', function () {
      this.entity.setPublishedVersion(null);
      expect(this.entity.canPublish()).to.be.true;
    });

    it('false if entity deleted', function () {
      expect(this.entity.canPublish()).to.be.true;
      delete this.entity.data;
      expect(this.entity.canPublish()).to.be.false;
    });

    it('false if entity is archvied', function () {
      expect(this.entity.canPublish()).to.be.true;
      this.entity.data.sys.archivedVersion = 1;
      expect(this.entity.canPublish()).to.be.false;
    });

    it('false if already published version', function () {
      expect(this.entity.canPublish()).to.be.true;

      var publishedVersion = 123;
      this.entity.setVersion(publishedVersion + 1);
      this.entity.setPublishedVersion(publishedVersion);
      expect(this.entity.canPublish()).to.be.false;
    });

    it('true if entity is updated since publishing', function () {
      var publishedVersion = 123;
      this.entity.setVersion(publishedVersion + 1);
      this.entity.setPublishedVersion(publishedVersion);
      expect(this.entity.canPublish()).to.be.false;

      this.entity.setVersion(publishedVersion + 2);
      expect(this.entity.canPublish()).to.be.true;
    });
  });


  describe('#unpublish', function () {
    coit('sends DELETE request', function* () {
      this.entity.data.sys.id = 'eid';
      this.request.respond(this.entity.data);
      yield this.entity.unpublish();
      expect(this.request).to.be.calledWith({
        method: 'DELETE',
        url: `/spaces/42/${names.plural}/eid/published`
      });
    });
  });
});


/**
 * Describe resource persistence methods `save` and `delete`.
 *
 * Sets up a new resource beforehand.
 */
exports.describeResource =
entityDescription('resource', (names, description) => {
  const contentTypeId = 'ctid';
  const serverData = Object.freeze({
    name: 'my resource',
    sys: Object.freeze({
      id: '43',
      type: 'resource',
      version: 123
    })
  });

  beforeEach(co.wrap(function* () {
    this.request.respond(serverData);
    this.resource = yield this.space[names.getOne](contentTypeId);
    this[names.singular] = this.resource;
    this.request.reset();
  }));

  if (description) { description(serverData); }

  coit('#delete()', function* () {
    this.request.respond(null);
    yield this.resource.delete();
    expect(this.request).to.be.calledWith({
      method: 'DELETE',
      url: `/spaces/42/${names.plural}/43`
    });
  });

  describe('#save() without id', function () {
    beforeEach(function () {
      delete this.resource.data.sys.id;
    });

    coit('sends POST request', function* () {
      var resourceData = clone(this.resource.data);
      this.request.respond(resourceData);
      yield this.resource.save();
      expect(this.request).to.be.calledWith({
        method: 'POST',
        url: `/spaces/42/${names.plural}`,
        data: resourceData
      });
    });

    coit('updates from server response', function* () {
      let serverData = {name: 'server name'};
      this.request.respond(serverData);
      yield this.resource.save();
      expect(this.resource.data).to.deep.equal(serverData);
    });

    coit('updates identity map', function* () {
      this.request.respond(serverData);
      yield this.resource.save();

      this.request.respond(serverData);
      var resource = yield this.space[names.getOne]('43');
      expect(resource).to.equal(this.resource);
    });
  });

  describe('#save() with id', function () {
    coit('sends PUT request', function* () {
      this.resource.data.name = 'my new resource';
      var resourceData = clone(this.resource.data);
      this.request.respond(resourceData);
      yield this.resource.save();
      expect(this.request).to.be.calledWith({
        method: 'PUT',
        url: `/spaces/42/${names.plural}/43`,
        data: resourceData,
        headers: { 'X-Contentful-Version': 123 }
      });
    });

    coit('updates from server response', function* () {
      let serverData = {name: 'server name'};
      this.request.respond(serverData);
      yield this.resource.save();
      expect(this.resource.data).to.deep.equal(serverData);
    });

    coit('updates identity map', function* () {
      this.request.respond(serverData);
      yield this.resource.save();

      this.request.respond(serverData);
      var resource = yield this.space[names.getOne]('43');
      expect(resource).to.equal(this.resource);
    });
  });
});


/**
 * Describe versioned resource persistence methods `save` and `delete`.
 *
 * The same as `describeResource` except that it checks for version
 * headers.
 */
exports.describeVersionedResource =
entityDescription('resource', (names, description) => {
  const serverData = Object.freeze({
    name: 'my resource',
    sys: {
      id: '43',
      type: 'resource',
      version: 123
    }
  });

  beforeEach(co.wrap(function* () {
    this.request.respond(serverData);
    this.resource = yield this.space[names.getOne](serverData);
    this[names.singular] = this.resource;
    this.request.reset();
  }));

  if (description) { description(serverData); }

  coit('#delete()', function* () {
    this.request.respond(null);
    yield this.resource.delete();
    expect(this.request).to.be.calledWith({
      method: 'DELETE',
      url: `/spaces/42/${names.plural}/43`
    });
  });

  describe('#save()', function () {
    coit('sends put request with id', function* () {
      this.resource.data.name = 'my new resource';
      var resourceData = clone(this.resource.data);
      this.request.respond(resourceData);
      yield this.resource.save();
      expect(this.request).to.be.calledWith({
        method: 'PUT',
        url: `/spaces/42/${names.plural}/43`,
        data: resourceData,
        headers: { 'X-Contentful-Version': 123 }
      });
    });

    coit('updates from server response');
  });
});


function entityDescription (label, descriptor) {
  return function (names, extendedDescriptor) {
    names = makeNames(names);
    describe(`${names.singular} ${label}`, function () {
      descriptor(names, extendedDescriptor);
    });
  };
}


function makeNames (names) {
  if (typeof names === 'string') { names = {singular: names}; } else { names = _.clone(names); }
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


function capitalize (string) {
  return string.substr(0, 1).toUpperCase() + string.substr(1);
}


function camelCase (input) {
  return input.replace(/[-_](.)/g, function (_match, group1) {
    return group1.toUpperCase();
  });
}
