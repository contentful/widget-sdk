export default function describeEntity(names, description) {
  describe(`entity ${names.singular}`, function() {
    if (description) description();

    describe('#getSys()', function() {
      it('returns undefined without data', function() {
        delete this.entity.data;
        expect(this.entity.getSys()).toBeUndefined();
      });

      it('returns sys data', function() {
        const sys = {};
        this.entity.data.sys = sys;
        expect(this.entity.getSys()).toEqual(sys);
      });
    });

    describe('#getId()', function() {
      it('returns id', function() {
        this.entity.data.sys.id = 'myid';
        expect(this.entity.getId()).toEqual('myid');
      });

      it('returns undefined without data', function() {
        delete this.entity.data;
        expect(this.entity.getId()).toBeUndefined();
      });
    });

    describe('#getIdentity()', function() {
      it('returns id', function() {
        this.entity.data.sys.id = 'myid';
        this.entity.data.sys.type = 'mytype';
        expect(this.entity.getIdentity()).toEqual('mytype.myid');
      });

      it('returns undefined without data', function() {
        delete this.entity.data;
        expect(this.entity.getIdentity()).toBeUndefined();
      });
    });

    describe('#getType()', function() {
      it('returns type', function() {
        this.entity.data.sys.type = 'mytype';
        expect(this.entity.getType()).toEqual('mytype');
      });

      it('is undefined without data', function() {
        delete this.entity.data;
        expect(this.entity.getType()).toBeUndefined();
      });
    });

    ['Published', 'Updated', 'Created'].forEach(function(Change) {
      const accessor = `get${Change}At`;
      const property = `${Change.toLowerCase()}At`;
      const date = new Date();

      it(`#get${Change}At returns an ISO 8601 string date`, function() {
        this.entity.data.sys[property] = date.getTime();
        expect(this.entity[accessor]()).toEqual(date.toISOString());
      });
    });

    ['Updated', 'Created'].forEach(function(Change) {
      const accessor = `get${Change}By`;
      const property = `${Change.toLowerCase()}By`;

      it(`#get${Change}By returns user object`, function() {
        this.entity.data.sys[property] = { name: 'User' };
        expect(this.entity[accessor]().name).toEqual('User');
      });
    });

    describe('#getVersion()', function() {
      it('is set by #setVersion(v)', function() {
        this.entity.setVersion(444);
        expect(this.entity.getVersion()).toEqual(444);
      });

      it('returns sys version', function() {
        this.entity.data.sys.version = 444;
        expect(this.entity.getVersion()).toEqual(444);
      });

      it('returns deleted version if more recent', function() {
        this.entity.setVersion(2);
        this.entity.deletedAtVersion = 1;
        expect(this.entity.getVersion()).toEqual(1);

        this.entity.deletedAtVersion = 3;
        expect(this.entity.getVersion()).toEqual(3);
      });

      it('without data returns deleted version', function() {
        delete this.entity.data;
        this.entity.deletedAtVersion = 333;
        expect(this.entity.getVersion()).toEqual(333);
      });
    });

    describe('#getPublishedVersion()', function() {
      it('returns id', function() {
        this.entity.data.sys.publishedVersion = 10;
        expect(this.entity.getPublishedVersion()).toEqual(10);
      });

      it('returns undefined without data', function() {
        delete this.entity.data;
        expect(this.entity.getPublishedVersion()).toBeUndefined();
      });

      it('returns undefined without published version', function() {
        expect(this.entity.getPublishedVersion()).toBeUndefined();
      });
    });

    it('#setVersion()', function() {
      this.entity.setVersion(1);
      expect(this.entity.data.sys.version).toEqual(1);
    });

    it('#setPublishedVersion()', function() {
      this.entity.setPublishedVersion(1);
      expect(this.entity.data.sys.publishedVersion).toEqual(1);
    });

    it('#setUpdatedAt()', function() {
      const date = new Date();
      this.entity.setUpdatedAt(date);
      expect(this.entity.data.sys.updatedAt).toEqual(date);
    });

    it('#update()', function() {
      const newData = {
        sys: {},
        fields: ['new', 'data']
      };
      this.entity.update(newData);
      expect(this.entity.data).toEqual(newData);
    });

    it('#isPublished()', function() {
      this.entity.setPublishedVersion(null);
      expect(this.entity.isPublished()).toBe(false);
      this.entity.setPublishedVersion(1);
      expect(this.entity.isPublished()).toBe(true);
    });

    describe('#hasUnpublishedChanges()', function() {
      it('without published version returns true', function() {
        this.entity.setPublishedVersion(null);
        expect(this.entity.hasUnpublishedChanges()).toBe(true);
      });

      it('returns true with lower published version', function() {
        this.entity.setPublishedVersion(1);
        this.entity.setVersion(3);
        expect(this.entity.hasUnpublishedChanges()).toBe(true);
      });

      it('returns false if recently published', function() {
        this.entity.setPublishedVersion(1);
        this.entity.setVersion(2);
        expect(this.entity.hasUnpublishedChanges()).toBe(false);
      });
    });

    it('#isDeleted()', function() {
      expect(this.entity.isDeleted()).toBe(false);
      delete this.entity.data;
      expect(this.entity.isDeleted()).toBe(true);
    });

    describe('#setDeleted()', function() {
      beforeEach(function() {
        this.entity.data.sys.version = 123;
      });
      it('sets isDeleted()', function() {
        this.entity.setDeleted();
        expect(this.entity.isDeleted()).toBe(true);
      });

      it('throws on delted object', function() {
        this.entity.setDeleted();
        expect(() => this.entity.setDelted()).toThrow();
      });
    });

    describe('#markDeletedAtVersion()', function() {
      it('marks as deleted', function() {
        this.entity.setVersion(3);
        this.entity.markDeletedAtVersion();
        expect(this.entity.deletedAtVersion).toEqual(3);
      });

      it('fails to mark as deleted', function() {
        expect(() => this.entity.markDeletedAtVersion()).toThrow();
      });
    });

    describe('#getPublishedState', function() {
      it('sends GET request', function*() {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.getPublishedState();
        sinon.assert.calledWith(this.request, {
          method: 'GET',
          url: `/spaces/42/${names.plural}/eid/published`
        });
      });
    });

    describe('#save', function() {
      it('sends POST request', function*() {
        this.request.respond(this.entity.data);
        yield this.entity.save();
        sinon.assert.calledWith(this.request, {
          method: 'POST',
          url: `/spaces/42/${names.plural}`,
          data: this.entity.data
        });
      });

      it('sends PUT request', function*() {
        const headers = {};
        headers['X-Contentful-Version'] = 1;
        headers.test = 'test';
        this.entity.data.sys.version = 1;
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.save({ test: 'test' });
        sinon.assert.calledWith(this.request, {
          method: 'PUT',
          headers: headers,
          url: `/spaces/42/${names.plural}/eid`,
          data: this.entity.data
        });
      });
    });

    describe('#delete', function() {
      it('sends DELETE request', function*() {
        this.entity.data.sys.version = 1;
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.delete();
        sinon.assert.calledWith(this.request, {
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid`
        });
        expect(typeof this.entity.data).toBe('object');
        expect(this.entity.deletedAtVersion).toEqual(1);
      });
    });

    describe('#endpoint', function() {
      it('returns paths', function() {
        this.entity.data.sys.id = 'eid';
        expect(this.entity.endpoint()._params.path).toEqual(`/spaces/42/${names.plural}/eid`);
      });

      it('returns an error with no id', function() {
        expect(this.entity.endpoint()._params.error).toBeDefined();
      });
    });

    describe('#publish', function() {
      const maybeContentTypeAlphaHeaders = resource =>
        resource === 'content_types'
          ? { 'X-Contentful-Enable-Alpha-Feature': 'structured_text_fields' }
          : {};

      it('sends PUT request with current version header', function*() {
        this.entity.data.sys.id = 'eid';
        this.entity.data.sys.version = 'VERSION';
        this.request.respond(this.entity.data);
        yield this.entity.publish();
        sinon.assert.calledWith(this.request, {
          method: 'PUT',
          headers: {
            'X-Contentful-Version': 'VERSION',
            ...maybeContentTypeAlphaHeaders(names.plural)
          },
          url: `/spaces/42/${names.plural}/eid/published`
        });
      });

      it('lets you set the version in the PUT request', function*() {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.publish(1);
        sinon.assert.calledWith(this.request, {
          method: 'PUT',
          headers: {
            'X-Contentful-Version': 1,
            ...maybeContentTypeAlphaHeaders(names.plural)
          },
          url: `/spaces/42/${names.plural}/eid/published`
        });
      });
    });

    it('#canUnpublish', function() {
      this.entity.isPublished = sinon.stub();
      this.entity.isPublished.returns(true);
      expect(this.entity.canUnpublish()).toBe(true);
      this.entity.isPublished.returns(false);
      expect(this.entity.canUnpublish()).toBe(false);
    });

    it('#canDelete', function() {
      this.entity.isPublished = sinon.stub();
      this.entity.isDeleted = sinon.stub();
      this.entity.isPublished.returns(false);
      this.entity.isDeleted.returns(false);
      expect(this.entity.canDelete()).toBe(true);
      this.entity.isPublished.returns(true);
      this.entity.isDeleted.returns(false);
      expect(this.entity.canDelete()).toBe(false);
      this.entity.isPublished.returns(false);
      this.entity.isDeleted.returns(true);
      expect(this.entity.canDelete()).toBe(false);
      this.entity.isPublished.returns(true);
      this.entity.isDeleted.returns(true);
      expect(this.entity.canDelete()).toBe(false);
    });
  });
}
