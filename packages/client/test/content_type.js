const co = require('co');
const {coit, expect} = require('./support');
const ContentType = require('../lib/content_type');
const describeEntity = require('./entity');
const {
  describeCreateResource,
  describeNewResource,
  describeVersionedResource
} = require('./space_resource');

/**
 * Adds ContentType specs if called.
 *
 * Requires `this.space` and `this.requestSpy` to be set in the test
 * context.
 */
module.exports = function describeContentType () {
  const contentType = { singular: 'content_type', plural: 'content_types' };
  describeCreateResource(contentType);
  describeNewResource(contentType);
  describeVersionedResource(contentType);

  describeEntity(contentType, function setupAsset () {
    beforeEach(co.wrap(function* () {
      this.request.respond({sys: {type: 'ContentType'}});
      this.entity = yield this.space.createContentType();
    }));
  });

  describe('ContentType', function () {
    beforeEach(function () {
      this.contentType = this.space.newContentType({
        sys: {
          id: 'ctid',
          version: 1,
          type: 'ContentType'
        }});
    });

    describe('#canPublish()', function () {
      it('false if contentType deleted', function () {
        delete this.contentType.data;
        expect(this.contentType.canPublish()).to.be.false;
      });

      it('false if contentType has no fields', function () {
        expect(this.contentType.canPublish()).to.be.false;
        this.contentType.data.fields = [];
        expect(this.contentType.canPublish()).to.be.false;
      });

      describe('with fields', function () {
        beforeEach(function () {
          this.contentType.data.fields = [{}];
        });

        it('false if contentType deleted', function () {
          expect(this.contentType.canPublish()).to.be.true;
          delete this.contentType.data;
          expect(this.contentType.canPublish()).to.be.false;
        });

        it('true if no published version', function () {
          this.contentType.setPublishedVersion(null);
          expect(this.contentType.canPublish()).to.be.true;
        });

        it('false if already published version', function () {
          expect(this.contentType.canPublish()).to.be.true;
        });

        it('true if contentType is has a published version not lower than the current version', function () {
          var publishedVersion = 123;
          this.contentType.setVersion(publishedVersion + 1);
          this.contentType.setPublishedVersion(publishedVersion);
          expect(this.contentType.canPublish()).to.be.true;

          this.contentType.setPublishedVersion(publishedVersion + 2);
          expect(this.contentType.canPublish()).to.be.false;
        });
      });
    });

    describe('#publish()', function () {
      coit('sends PUT request', function* () {
        this.contentType.setVersion(4);
        this.request.respond(this.contentType.data);
        yield this.contentType.publish();
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          url: '/spaces/42/content_types/ctid/published',
          headers: { 'X-Contentful-Version': 4 }
        });
      });

      coit('returns #_registerPublished()', function* () {
        this.request.respond(this.contentType.data);
        var published1 = yield this.contentType.publish();
        var published2 = this.contentType._registerPublished();
        expect(published1).to.equal(published2);
      });

      coit('unsets deleted flag', function* () {
        var published = this.contentType._registerPublished();
        published.setDeleted();
        expect(published.isDeleted()).to.equal(true);

        this.request.respond(this.contentType.data);
        yield this.contentType.publish();
        expect(published.isDeleted()).to.equal(false);
      });
    });

    describe('#unpublish()', function () {
      coit('sends DELETE request', function* () {
        this.request.respond(this.contentType.data);
        yield this.contentType.unpublish();
        expect(this.request).to.be.calledWith({
          method: 'DELETE',
          url: '/spaces/42/content_types/ctid/published'
        });
      });

      coit('returns #deletePublished()', function* () {
        this.request.respond(this.contentType.data);
        var deleted1 = yield this.contentType.unpublish();
        var deleted2 = this.contentType.deletePublished();
        expect(deleted1).to.equal(deleted2);
      });
    });

    describe('#getPublishedStatus()', function () {
      const publishedContentTypeData = Object.freeze({
        sys: Object.freeze({
          id: 'cid',
          type: 'ContentType',
          revision: 123
        })
      });

      coit('sends GET request', function* () {
        this.request.respond(publishedContentTypeData);
        yield this.contentType.getPublishedStatus();
        expect(this.request).to.be.calledWith({
          method: 'GET',
          url: '/spaces/42/content_types/ctid/published'
        });
      });

      coit('returns published content type', function* () {
        this.request.respond(publishedContentTypeData);
        let contentType = yield this.contentType.getPublishedStatus();
        expect(contentType).to.be.instanceOf(ContentType);
        expect(contentType._publishedVersion).to.be.true;
      });

      coit('adds published content type to identity map', function* () {
        this.request.respond(publishedContentTypeData);
        var contentType1 = yield this.contentType.getPublishedStatus();

        this.request.respond(publishedContentTypeData);
        var contentType2 = yield this.contentType.getPublishedStatus();
        expect(contentType1).to.equal(contentType2);
      });
    });

    describe('#_registerPublished()', function () {
      it('creates copy', function () {
        var published = this.contentType._registerPublished();
        expect(published).to.not.equal(this.contentType);
        expect(published.data).to.not.equal(this.contentType.data);
      });

      it('always returns same object', function () {
        var published1 = this.contentType._registerPublished();
        var published2 = this.contentType._registerPublished();
        expect(published1).to.equal(published2);
      });

      it('updates data of previously published content type', function () {
        var published = this.contentType._registerPublished();

        this.contentType.setVersion(4);
        expect(published.getVersion()).to.not.equal(4);

        this.contentType._registerPublished();
        expect(published.getVersion()).to.equal(4);
      });

      it('after deletion returns deleted version', function () {
        var deleted = this.contentType.deletePublished();
        var published = this.contentType._registerPublished();
        expect(deleted).to.equal(published);
      });
    });

    describe('#deletePublished()', function () {
      it('returns published version', function () {
        var published = this.contentType._registerPublished();
        var deleted = this.contentType.deletePublished();
        expect(deleted).to.equal(published);
      });

      it('returns deleted ContentType', function () {
        var deleted = this.contentType.deletePublished();
        expect(deleted.isDeleted()).to.be.true;
        expect(this.contentType.isDeleted()).to.be.false;
      });
    });


    describe('#getName()', function () {
      it('returns "Untitled" when data is missing', function () {
        this.contentType.data = null;
        expect(this.contentType.getName()).to.equal('Untitled');
      });

      it('returns "Untitled" for empty names', function () {
        this.contentType.data.name = null;
        expect(this.contentType.getName()).to.equal('Untitled');
        this.contentType.data.name = undefined;
        expect(this.contentType.getName()).to.equal('Untitled');
        this.contentType.data.name = '';
        expect(this.contentType.getName()).to.equal('Untitled');
        this.contentType.data.name = '  ';
        expect(this.contentType.getName()).to.equal('Untitled');
      });

      it('returns name property', function () {
        this.contentType.data.name = 'A name';
        expect(this.contentType.getName()).to.equal('A name');
      });
    });
  });

  describe('.getPublishedContentTypes()', function () {
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

    coit('sends GET request', function* () {
      this.request.respond(contentTypeList);
      yield this.space.getPublishedContentTypes();
      expect(this.request).to.be.calledWith({
        method: 'GET',
        url: '/spaces/42/public/content_types'
      });
    });

    coit('retrieves object from identity map', function* () {
      this.request.respond(contentTypeData);
      var contentType1 = yield this.space.getContentType('cid');

      this.request.respond(contentTypeList);
      var [contentType2] = yield this.space.getPublishedContentTypes();
      expect(contentType1).to.equal(contentType2);
    });
  });
};
