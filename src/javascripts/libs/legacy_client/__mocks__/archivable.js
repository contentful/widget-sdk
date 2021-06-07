export default function describeArchivable(names, description, context) {
  describe(`archivable ${names.singular}`, function () {
    if (description) {
      description();
    }

    describe('#archive', function () {
      it('sends PUT request', async function () {
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.archive();
        expect(context.request).toHaveBeenCalledWith({
          method: 'PUT',
          url: `/spaces/42/${names.plural}/eid/archived`,
        });
      });
    });

    describe('#unarchive', function () {
      it('sends DELETE request', async function () {
        context.entity.data.sys.id = 'eid';
        context.request.respond(context.entity.data);
        await context.entity.unarchive();
        expect(context.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: `/spaces/42/${names.plural}/eid/archived`,
        });
      });
    });

    it('#isArchived()', function () {
      expect(context.entity.isArchived()).toBe(false);
      context.entity.data.sys.archivedVersion = 1;
      expect(context.entity.isArchived()).toBe(true);
    });

    it('#canArchive', function () {
      context.entity.isArchived = jest.fn();
      context.entity.isPublished = jest.fn();
      context.entity.isArchived.mockReturnValue(false);
      context.entity.isPublished.mockReturnValue(false);
      expect(context.entity.canArchive()).toBe(true);
      context.entity.isArchived.mockReturnValue(true);
      context.entity.isPublished.mockReturnValue(false);
      expect(context.entity.canArchive()).toBe(false);
      context.entity.isArchived.mockReturnValue(false);
      context.entity.isPublished.mockReturnValue(true);
      expect(context.entity.canArchive()).toBe(false);
      context.entity.isArchived.mockReturnValue(true);
      context.entity.isPublished.mockReturnValue(true);
      expect(context.entity.canArchive()).toBe(false);
    });

    it('#canUnarchive', function () {
      context.entity.isArchived = jest.fn();
      context.entity.isArchived.mockReturnValue(true);
      expect(context.entity.canUnarchive()).toBe(true);
      context.entity.isArchived.mockReturnValue(false);
      expect(context.entity.canUnarchive()).toBe(false);
    });
  });
}
