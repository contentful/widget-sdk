/* jshint expr: true */
const {coit} = require('./support');
const {expect} = require('chai');
const describeEntity = require('./entity');
const describeArchivable = require('./archivable');
const {
  describeResource,
  describeGetResource,
  describeContentEntity
} = require('./space_resource');

module.exports = function describeEntry () {
  const entry = { singular: 'entry', plural: 'entries' };
  describeGetResource(entry);
  describeContentEntity(entry, setupEntity);
  describeEntity(entry, setupEntity);
  describeArchivable(entry, setupEntity);

  function setupEntity () {
    beforeEach(function () {
      this.entity = this.space.newEntry({sys: {type: 'Entry', contentType: {sys: {id: 'abcd'}}}});
    });
  }

  describeResource(entry);

  describe('gets content type id', function () {
    setupEntity();

    it('gets content type id', function () {
      expect(this.entity.getContentTypeId()).to.be.equal('abcd');
    });
  });

  describe('create entry resource', function () {
    const serverData = Object.freeze({
      name: 'my resource',
      sys: Object.freeze({ id: '43', type: 'resource' }),
      fields: 'hey ho'
    });

    coit('posts to server', function* () {
      this.request.respond(serverData);
      var resource = yield this.space.createEntry('123', {name: 'my resource'});
      expect(this.request).to.be.calledWith({
        method: 'POST',
        url: '/spaces/42/entries',
        data: { name: 'my resource' },
        headers: { 'X-Contentful-Content-Type': '123' }
      });
      expect(resource.getId()).to.equal('43');
    });

    coit('identical object is retrieved by .getId()', function* () {
      this.request.respond(serverData);
      var resource = yield this.space.createEntry('123', {name: 'my resource'});
      expect(resource.getId()).to.equal('43');
    });

    coit('updates with id given', function* () {
      var newData = {
        name: 'my resource',
        sys: { id: '55' }
      };
      this.request.respond(serverData);
      yield this.space.createEntry('123', newData);
      expect(this.request).to.be.calledWith({
        method: 'PUT',
        url: '/spaces/42/entries/55',
        data: newData,
        headers: { 'X-Contentful-Content-Type': '123' }
      });
    });
  });
};
