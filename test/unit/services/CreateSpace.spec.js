describe('CreateSpace', function () {
  beforeEach(function () {
    module('contentful/test');
    this.modalDialog = this.$inject('modalDialog');
    this.modalDialog.open = sinon.stub().returns({promise: this.resolve()});
    this.CreateSpace = this.$inject('services/CreateSpace');
  });

  describe('#showDialog', function () {
    it('opens dialog without org ID', function () {
      this.CreateSpace.showDialog();
      expect(this.modalDialog.open.firstCall.args[0].scopeData.organizationId).toBeUndefined();
      sinon.assert.calledOnce(this.modalDialog.open);
    });

    it('opens dialogs with org ID', function () {
      this.CreateSpace.showDialog('abc');
      expect(this.modalDialog.open.firstCall.args[0].scopeData.organizationId).toBe('abc');
    });
  });
});
