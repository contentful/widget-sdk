'use strict';

describe('Gatekeeper Message Handler', function () {
  beforeEach(function () {
    this.window = {location: ''};
    module('contentful/test', ($provide) => {
      $provide.value('$window', this.window);
    });
    this.handle = this.$inject('handleGatekeeperMessage');
    this.mockService('Config', {
      websiteUrl: function (path) {
        return 'website/' + path;
      }
    });
    this.mockService('notification');
  });

  describe('actions on message', function () {
    it('logs out cancelled user and redirects them', function () {
      this.handle({action: 'create', type: 'UserCancellation'});
      expect(this.window.location).toBe('website/goodbye');
    });

    it('opens the space creation dialog', function () {
      const CreateSpace = this.$inject('services/CreateSpace');
      CreateSpace.showDialog = sinon.stub();
      this.handle({action: 'new', type: 'space', organizationId: 'orgId'});
      sinon.assert.calledOnce(CreateSpace.showDialog.withArgs('orgId'));
    });

    it('refreshes token when space is deleted', function () {
      const refresh = this.$inject('services/TokenStore').refresh = sinon.spy();

      this.handle({action: 'delete', type: 'space'});
      sinon.assert.calledOnce(refresh);
    });

    it('shows notification', function () {
      const notification = this.$inject('notification');

      this.handle({type: 'flash', resource: {message: 'OK', type: 'info'}});
      this.handle({type: 'flash', resource: {message: 'FAIL', type: 'error'}});
      sinon.assert.calledOnce(notification.info.withArgs('OK'));
      sinon.assert.calledOnce(notification.warn.withArgs('FAIL'));
    });

    it('changes URL when triggered', function () {
      const url = this.$inject('$location').url = sinon.spy();
      this.handle({action: 'navigate', type: 'location', path: 'blah/blah'});
      sinon.assert.calledOnce(url.withArgs('blah/blah'));
    });

    it('updates location', function () {
      const urlSyncHelper = this.mockService('account/UrlSyncHelper');
      this.handle({action: 'update', type: 'location', path: 'blah/blah'});
      sinon.assert.calledOnce(urlSyncHelper.updateWebappUrl.withArgs('blah/blah'));
    });

    it('refreshes token for any other message', function () {
      const refresh = this.$inject('services/TokenStore').refresh = sinon.spy();
      this.handle({blah: 'blah'});
      sinon.assert.calledOnce(refresh);
    });

    it('redirects to login', function () {
      const redirectToLogin = this.$inject('Authentication').redirectToLogin = sinon.spy();
      this.handle({type: 'error', status: 401});
      sinon.assert.calledOnce(redirectToLogin);
    });
  });
});
