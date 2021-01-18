import describeEntity from './entity';
import { describeNewResource } from './space_resource';

/**
 * Adds ContentType specs if called.
 *
 * Requires `context.space` and `context.requestSpy` to be set in the test
 * context.
 */
export default function describeContentType(context) {
  const contentType = { singular: 'content_type', plural: 'content_types' };
  describeNewResource(contentType, undefined, context);

  describeEntity(
    contentType,
    function setupAsset() {
      beforeEach(async function () {
        context.request.respond({ sys: { type: 'ContentType' } });
        context.entity = await context.space.createContentType();
      });
    },
    context
  );

  describe('ContentType', function () {
    beforeEach(function () {
      context.contentType = context.space.newContentType({
        sys: {
          id: 'ctid',
          version: 1,
          type: 'ContentType',
        },
      });
    });

    describe('#canPublish()', function () {
      it('false if contentType deleted', function () {
        delete context.contentType.data;
        expect(context.contentType.canPublish()).toBe(false);
      });

      it('false if contentType has no fields', function () {
        expect(context.contentType.canPublish()).toBe(false);
        context.contentType.data.fields = [];
        expect(context.contentType.canPublish()).toBe(false);
      });

      describe('with fields', function () {
        beforeEach(function () {
          context.contentType.data.fields = [{}];
        });

        it('false if contentType deleted', function () {
          expect(context.contentType.canPublish()).toBe(true);
          delete context.contentType.data;
          expect(context.contentType.canPublish()).toBe(false);
        });

        it('true if no published version', function () {
          context.contentType.setPublishedVersion(null);
          expect(context.contentType.canPublish()).toBe(true);
        });

        it('false if already published version', function () {
          expect(context.contentType.canPublish()).toBe(true);
        });

        it('true if contentType is has a published version not lower than the current version', function () {
          const publishedVersion = 123;
          context.contentType.setVersion(publishedVersion + 1);
          context.contentType.setPublishedVersion(publishedVersion);
          expect(context.contentType.canPublish()).toBe(true);

          context.contentType.setPublishedVersion(publishedVersion + 2);
          expect(context.contentType.canPublish()).toBe(false);
        });
      });
    });

    describe('#publish()', function () {
      it('sends PUT request', async function () {
        context.contentType.setVersion(4);
        context.request.respond(context.contentType.data);
        await context.contentType.publish();
        expect(context.request).toHaveBeenCalledWith({
          method: 'PUT',
          url: '/spaces/42/content_types/ctid/published',
          headers: {
            'X-Contentful-Version': 4,
          },
        });
      });

      it('returns #_registerPublished()', async function () {
        context.request.respond(context.contentType.data);
        const published1 = await context.contentType.publish();
        const published2 = context.contentType._registerPublished();
        expect(published1).toEqual(published2);
      });

      it('unsets deleted flag', async function () {
        const published = context.contentType._registerPublished();
        published.setDeleted();
        expect(published.isDeleted()).toEqual(true);

        context.request.respond(context.contentType.data);
        await context.contentType.publish();
        expect(published.isDeleted()).toEqual(false);
      });
    });

    describe('#unpublish()', function () {
      it('sends DELETE request', async function () {
        context.request.respond(context.contentType.data);
        await context.contentType.unpublish();
        expect(context.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: '/spaces/42/content_types/ctid/published',
        });
      });

      it('returns #deletePublished()', async function () {
        context.request.respond(context.contentType.data);
        const deleted1 = await context.contentType.unpublish();
        const deleted2 = context.contentType.deletePublished();
        expect(deleted1).toEqual(deleted2);
      });
    });

    describe('#getPublishedStatus()', function () {
      const publishedContentTypeData = Object.freeze({
        sys: Object.freeze({
          id: 'cid',
          type: 'ContentType',
          revision: 123,
        }),
      });

      it('sends GET request', async function () {
        context.request.respond(publishedContentTypeData);
        await context.contentType.getPublishedStatus();
        expect(context.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/spaces/42/content_types/ctid/published',
        });
      });

      it('returns published content type', async function () {
        context.request.respond(publishedContentTypeData);
        const contentType = await context.contentType.getPublishedStatus();
        expect(contentType._publishedVersion).toBe(true);
      });

      it('adds published content type to identity map', async function () {
        context.request.respond(publishedContentTypeData);
        const contentType1 = await context.contentType.getPublishedStatus();

        context.request.respond(publishedContentTypeData);
        const contentType2 = await context.contentType.getPublishedStatus();
        expect(contentType1).toEqual(contentType2);
      });
    });

    describe('#_registerPublished()', function () {
      it('creates copy', function () {
        const published = context.contentType._registerPublished();
        expect(published).not.toEqual(context.contentType);
        expect(published.data).not.toEqual(context.contentType.data);
      });

      it('always returns same object', function () {
        const published1 = context.contentType._registerPublished();
        const published2 = context.contentType._registerPublished();
        expect(published1).toEqual(published2);
      });

      it('updates data of previously published content type', function () {
        const published = context.contentType._registerPublished();

        context.contentType.setVersion(4);
        expect(published.getVersion()).not.toEqual(4);

        context.contentType._registerPublished();
        expect(published.getVersion()).toEqual(4);
      });

      it('after deletion returns deleted version', function () {
        const deleted = context.contentType.deletePublished();
        const published = context.contentType._registerPublished();
        expect(deleted).toEqual(published);
      });
    });

    describe('#deletePublished()', function () {
      it('returns published version', function () {
        const published = context.contentType._registerPublished();
        const deleted = context.contentType.deletePublished();
        expect(deleted).toEqual(published);
      });

      it('returns deleted ContentType', function () {
        const deleted = context.contentType.deletePublished();
        expect(deleted.isDeleted()).toBe(true);
        expect(context.contentType.isDeleted()).toBe(false);
      });
    });

    describe('#getName()', function () {
      it('returns "Untitled" when data is missing', function () {
        context.contentType.data = null;
        expect(context.contentType.getName()).toEqual('Untitled');
      });

      it('returns "Untitled" for empty names', function () {
        context.contentType.data.name = null;
        expect(context.contentType.getName()).toEqual('Untitled');
        context.contentType.data.name = undefined;
        expect(context.contentType.getName()).toEqual('Untitled');
        context.contentType.data.name = '';
        expect(context.contentType.getName()).toEqual('Untitled');
        context.contentType.data.name = '  ';
        expect(context.contentType.getName()).toEqual('Untitled');
      });

      it('returns name property', function () {
        context.contentType.data.name = 'A name';
        expect(context.contentType.getName()).toEqual('A name');
      });
    });
  });
}
