export default function describeArchivable (names, description) {
  describe(`archivable ${names.singular}`, function () {
    if (description) description();

    describe('#archive', function () {
      it('sends PUT request', function* () {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.archive();
        sinon.assert.calledWith(this.request, {
          method: 'PUT',
          url: `/spaces/42/${names.plural}/eid/archived`
        });
      });
    });

    describe('#unarchive', function () {
      it('sends DELETE request', function* () {
        this.entity.data.sys.id = 'eid';
        this.request.respond(this.entity.data);
        yield this.entity.unarchive();
        sinon.assert.calledWith(this.request, {
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid/archived`
        });
      });
    });

    it('#isArchived()', function () {
      expect(this.entity.isArchived()).toBe(false);
      this.entity.data.sys.archivedVersion = 1;
      expect(this.entity.isArchived()).toBe(true);
    });

    it('#canArchive', function () {
      this.entity.isArchived = sinon.stub();
      this.entity.isPublished = sinon.stub();
      this.entity.isArchived.returns(false);
      this.entity.isPublished.returns(false);
      expect(this.entity.canArchive()).toBe(true);
      this.entity.isArchived.returns(true);
      this.entity.isPublished.returns(false);
      expect(this.entity.canArchive()).toBe(false);
      this.entity.isArchived.returns(false);
      this.entity.isPublished.returns(true);
      expect(this.entity.canArchive()).toBe(false);
      this.entity.isArchived.returns(true);
      this.entity.isPublished.returns(true);
      expect(this.entity.canArchive()).toBe(false);
    });

    it('#canUnarchive', function () {
      this.entity.isArchived = sinon.stub();
      this.entity.isArchived.returns(true);
      expect(this.entity.canUnarchive()).toBe(true);
      this.entity.isArchived.returns(false);
      expect(this.entity.canUnarchive()).toBe(false);
    });
  });
}
