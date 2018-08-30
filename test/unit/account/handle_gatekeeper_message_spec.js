'use strict';

describe('Gatekeeper Message Handler', () => {
  beforeEach(function() {
    this.window = { location: '' };
    module('contentful/test', $provide => {
      $provide.value('$window', this.window);
    });
    this.handle = this.$inject('handleGatekeeperMessage');
    this.mockService('Config.es6', {
      websiteUrl: function(path) {
        return 'website/' + path;
      }
    });
    this.mockService('notification');
  });

  describe('actions on message', () => {
    it('logs out cancelled user and redirects them', function() {
      this.handle({ action: 'create', type: 'UserCancellation' });
      expect(this.window.location).toBe('website/goodbye');
    });

    it('opens the space creation dialog', function() {
      const CreateSpace = this.$inject('services/CreateSpace.es6');
      CreateSpace.showDialog = sinon.stub();
      this.handle({ action: 'new', type: 'space', organizationId: 'orgId' });
      sinon.assert.calledOnce(CreateSpace.showDialog.withArgs('orgId'));
    });

    it('refreshes token when space is deleted', function() {
      const refresh = (this.$inject('services/TokenStore.es6').refresh = sinon.spy());

      this.handle({ action: 'delete', type: 'space' });
      sinon.assert.calledOnce(refresh);
    });

    it('shows notification', function() {
      const notification = this.$inject('notification');

      this.handle({ type: 'flash', resource: { message: 'OK', type: 'info' } });
      this.handle({ type: 'flash', resource: { message: 'FAIL', type: 'error' } });
      sinon.assert.calledOnce(notification.info.withArgs('OK'));
      sinon.assert.calledOnce(notification.warn.withArgs('FAIL'));
    });

    it('changes URL when triggered', function() {
      const url = (this.$inject('$location').url = sinon.spy());
      this.handle({ action: 'navigate', type: 'location', path: 'blah/blah' });
      sinon.assert.calledOnce(url.withArgs('blah/blah'));
    });

    it('updates location', function() {
      const urlSyncHelper = this.mockService('account/UrlSyncHelper.es6');
      this.handle({ action: 'update', type: 'location', path: 'blah/blah' });
      sinon.assert.calledOnce(urlSyncHelper.updateWebappUrl.withArgs('blah/blah'));
    });

    it('refreshes token for any other message', function() {
      const refresh = (this.$inject('services/TokenStore.es6').refresh = sinon.spy());
      this.handle({ blah: 'blah' });
      sinon.assert.calledOnce(refresh);
    });

    describe('handles gk errors', () => {
      beforeEach(function() {
        this.modalDialog = this.$inject('modalDialog');
        this.modalDialog.open = sinon.stub().returns({ promise: Promise.resolve() });
        this.$state = this.$inject('$state');
        this.$state.go = sinon.stub();

        this.expectModal = function(title, message) {
          sinon.assert.calledOnce(
            this.modalDialog.open.withArgs({
              title: title,
              message: message,
              ignoreEsc: true,
              backgroundClose: false
            })
          );
        };
      });

      it('shows gk message in modal', function() {
        this.handle({ type: 'error', status: 500, heading: 'oopsie', body: 'error happened' });
        this.expectModal('oopsie', 'error happened');
      });

      it('unescapes gk message', function() {
        this.handle({
          type: 'error',
          status: 404,
          heading: 'Page does&#39;t exist',
          body: 'Server says: &quot;404&quot;'
        });
        this.expectModal("Page does't exist", 'Server says: "404"');
      });

      it('redirects to login', function() {
        const redirectToLogin = (this.$inject('Authentication.es6').redirectToLogin = sinon.spy());
        this.handle({ type: 'error', status: 401 });
        sinon.assert.calledOnce(redirectToLogin);
      });
    });
  });
});
