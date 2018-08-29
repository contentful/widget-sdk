import describeEntity from './entity';
import describeArchivable from './archivable';
import { describeResource, describeGetResource, describeContentEntity } from './space_resource';

export default function describeEntry() {
  const entry = { singular: 'entry', plural: 'entries' };
  describeGetResource(entry);
  describeContentEntity(entry, setupEntity);
  describeEntity(entry, setupEntity);
  describeArchivable(entry, setupEntity);

  function setupEntity() {
    beforeEach(function() {
      this.entity = this.space.newEntry({
        sys: { type: 'Entry', contentType: { sys: { id: 'abcd' } } }
      });
    });
  }

  describeResource(entry);

  describe('gets content type id', function() {
    setupEntity();

    it('gets content type id', function() {
      expect(this.entity.getContentTypeId()).toEqual('abcd');
    });
  });

  describe('create entry resource', function() {
    const serverData = Object.freeze({
      name: 'my resource',
      sys: Object.freeze({ id: '43', type: 'resource' }),
      fields: 'hey ho'
    });

    it('posts to server', function*() {
      this.request.respond(serverData);
      const resource = yield this.space.createEntry('123', { name: 'my resource' });
      sinon.assert.calledWith(this.request, {
        method: 'POST',
        url: '/spaces/42/entries',
        data: { name: 'my resource' },
        headers: { 'X-Contentful-Content-Type': '123' }
      });
      expect(resource.getId()).toEqual('43');
    });

    it('identical object is retrieved by .getId()', function*() {
      this.request.respond(serverData);
      const resource = yield this.space.createEntry('123', { name: 'my resource' });
      expect(resource.getId()).toEqual('43');
    });

    it('updates with id given', function*() {
      const newData = {
        name: 'my resource',
        sys: { id: '55' }
      };
      this.request.respond(serverData);
      yield this.space.createEntry('123', newData);
      sinon.assert.calledWith(this.request, {
        method: 'PUT',
        url: '/spaces/42/entries/55',
        data: newData,
        headers: { 'X-Contentful-Content-Type': '123' }
      });
    });
  });
}
