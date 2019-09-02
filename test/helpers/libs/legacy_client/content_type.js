import sinon from 'sinon';
import describeEntity from './entity';
import {
  describeCreateResource,
  describeNewResource,
  describeVersionedResource
} from './space_resource';

/**
 * Adds ContentType specs if called.
 *
 * Requires `this.space` and `this.requestSpy` to be set in the test
 * context.
 */
export default function describeContentType() {
  const contentType = { singular: 'content_type', plural: 'content_types' };
  describeCreateResource(contentType);
  describeNewResource(contentType);
  describeVersionedResource(contentType);

  describeEntity(contentType, function setupAsset() {
    beforeEach(async function() {
      this.request.respond({ sys: { type: 'ContentType' } });
      this.entity = await this.space.createContentType();
    });
  });

  describe('ContentType', function() {
    beforeEach(function() {
      this.contentType = this.space.newContentType({
        sys: {
          id: 'ctid',
          version: 1,
          type: 'ContentType'
        }
      });
    });

    describe('#canPublish()', function() {
      it('false if contentType deleted', function() {
        delete this.contentType.data;
        expect(this.contentType.canPublish()).toBe(false);
      });

      it('false if contentType has no fields', function() {
        expect(this.contentType.canPublish()).toBe(false);
        this.contentType.data.fields = [];
        expect(this.contentType.canPublish()).toBe(false);
      });

      describe('with fields', function() {
        beforeEach(function() {
          this.contentType.data.fields = [{}];
        });

        it('false if contentType deleted', function() {
          expect(this.contentType.canPublish()).toBe(true);
          delete this.contentType.data;
          expect(this.contentType.canPublish()).toBe(false);
        });

        it('true if no published version', function() {
          this.contentType.setPublishedVersion(null);
          expect(this.contentType.canPublish()).toBe(true);
        });

        it('false if already published version', function() {
          expect(this.contentType.canPublish()).toBe(true);
        });

        it('true if contentType is has a published version not lower than the current version', function() {
          const publishedVersion = 123;
          this.contentType.setVersion(publishedVersion + 1);
          this.contentType.setPublishedVersion(publishedVersion);
          expect(this.contentType.canPublish()).toBe(true);

          this.contentType.setPublishedVersion(publishedVersion + 2);
          expect(this.contentType.canPublish()).toBe(false);
        });
      });
    });

    describe('#publish()', function() {
      it('sends PUT request', async function() {
        this.contentType.setVersion(4);
        this.request.respond(this.contentType.data);
        await this.contentType.publish();
        sinon.assert.calledWith(this.request, {
          method: 'PUT',
          url: '/spaces/42/content_types/ctid/published',
          headers: {
            'X-Contentful-Version': 4
          }
        });
      });

      it('returns #_registerPublished()', async function() {
        this.request.respond(this.contentType.data);
        const published1 = await this.contentType.publish();
        const published2 = this.contentType._registerPublished();
        expect(published1).toEqual(published2);
      });

      it('unsets deleted flag', async function() {
        const published = this.contentType._registerPublished();
        published.setDeleted();
        expect(published.isDeleted()).toEqual(true);

        this.request.respond(this.contentType.data);
        await this.contentType.publish();
        expect(published.isDeleted()).toEqual(false);
      });
    });

    describe('#unpublish()', function() {
      it('sends DELETE request', async function() {
        this.request.respond(this.contentType.data);
        await this.contentType.unpublish();
        sinon.assert.calledWith(this.request, {
          method: 'DELETE',
          url: '/spaces/42/content_types/ctid/published'
        });
      });

      it('returns #deletePublished()', async function() {
        this.request.respond(this.contentType.data);
        const deleted1 = await this.contentType.unpublish();
        const deleted2 = this.contentType.deletePublished();
        expect(deleted1).toEqual(deleted2);
      });
    });

    describe('#getPublishedStatus()', function() {
      const publishedContentTypeData = Object.freeze({
        sys: Object.freeze({
          id: 'cid',
          type: 'ContentType',
          revision: 123
        })
      });

      it('sends GET request', async function() {
        this.request.respond(publishedContentTypeData);
        await this.contentType.getPublishedStatus();
        sinon.assert.calledWith(this.request, {
          method: 'GET',
          url: '/spaces/42/content_types/ctid/published'
        });
      });

      it('returns published content type', async function() {
        this.request.respond(publishedContentTypeData);
        const contentType = await this.contentType.getPublishedStatus();
        expect(contentType._publishedVersion).toBe(true);
      });

      it('adds published content type to identity map', async function() {
        this.request.respond(publishedContentTypeData);
        const contentType1 = await this.contentType.getPublishedStatus();

        this.request.respond(publishedContentTypeData);
        const contentType2 = await this.contentType.getPublishedStatus();
        expect(contentType1).toEqual(contentType2);
      });
    });

    describe('#_registerPublished()', function() {
      it('creates copy', function() {
        const published = this.contentType._registerPublished();
        expect(published).not.toEqual(this.contentType);
        expect(published.data).not.toEqual(this.contentType.data);
      });

      it('always returns same object', function() {
        const published1 = this.contentType._registerPublished();
        const published2 = this.contentType._registerPublished();
        expect(published1).toEqual(published2);
      });

      it('updates data of previously published content type', function() {
        const published = this.contentType._registerPublished();

        this.contentType.setVersion(4);
        expect(published.getVersion()).not.toEqual(4);

        this.contentType._registerPublished();
        expect(published.getVersion()).toEqual(4);
      });

      it('after deletion returns deleted version', function() {
        const deleted = this.contentType.deletePublished();
        const published = this.contentType._registerPublished();
        expect(deleted).toEqual(published);
      });
    });

    describe('#deletePublished()', function() {
      it('returns published version', function() {
        const published = this.contentType._registerPublished();
        const deleted = this.contentType.deletePublished();
        expect(deleted).toEqual(published);
      });

      it('returns deleted ContentType', function() {
        const deleted = this.contentType.deletePublished();
        expect(deleted.isDeleted()).toBe(true);
        expect(this.contentType.isDeleted()).toBe(false);
      });
    });

    describe('#getName()', function() {
      it('returns "Untitled" when data is missing', function() {
        this.contentType.data = null;
        expect(this.contentType.getName()).toEqual('Untitled');
      });

      it('returns "Untitled" for empty names', function() {
        this.contentType.data.name = null;
        expect(this.contentType.getName()).toEqual('Untitled');
        this.contentType.data.name = undefined;
        expect(this.contentType.getName()).toEqual('Untitled');
        this.contentType.data.name = '';
        expect(this.contentType.getName()).toEqual('Untitled');
        this.contentType.data.name = '  ';
        expect(this.contentType.getName()).toEqual('Untitled');
      });

      it('returns name property', function() {
        this.contentType.data.name = 'A name';
        expect(this.contentType.getName()).toEqual('A name');
      });
    });
  });

  describe('.getPublishedContentTypes()', function() {
    const contentTypeData = Object.freeze({
      sys: Object.freeze({
        id: 'cid',
        type: 'ContentType'
      })
    });
    const contentTypeList = Object.freeze({
      sys: { type: 'Array' },
      total: 123,
      items: [contentTypeData]
    });

    it('sends GET request', async function() {
      this.request.respond(contentTypeList);
      await this.space.getPublishedContentTypes();
      sinon.assert.calledWith(this.request, {
        method: 'GET',
        url: '/spaces/42/public/content_types'
      });
    });

    it('retrieves object from identity map', async function() {
      this.request.respond(contentTypeData);
      const contentType1 = await this.space.getContentType('cid');

      this.request.respond(contentTypeList);
      const [contentType2] = await this.space.getPublishedContentTypes();
      expect(contentType1).toEqual(contentType2);
    });
  });
}
