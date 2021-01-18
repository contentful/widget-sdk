import describeEntity from './entity';
import describeArchivable from './archivable';
import { describeResource, describeGetResource, describeContentEntity } from './space_resource';

export default function describeEntry(context) {
  const entry = { singular: 'entry', plural: 'entries' };
  describeGetResource(entry, undefined, context);
  describeContentEntity(entry, setupEntity, context);
  describeEntity(entry, setupEntity, context);
  describeArchivable(entry, setupEntity, context);

  function setupEntity() {
    beforeEach(function () {
      context.entity = context.space.newEntry({
        sys: { type: 'Entry', contentType: { sys: { id: 'abcd' } } },
      });
    });
  }

  describeResource(entry, undefined, context);

  describe('gets content type id', function () {
    setupEntity();

    it('gets content type id', function () {
      expect(context.entity.getContentTypeId()).toEqual('abcd');
    });
  });

  describe('create entry resource', function () {
    const serverData = Object.freeze({
      name: 'my resource',
      sys: Object.freeze({ id: '43', type: 'resource' }),
      fields: 'hey ho',
    });

    it('posts to server', async function () {
      context.request.respond(serverData);
      const resource = await context.space.createEntry('123', { name: 'my resource' });
      expect(context.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/spaces/42/entries',
        data: { name: 'my resource' },
        headers: { 'X-Contentful-Content-Type': '123' },
      });
      expect(resource.getId()).toEqual('43');
    });

    it('identical object is retrieved by .getId()', async function () {
      context.request.respond(serverData);
      const resource = await context.space.createEntry('123', { name: 'my resource' });
      expect(resource.getId()).toEqual('43');
    });

    it('updates with id given', async function () {
      const newData = {
        name: 'my resource',
        sys: { id: '55' },
      };
      context.request.respond(serverData);
      await context.space.createEntry('123', newData);
      expect(context.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/spaces/42/entries/55',
        data: newData,
        headers: { 'X-Contentful-Content-Type': '123' },
      });
    });
  });
}
