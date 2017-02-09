'use strict';

describe('Authentication service', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide, environment) {
      environment.settings.authUrl = 'basehost';
      environment.settings.marketingUrl = 'marketinghost';
      environment.settings.contentful.webappClientId = '0';

      $provide.value('$window', {
        addEventListener: sinon.stub(),
        location: {
          host: 'redirecthost',
          protocol: 'redirectprocotol'
        }
      });
      $provide.value('$document', [{ label: '' }]);
    });

    this.$location = this.$inject('$location');
    this.$http = this.$inject('$http');
    this.authentication = this.$inject('authentication');
    this.authToken = this.$inject('authentication/token');

    // @todo only required by authToken, test it separately
    this.TheStore = this.$inject('TheStore');

    sinon.stub(this.$location, 'hash');
    sinon.stub(this.$location, 'search');
    sinon.stub(this.$location, 'path');
    sinon.stub(this.$location, 'url');

    sinon.stub(this.TheStore, 'set');
    sinon.stub(this.TheStore, 'get');
    sinon.stub(this.TheStore, 'remove');
  });

  afterEach(function () {
    this.TheStore.get.restore();
    this.TheStore.set.restore();
    this.TheStore.remove.restore();
  });

  describe('#login() ', function () {
    beforeEach(function () {
      this.$location.search.returns({});
      this.$http.post = sinon.stub().resolves({data: {
        access_token: 'my-token'
      }});
    });

    it('if token exists, immediately resolve', function () {
      this.authToken.get = sinon.stub().returns('my-token');
      this.authentication.login();
      this.$apply();
      sinon.assert.notCalled(this.$http.post);
    });

    it('if token doesn\'t exist, fetches a new one', function () {
      this.authToken.get = sinon.stub().returns(null);
      this.authToken.set = sinon.stub();
      this.authentication.login();
      this.$apply();
      sinon.assert.called(this.$http.post);
      sinon.assert.calledWith(this.authToken.set, 'my-token');
    });

    it('redirects to login if new token is not granted', inject(function ($window) {
      this.$http.post.rejects();
      this.$location.url.returns('//basehost');
      this.authentication.login();
      this.TheStore.get.withArgs('redirect_after_login').returns('/redirect/path');
      this.$apply();
      expect($window.location).toMatch('//basehost/login');
    }));
  });

  describe('#loginAfresh()', function () {
    it('deletes the token entry and calls login', function () {
      this.$http.post = sinon.stub().resolves({data: {
        access_token: 'my-token'
      }});
      this.authToken.clear = sinon.stub();
      this.authToken.set = sinon.stub();
      this.authentication.loginAfresh();
      this.$apply();
      sinon.assert.called(this.authToken.clear);
      sinon.assert.calledWith(this.authToken.set, 'my-token');
    });
  });

  describe('#logout()', function () {
    it('deletes the token entry', function () {
      this.$http.post = sinon.stub().resolves();
      this.authentication.logout();
      this.$apply();
      sinon.assert.calledWith(this.TheStore.remove, 'token');
    });

    it('revokes the token', inject(function ($httpBackend) {
      $httpBackend.expectPOST('//basehost/oauth/revoke').respond();
      this.authentication.logout();
      $httpBackend.verifyNoOutstandingExpectation();
    }));

    it('redirects to the logout page', inject(function ($window, $httpBackend) {
      $httpBackend.expectPOST('//basehost/oauth/revoke').respond();
      this.authentication.logout();
      $httpBackend.flush();
      expect($window.location).toEqual('//basehost/logout');
    }));

    it('redirects to the logout page if revokation fails', inject(function ($window, $httpBackend) {
      $httpBackend.expectPOST('//basehost/oauth/revoke').respond(500);
      this.authentication.logout();
      $httpBackend.flush();
      expect($window.location).toEqual('//basehost/logout');
    }));
  });

  describe('logoutCancelledUser', function () {
    beforeEach(function () {
      this.authentication.logoutCancelledUser();
    });

    it('deletes the token entry', function () {
      sinon.assert.calledWith(this.TheStore.remove, 'token');
    });

    it('sets the window location', inject(function ($window) {
      expect($window.location).toEqual('marketinghost/goodbye');
    }));
  });

  it('account url', function () {
    expect(this.authentication.accountUrl()).toEqual('//basehost/account');
  });

  it('support url', function () {
    expect(this.authentication.supportUrl()).toEqual('//basehost/integrations/zendesk/login');
  });

  it('space settings url', function () {
    expect(this.authentication.spaceSettingsUrl('123')).toEqual('//basehost/settings/spaces/123');
  });
});
