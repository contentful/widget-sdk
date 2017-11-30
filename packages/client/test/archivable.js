/* jshint expr: true */
const {expect} = require('chai');
const {coit} = require('./support');
const sinon = require('sinon');

module.exports = function describeArchivable (names, description) {
  describe(`archivable ${names.singular}`, function () {
    if (description) description();

    describe('#archive', function () {
      coit('sends PUT request', function* () {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.archive();
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          url: `/spaces/42/${names.plural}/eid/archived`
        });
      });
    });

    describe('#unarchive', function () {
      coit('sends DELETE request', function* () {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.unarchive();
        expect(this.request).to.be.calledWith({
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid/archived`
        });
      });
    });

    it('#isArchived()', function () {
      expect(this.entity.isArchived()).to.be.false;
      this.entity.data.sys.archivedVersion = 1;
      expect(this.entity.isArchived()).to.be.true;
    });

    it('#canArchive', function () {
      this.entity.isArchived = sinon.stub();
      this.entity.isPublished = sinon.stub();
      this.entity.isArchived.returns(false);
      this.entity.isPublished.returns(false);
      expect(this.entity.canArchive()).to.be.true;
      this.entity.isArchived.returns(true);
      this.entity.isPublished.returns(false);
      expect(this.entity.canArchive()).to.be.false;
      this.entity.isArchived.returns(false);
      this.entity.isPublished.returns(true);
      expect(this.entity.canArchive()).to.be.false;
      this.entity.isArchived.returns(true);
      this.entity.isPublished.returns(true);
      expect(this.entity.canArchive()).to.be.false;
    });

    it('#canUnarchive', function () {
      this.entity.isArchived = sinon.stub();
      this.entity.isArchived.returns(true);
      expect(this.entity.canUnarchive()).to.be.true;
      this.entity.isArchived.returns(false);
      expect(this.entity.canUnarchive()).to.be.false;
    });
  });
};
