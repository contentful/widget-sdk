const {expect} = require('chai');
const {coit} = require('./support');
const sinon = require('sinon');

module.exports = function describeEntity (names, description) {
  describe(`entity ${names.singular}`, function () {
    if (description) description();

    describe('#getSys()', function () {
      it('returns undefined without data', function () {
        delete this.entity.data;
        expect(this.entity.getSys()).to.be.undefined;
      });

      it('returns sys data', function () {
        var sys = {};
        this.entity.data.sys = sys;
        expect(this.entity.getSys()).to.equal(sys);
      });
    });

    describe('#getId()', function () {
      it('returns id', function () {
        this.entity.data.sys.id = 'myid';
        expect(this.entity.getId()).to.equal('myid');
      });

      it('returns undefined without data', function () {
        delete this.entity.data;
        expect(this.entity.getId()).to.be.undefined;
      });
    });

    describe('#getIdentity()', function () {
      it('returns id', function () {
        this.entity.data.sys.id = 'myid';
        this.entity.data.sys.type = 'mytype';
        expect(this.entity.getIdentity()).to.equal('mytype.myid');
      });

      it('returns undefined without data', function () {
        delete this.entity.data;
        expect(this.entity.getIdentity()).to.be.undefined;
      });
    });

    describe('#getType()', function () {
      it('returns type', function () {
        this.entity.data.sys.type = 'mytype';
        expect(this.entity.getType()).to.equal('mytype');
      });

      it('is undefined without data', function () {
        delete this.entity.data;
        expect(this.entity.getType()).to.be.undefined;
      });
    });

    ['Published', 'Updated', 'Created'].forEach(function (Change) {
      var accessor = `get${Change}At`;
      var property = `${Change.toLowerCase()}At`;
      var date = new Date();

      it(`#get${Change}At returns an ISO 8601 string date`, function () {
        this.entity.data.sys[property] = date.getTime();
        expect(this.entity[accessor]()).to.equal(date.toISOString());
      });
    });

    ['Updated', 'Created'].forEach(function (Change) {
      var accessor = `get${Change}By`;
      var property = `${Change.toLowerCase()}By`;

      it(`#get${Change}By returns user object`, function () {
        this.entity.data.sys[property] = {name: 'User'};
        expect(this.entity[accessor]().name).to.equal('User');
      });
    });

    describe('#getVersion()', function () {
      it('is set by #setVersion(v)', function () {
        this.entity.setVersion(444);
        expect(this.entity.getVersion()).to.equal(444);
      });

      it('returns sys version', function () {
        this.entity.data.sys.version = 444;
        expect(this.entity.getVersion()).to.equal(444);
      });

      it('returns deleted version if more recent', function () {
        this.entity.setVersion(2);
        this.entity.deletedAtVersion = 1;
        expect(this.entity.getVersion()).to.equal(1);

        this.entity.deletedAtVersion = 3;
        expect(this.entity.getVersion()).to.equal(3);
      });

      it('without data returns deleted version', function () {
        delete this.entity.data;
        this.entity.deletedAtVersion = 333;
        expect(this.entity.getVersion()).to.equal(333);
      });
    });

    describe('#getPublishedVersion()', function () {
      it('returns id', function () {
        this.entity.data.sys.publishedVersion = 10;
        expect(this.entity.getPublishedVersion()).to.equal(10);
      });

      it('returns undefined without data', function () {
        delete this.entity.data;
        expect(this.entity.getPublishedVersion()).to.be.undefined;
      });

      it('returns undefined without published version', function () {
        expect(this.entity.getPublishedVersion()).to.be.undefined;
      });
    });

    it('#setVersion()', function () {
      this.entity.setVersion(1);
      expect(this.entity.data.sys.version).to.equal(1);
    });

    it('#setPublishedVersion()', function () {
      this.entity.setPublishedVersion(1);
      expect(this.entity.data.sys.publishedVersion).to.equal(1);
    });

    it('#setUpdatedAt()', function () {
      var date = new Date();
      this.entity.setUpdatedAt(date);
      expect(this.entity.data.sys.updatedAt).to.equal(date);
    });

    it('#update()', function () {
      var newData = {
        sys: {},
        fields: ['new', 'data']
      };
      this.entity.update(newData);
      expect(this.entity.data).to.equal(newData);
    });

    it('#isPublished()', function () {
      this.entity.setPublishedVersion(null);
      expect(this.entity.isPublished()).to.be.false;
      this.entity.setPublishedVersion(1);
      expect(this.entity.isPublished()).to.be.true;
    });

    describe('#hasUnpublishedChanges()', function () {
      it('without published version returns true', function () {
        this.entity.setPublishedVersion(null);
        expect(this.entity.hasUnpublishedChanges()).to.be.true;
      });

      it('returns true with lower published version', function () {
        this.entity.setPublishedVersion(1);
        this.entity.setVersion(3);
        expect(this.entity.hasUnpublishedChanges()).to.be.true;
      });

      it('returns false if recently published', function () {
        this.entity.setPublishedVersion(1);
        this.entity.setVersion(2);
        expect(this.entity.hasUnpublishedChanges()).to.be.false;
      });
    });

    it('#isDeleted()', function () {
      expect(this.entity.isDeleted()).to.be.false;
      delete this.entity.data;
      expect(this.entity.isDeleted()).to.be.true;
    });

    describe('#setDeleted()', function () {
      beforeEach(function () { this.entity.data.sys.version = 123; });
      it('sets isDeleted()', function () {
        this.entity.setDeleted();
        expect(this.entity.isDeleted()).to.be.true;
      });

      it('throws on delted object', function () {
        this.entity.setDeleted();
        expect(() => this.entity.setDelted()).to.throw();
      });
    });

    describe('#markDeletedAtVersion()', function () {
      it('marks as deleted', function () {
        this.entity.setVersion(3);
        this.entity.markDeletedAtVersion();
        expect(this.entity.deletedAtVersion).to.equal(3);
      });

      it('fails to mark as deleted', function () {
        expect(() => this.entity.markDeletedAtVersion()).to.throw();
      });
    });

    describe('#serialize()', function () {
      it('returns serialized data', function () {
        expect(this.entity.serialize()).to.equal(this.entity.data);
      });
    });

    describe('#getPublishedState', function () {
      coit('sends GET request', function* () {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.getPublishedState();
        expect(this.request).to.be.calledWith({
          method: 'GET',
          url: `/spaces/42/${names.plural}/eid/published`
        });
      });
    });

    describe('#save', function () {
      coit('sends POST request', function* () {
        this.request.respond(this.entity.data);
        yield this.entity.save();
        expect(this.request).to.be.calledWith({
          method: 'POST',
          url: `/spaces/42/${names.plural}`,
          data: this.entity.data
        });
      });

      coit('sends PUT request', function* () {
        const headers = {};
        headers['X-Contentful-Version'] = 1;
        headers.test = 'test';
        this.entity.data.sys.version = 1;
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.save({test: 'test'});
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          headers: headers,
          url: `/spaces/42/${names.plural}/eid`,
          data: this.entity.data
        });
      });
    });

    describe('#delete', function () {
      coit('sends DELETE request', function* () {
        this.entity.data.sys.version = 1;
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.delete();
        expect(this.request).to.be.calledWith({
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid`
        });
        expect(this.entity.data).to.be.ok;
        expect(this.entity.deletedAtVersion).to.equal(1);
      });
    });

    describe('#endpoint', function () {
      it('returns paths', function () {
        this.entity.data.sys.id = 'eid';
        expect(this.entity.endpoint()._params.path).to.equal(`/spaces/42/${names.plural}/eid`);
      });

      it('returns an error with no id', function () {
        expect(this.entity.endpoint()._params.error).to.exist;
      });
    });

    describe('#publish', function () {
      coit('sends PUT request with current version header', function* () {
        this.entity.data.sys.id = 'eid';
        this.entity.data.sys.version = 'VERSION';
        this.request.respond(this.entity.data);
        yield this.entity.publish();
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          headers: {'X-Contentful-Version': 'VERSION'},
          url: `/spaces/42/${names.plural}/eid/published`
        });
      });

      coit('lets you set the version in the PUT request', function* () {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.publish(1);
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          headers: {'X-Contentful-Version': 1},
          url: `/spaces/42/${names.plural}/eid/published`
        });
      });
    });

    it('#canUnpublish', function () {
      this.entity.isPublished = sinon.stub();
      this.entity.isPublished.returns(true);
      expect(this.entity.canUnpublish()).to.be.true;
      this.entity.isPublished.returns(false);
      expect(this.entity.canUnpublish()).to.be.false;
    });

    it('#canDelete', function () {
      this.entity.isPublished = sinon.stub();
      this.entity.isDeleted = sinon.stub();
      this.entity.isPublished.returns(false);
      this.entity.isDeleted.returns(false);
      expect(this.entity.canDelete()).to.be.true;
      this.entity.isPublished.returns(true);
      this.entity.isDeleted.returns(false);
      expect(this.entity.canDelete()).to.be.false;
      this.entity.isPublished.returns(false);
      this.entity.isDeleted.returns(true);
      expect(this.entity.canDelete()).to.be.false;
      this.entity.isPublished.returns(true);
      this.entity.isDeleted.returns(true);
      expect(this.entity.canDelete()).to.be.false;
    });
  });
};
