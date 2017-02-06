describe('CreateSpace', function () {
  beforeEach(function () {
    module('contentful/test');
    this.spaceContext = this.$inject('spaceContext');
    this.spaceContext.refreshContentTypes = sinon.stub();
    this.spaceContext.refreshContentTypesUntilChanged = sinon.stub().resolves();
    this.modalDialog = this.$inject('modalDialog');
    this.modalDialog.open = sinon.stub().returns({promise: this.resolve()});
    this.analytics = this.$inject('analytics/Analytics');
    this.analytics.track = sinon.stub();
    this.CreateSpace = this.$inject('services/CreateSpace');
  });

  describe('#showDialog', function () {
    it('tracks analytics event', function () {
      this.CreateSpace.showDialog();
      sinon.assert.calledWith(this.analytics.track, 'space_switcher:create_clicked');
    });

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

  describe('blank space', function () {
    it('refreshes content types when done', function () {
      this.CreateSpace.showDialog();
      this.$apply();
      sinon.assert.called(this.spaceContext.refreshContentTypes);
    });
  });

  describe('template space', function () {
    beforeEach(function () {
      this.$rootScope = this.$inject('$rootScope');
      this.$rootScope.$broadcast = sinon.stub().returns({});
      this.modalDialog.open.returns({promise: this.resolve({ name: 'template-1' })});
      this.CreateSpace.showDialog();
      this.$apply();
    });

    it('broadcasts `reloadEntries`', function () {
      sinon.assert.calledWith(this.$rootScope.$broadcast, 'reloadEntries');
    });
  });
});
