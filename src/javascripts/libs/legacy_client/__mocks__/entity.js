export default function describeEntity(names, description, context) {
  describe(`entity ${names.singular}`, function () {
    if (description) {
      description();
    }

    describe('#getSys()', function () {
      it('returns undefined without data', function () {
        delete context.entity.data;
        expect(context.entity.getSys()).toBeUndefined();
      });

      it('returns sys data', function () {
        const sys = {};
        context.entity.data.sys = sys;
        expect(context.entity.getSys()).toEqual(sys);
      });
    });

    describe('#getId()', function () {
      it('returns id', function () {
        context.entity.data.sys.id = 'myid';
        expect(context.entity.getId()).toEqual('myid');
      });

      it('returns undefined without data', function () {
        delete context.entity.data;
        expect(context.entity.getId()).toBeUndefined();
      });
    });

    describe('#getIdentity()', function () {
      it('returns id', function () {
        context.entity.data.sys.id = 'myid';
        context.entity.data.sys.type = 'mytype';
        expect(context.entity.getIdentity()).toEqual('mytype.myid');
      });

      it('returns undefined without data', function () {
        delete context.entity.data;
        expect(context.entity.getIdentity()).toBeUndefined();
      });
    });

    describe('#getType()', function () {
      it('returns type', function () {
        context.entity.data.sys.type = 'mytype';
        expect(context.entity.getType()).toEqual('mytype');
      });

      it('is undefined without data', function () {
        delete context.entity.data;
        expect(context.entity.getType()).toBeUndefined();
      });
    });

    ['Published', 'Updated', 'Created'].forEach(function (Change) {
      const accessor = `get${Change}At`;
      const property = `${Change.toLowerCase()}At`;
      const date = new Date();

      it(`#get${Change}At returns an ISO 8601 string date`, function () {
        context.entity.data.sys[property] = date.getTime();
        expect(context.entity[accessor]()).toEqual(date.toISOString());
      });
    });

    ['Updated', 'Created'].forEach(function (Change) {
      const accessor = `get${Change}By`;
      const property = `${Change.toLowerCase()}By`;

      it(`#get${Change}By returns user object`, function () {
        context.entity.data.sys[property] = { name: 'User' };
        expect(context.entity[accessor]().name).toEqual('User');
      });
    });

    describe('#getVersion()', function () {
      it('is set by #setVersion(v)', function () {
        context.entity.setVersion(444);
        expect(context.entity.getVersion()).toEqual(444);
      });

      it('returns sys version', function () {
        context.entity.data.sys.version = 444;
        expect(context.entity.getVersion()).toEqual(444);
      });

      it('returns deleted version if more recent', function () {
        context.entity.setVersion(2);
        context.entity.deletedAtVersion = 1;
        expect(context.entity.getVersion()).toEqual(1);

        context.entity.deletedAtVersion = 3;
        expect(context.entity.getVersion()).toEqual(3);
      });

      it('without data returns deleted version', function () {
        delete context.entity.data;
        context.entity.deletedAtVersion = 333;
        expect(context.entity.getVersion()).toEqual(333);
      });
    });

    describe('#getPublishedVersion()', function () {
      it('returns id', function () {
        context.entity.data.sys.publishedVersion = 10;
        expect(context.entity.getPublishedVersion()).toEqual(10);
      });

      it('returns undefined without data', function () {
        delete context.entity.data;
        expect(context.entity.getPublishedVersion()).toBeUndefined();
      });

      it('returns undefined without published version', function () {
        expect(context.entity.getPublishedVersion()).toBeUndefined();
      });
    });

    it('#setVersion()', function () {
      context.entity.setVersion(1);
      expect(context.entity.data.sys.version).toEqual(1);
    });

    it('#setPublishedVersion()', function () {
      context.entity.setPublishedVersion(1);
      expect(context.entity.data.sys.publishedVersion).toEqual(1);
    });

    it('#setUpdatedAt()', function () {
      const date = new Date();
      context.entity.setUpdatedAt(date);
      expect(context.entity.data.sys.updatedAt).toEqual(date);
    });

    it('#update()', function () {
      const newData = {
        sys: {},
        fields: ['new', 'data'],
      };
      context.entity.update(newData);
      expect(context.entity.data).toEqual(newData);
    });

    it('#isPublished()', function () {
      context.entity.setPublishedVersion(null);
      expect(context.entity.isPublished()).toBe(false);
      context.entity.setPublishedVersion(1);
      expect(context.entity.isPublished()).toBe(true);
    });

    describe('#hasUnpublishedChanges()', function () {
      it('without published version returns true', function () {
        context.entity.setPublishedVersion(null);
        expect(context.entity.hasUnpublishedChanges()).toBe(true);
      });

      it('returns true with lower published version', function () {
        context.entity.setPublishedVersion(1);
        context.entity.setVersion(3);
        expect(context.entity.hasUnpublishedChanges()).toBe(true);
      });

      it('returns false if recently published', function () {
        context.entity.setPublishedVersion(1);
        context.entity.setVersion(2);
        expect(context.entity.hasUnpublishedChanges()).toBe(false);
      });
    });

    it('#isDeleted()', function () {
      expect(context.entity.isDeleted()).toBe(false);
      delete context.entity.data;
      expect(context.entity.isDeleted()).toBe(true);
    });

    describe('#setDeleted()', function () {
      beforeEach(function () {
        context.entity.data.sys.version = 123;
      });
      it('sets isDeleted()', function () {
        context.entity.setDeleted();
        expect(context.entity.isDeleted()).toBe(true);
      });

      it('throws on delted object', function () {
        context.entity.setDeleted();
        expect(() => context.entity.setDelted()).toThrow();
      });
    });

    describe('#markDeletedAtVersion()', function () {
      it('marks as deleted', function () {
        context.entity.setVersion(3);
        context.entity.markDeletedAtVersion();
        expect(context.entity.deletedAtVersion).toEqual(3);
      });

      it('fails to mark as deleted', function () {
        expect(() => context.entity.markDeletedAtVersion()).toThrow();
      });
    });

    describe('#getPublishedState', function () {
      it('sends GET request', async function () {
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.getPublishedState();
        expect(context.request).toHaveBeenCalledWith({
          method: 'GET',
          url: `/spaces/42/${names.plural}/eid/published`,
        });
      });
    });

    describe('#save', function () {
      it('sends POST request', async function () {
        context.request.respond(context.entity.data);
        await context.entity.save();
        expect(context.request).toHaveBeenCalledWith({
          method: 'POST',
          url: `/spaces/42/${names.plural}`,
          data: context.entity.data,
        });
      });

      it('sends PUT request', async function () {
        const headers = {};
        headers['X-Contentful-Version'] = 1;
        headers.test = 'test';
        context.entity.data.sys.version = 1;
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.save({ test: 'test' });
        expect(context.request).toHaveBeenCalledWith({
          method: 'PUT',
          headers: headers,
          url: `/spaces/42/${names.plural}/eid`,
          data: context.entity.data,
        });
      });
    });

    describe('#delete', function () {
      it('sends DELETE request', async function () {
        context.entity.data.sys.version = 1;
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.delete();
        expect(context.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid`,
        });
        expect(typeof context.entity.data).toBe('object');
        expect(context.entity.deletedAtVersion).toEqual(1);
      });
    });

    describe('#endpoint', function () {
      it('returns paths', function () {
        context.entity.data.sys.id = 'eid';
        expect(context.entity.endpoint()._params.path).toEqual(`/spaces/42/${names.plural}/eid`);
      });

      it('returns an error with no id', function () {
        expect(context.entity.endpoint()._params.error).toBeDefined();
      });
    });

    describe('#publish', function () {
      it('sends PUT request with current version header', async function () {
        context.entity.data.sys.id = 'eid';
        context.entity.data.sys.version = 'VERSION';
        context.request.respond(context.entity.data);
        await context.entity.publish();
        expect(context.request).toHaveBeenCalledWith({
          method: 'PUT',
          headers: {
            'X-Contentful-Version': 'VERSION',
          },
          url: `/spaces/42/${names.plural}/eid/published`,
        });
      });

      it('lets you set the version in the PUT request', async function () {
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.publish(1);
        expect(context.request).toHaveBeenCalledWith({
          method: 'PUT',
          headers: {
            'X-Contentful-Version': 1,
          },
          url: `/spaces/42/${names.plural}/eid/published`,
        });
      });
    });

    it('#canUnpublish', function () {
      context.entity.isPublished = jest.fn();
      context.entity.isPublished.mockReturnValue(true);
      expect(context.entity.canUnpublish()).toBe(true);
      context.entity.isPublished.mockReturnValue(false);
      expect(context.entity.canUnpublish()).toBe(false);
    });

    it('#canDelete', function () {
      context.entity.isPublished = jest.fn();
      context.entity.isDeleted = jest.fn();
      context.entity.isPublished.mockReturnValue(false);
      context.entity.isDeleted.mockReturnValue(false);
      expect(context.entity.canDelete()).toBe(true);
      context.entity.isPublished.mockReturnValue(true);
      context.entity.isDeleted.mockReturnValue(false);
      expect(context.entity.canDelete()).toBe(false);
      context.entity.isPublished.mockReturnValue(false);
      context.entity.isDeleted.mockReturnValue(true);
      expect(context.entity.canDelete()).toBe(false);
      context.entity.isPublished.mockReturnValue(true);
      context.entity.isDeleted.mockReturnValue(true);
      expect(context.entity.canDelete()).toBe(false);
    });
  });
}
