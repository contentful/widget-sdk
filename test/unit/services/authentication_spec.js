'use strict';

describe('Authentication service', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide, authenticationProvider, environment) {
      environment.settings.base_host = 'basehost';
      environment.settings.marketing_url = 'marketinghost';

      $provide.constant('privateContentfulClient', {
        QueryLinkResolver: { resolveQueryLinks: sinon.stub() }
      });

      $provide.value('$window', { addEventListener: sinon.stub() });
    });
    this.logger = this.$inject('logger');
    this.authentication = this.$inject('authentication');
    this.notification = this.$inject('notification');
    this.$location = this.$inject('$location');
    sinon.stub(this.$location, 'hash');
    sinon.stub(this.$location, 'search');
    sinon.stub(this.$location, 'path');

    sinon.stub($.cookies, 'set');
    sinon.stub($.cookies, 'get');
    sinon.stub($.cookies, 'del');

    var QueryLinkResolver = this.$inject('privateContentfulClient').QueryLinkResolver;
    this.resolveQueryLinks = QueryLinkResolver.resolveQueryLinks;
  });

  afterEach(function () {
    $.cookies.get.restore();
    $.cookies.set.restore();
    $.cookies.del.restore();
  });

  it('has a client', function () {
    expect(this.authentication.client).toBeDefined();
  });

  describe('login with existing token from hash param', function () {
    beforeEach(function () {
      this.$location.hash.returns('#access_token=logintoken');
      this.$location.search.returns({});
      $.cookies.get.withArgs('redirect_after_login').returns(false);
    });

    describe('no notifications or redirections', function () {
      beforeEach(function () {
        this.authentication.login();
      });
      it('saves the access token on the cookie', function () {
        expect($.cookies.set.args[0][0]).toBe('token');
        expect($.cookies.set.args[0][1]).toBe('logintoken');
      });

      it('saves the access token on a param', function () {
        expect(this.authentication.token).toBe('logintoken');
      });

      it('clears the url hash', function () {
        sinon.assert.calledWith(this.$location.hash, '');
      });

      it('shows no notification if already authenticated', function () {
        sinon.assert.notCalled(this.notification.info);
      });

      it('does not delete a redirect cookie', function () {
        sinon.assert.notCalled($.cookies.del);
      });

      it('does not attempt to redirect', function () {
        sinon.assert.notCalled(this.$location.path);
      });

    });

    describe('notification if already authenticated', function () {
      beforeEach(function () {
        this.$location.search.returns({already_authenticated: true});
        this.authentication.login();
      });

      it('shows a notification if already authenticated', function () {
        sinon.assert.called(this.notification.info);
      });
    });

    describe('redirection after login', function () {
      beforeEach(function () {
        $.cookies.get.withArgs('redirect_after_login').returns('/redirection/path');
        this.$location.search.returns({});
        this.authentication.login();
      });

      it('deletes the redirection cookie', function () {
        sinon.assert.calledWith($.cookies.del, 'redirect_after_login');
      });

      it('redirects the path', function () {
        sinon.assert.calledWith(this.$location.path, '/redirection/path');
      });
    });
  });

  describe('login with existing token from cookie', function () {
    beforeEach(function () {
      this.$location.search.returns({});
      this.$location.hash.returns('');
      $.cookies.get.withArgs('token').returns('logintoken');
      $.cookies.get.withArgs('redirect_after_login').returns(false);
    });

    describe('no notifications or redirections', function () {
      beforeEach(function () {
        this.authentication.login();
      });

      it('saves the access token on a param', function () {
        expect(this.authentication.token).toBe('logintoken');
      });

      it('shows no notification if already authenticated', function () {
        sinon.assert.notCalled(this.notification.info);
      });

      it('does not delete a redirect cookie', function () {
        sinon.assert.notCalled($.cookies.del);
      });

      it('does not attempt to redirect', function () {
        sinon.assert.notCalled(this.$location.path);
      });

    });

    describe('notification if already authenticated', function () {
      it('shows a notification if already authenticated', function () {
        this.$location.search.returns({already_authenticated: true});
        this.authentication.login();
        sinon.assert.called(this.notification.info);
      });
    });

    describe('redirection after login', function () {
      beforeEach(function () {
        $.cookies.get.withArgs('redirect_after_login').returns('/redirection/path');
        this.authentication.login();
      });

      it('deletes the redirection cookie', function () {
        sinon.assert.calledWith($.cookies.del, 'redirect_after_login');
      });

      it('redirects the path', function () {
        sinon.assert.calledWith(this.$location.path, '/redirection/path');
      });
    });
  });


  describe('fail to login with no token', function () {
    var redirectStub;
    beforeEach(function () {
      this.$location.hash.returns('');
      $.cookies.get.withArgs('token').returns(false);
      redirectStub = sinon.stub(this.authentication, 'redirectToLogin');
    });

    afterEach(function () {
      redirectStub.restore();
    });

    it('redirect is called', function () {
      this.$location.path.returns('/');
      this.authentication.login();
      sinon.assert.called(redirectStub);
    });

    it('redirect is called and cookie is set', function () {
      this.$location.path.returns('/path');
      this.authentication.login();
      sinon.assert.called(redirectStub);
      sinon.assert.calledWith($.cookies.set, 'redirect_after_login', '/path');
    });
  });


  describe('logout', function () {
    beforeEach(function () {
      this.authentication.logout();
    });

    it('deletes the token cookie', function () {
      sinon.assert.calledWith($.cookies.del, 'token');
    });

    it('sets the window location', inject(function ($window) {
      expect($window.location).toEqual('//basehost/logout');
    }));
  });

  describe('goodbye', function () {
    beforeEach(function () {
      this.authentication.goodbye();
    });

    it('deletes the token cookie', function () {
      sinon.assert.calledWith($.cookies.del, 'token');
    });

    it('sets the window location', inject(function ($window) {
      expect($window.location).toEqual('marketinghost/goodbye');
    }));
  });

  describe('is logged in', function () {
    it('is true', function () {
      this.authentication.token = {};
      expect(this.authentication.isLoggedIn()).toBeTruthy();
    });

    it('is false', function () {
      expect(this.authentication.isLoggedIn()).toBeFalsy();
    });
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

  describe('redirect to login', function () {
    beforeEach(inject(function ($window) {
      $window.location = {
        protocol: 'redirectprotocol',
        host: 'redirecthost'
      };
      this.authentication.redirectToLogin();
    }));

    it('redirectingToLogin set to true', function () {
      expect(this.authentication.redirectingToLogin).toBeTruthy();
    });

    it('sets login url', inject(function ($window) {
      expect($window.location).toMatch('oauth/authorize');
    }));

    it('login url contains redirect url', inject(function ($window) {
      expect($window.location).toMatch('redirectprotocol');
      expect($window.location).toMatch('redirecthost');
    }));
  });

  describe('getting token lookup', function () {
    var clientTokenLookupStub;
    beforeEach(function () {
      clientTokenLookupStub = sinon.stub(this.authentication.client, 'getTokenLookup');
    });

    afterEach(function () {
      clientTokenLookupStub.restore();
    });

    describe('fails because login redirection', function () {
      beforeEach(function () {
        this.authentication.redirectingToLogin = true;
        this.authentication.getTokenLookup();
      });

      it('client token lookup not called', function () {
        sinon.assert.notCalled(clientTokenLookupStub);
      });
    });

    describe('rejects because call fails', function () {
      var tokenLookup, errorResponse;
      beforeEach(function () {
        errorResponse = {error: 'response'};
        clientTokenLookupStub.returns(this.reject(errorResponse));
        tokenLookup = this.authentication.getTokenLookup();
        this.$apply();
      });

      it('client token lookup is called', function () {
        sinon.assert.called(clientTokenLookupStub);
      });

      it('logger error is fired', function () {
        sinon.assert.called(this.logger.logError);
      });

      it('client token lookup promise fails', function () {
        this.$apply(function () {
          tokenLookup.catch(function (error) {
            expect(error).toBe(errorResponse);
          });
        });
      });
    });

    describe('resolves because call succeeds', function () {
      var tokenLookup, tokenLookupObj, dataResponse, setTokenStub;
      beforeEach(function () {
        dataResponse = {token: 'lookup'};
        clientTokenLookupStub.returns(this.when(dataResponse));
        setTokenStub = sinon.stub(this.authentication, 'setTokenLookup');
        tokenLookupObj = {parsed: 'lookup'};
        this.authentication.tokenLookup = tokenLookupObj;
        tokenLookup = this.authentication.getTokenLookup();
        this.$apply();
      });

      it('client token lookup is called', function () {
        sinon.assert.called(clientTokenLookupStub);
      });

      it('client token lookup promise resolves', function () {
        this.$apply(function () {
          tokenLookup.then(function () {
            sinon.assert.calledWith(setTokenStub, dataResponse);
          });
        });
      });

      it('client token lookup is returned from promise', function () {
        this.$apply(function () {
          tokenLookup.then(function (data) {
            expect(data).toBe(this.authentication.tokenLookup);
          });
        });
      });
    });
  });

  describe('get user', function () {
    it('no token lookup', function () {
      this.authentication.tokenLookup = null;
      expect(this.authentication.getUser()).toBeFalsy();
    });

    it('with token lookup', function () {
      var user = {name: 'doge'};
      this.authentication.tokenLookup = {sys: {createdBy: user}};
      expect(this.authentication.getUser()).toBe(user);
    });
  });

  describe('set token lookup', function () {
    var tokenLookup;
    beforeEach(function () {
      tokenLookup = {token: 'lookup'};
      this.resolveQueryLinks.returns(['resolvedLink']);
      this.authentication.setTokenLookup(tokenLookup);
    });

    it('is stored internally', function () {
      expect(this.authentication._unresolvedTokenLookup).toBe(tokenLookup);
    });

    it('queryLinkResolver is called with tokenLookup', function () {
      sinon.assert.calledWith(this.resolveQueryLinks, tokenLookup);
    });

    it('is parsed by querylink resolver', function () {
      expect(this.authentication.tokenLookup).toBe('resolvedLink');
    });
  });

});
