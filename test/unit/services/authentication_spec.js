'use strict';

describe('Authentication service', function () {
  var authentication, $rootScope, $q;
  var cookiesSetStub, cookiesGetStub, cookiesDelStub;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide, authenticationProvider) {
      stubs = $provide.makeStubs([
        'hash', 'search', 'path', 'info', 'loggerError', 'resolveQueryLinks'
      ]);
      $provide.constant('privateContentfulClient', {
        QueryLinkResolver: {
          resolveQueryLinks: stubs.resolveQueryLinks
        }
      });

      $provide.constant('environment', {
        settings: {
          base_host: 'basehost',
          marketing_url: 'marketinghost'
        }
      });

      $provide.value('$location', {
        hash: stubs.hash,
        search: stubs.search,
        path: stubs.path
      });

      $provide.value('notification', {
        info: stubs.info
      });

      $provide.value('logger', {
        logError: stubs.loggerError
      });

      $provide.value('$window', {
        addEventListener: sinon.stub()
      });

      authenticationProvider.setEnvVars();
    });
    inject(function (_$rootScope_, _authentication_, _$q_) {
      $rootScope = _$rootScope_;
      authentication = _authentication_;
      $q = _$q_;

      cookiesSetStub = sinon.stub($.cookies, 'set');
      cookiesGetStub = sinon.stub($.cookies, 'get');
      cookiesDelStub = sinon.stub($.cookies, 'del');
    });
  });

  afterEach(function () {
    cookiesGetStub.restore();
    cookiesSetStub.restore();
    cookiesDelStub.restore();
  });

  it('has a client', function () {
    expect(authentication.client).toBeDefined();
  });

  describe('login with existing token from hash param', function () {
    beforeEach(function () {
      stubs.hash.returns('#access_token=logintoken');
      stubs.search.returns({});
      cookiesGetStub.withArgs('redirect_after_login').returns(false);
    });

    describe('no notifications or redirections', function () {
      beforeEach(function () {
        authentication.login();
      });
      it('saves the access token on the cookie', function () {
        expect(cookiesSetStub.args[0][0]).toBe('token');
        expect(cookiesSetStub.args[0][1]).toBe('logintoken');
      });

      it('saves the access token on a param', function () {
        expect(authentication.token).toBe('logintoken');
      });

      it('clears the url hash', function () {
        expect(stubs.hash).toBeCalledWith('');
      });

      it('shows no notification if already authenticated', function () {
        sinon.assert.notCalled(stubs.info);
      });

      it('does not delete a redirect cookie', function () {
        sinon.assert.notCalled(cookiesDelStub);
      });

      it('does not attempt to redirect', function () {
        sinon.assert.notCalled(stubs.path);
      });

    });

    describe('notification if already authenticated', function () {
      beforeEach(function () {
        stubs.search.returns({already_authenticated: true});
        authentication.login();
      });

      it('shows a notification if already authenticated', function () {
        expect(stubs.info).toBeCalled();
      });
    });

    describe('redirection after login', function () {
      beforeEach(function () {
        cookiesGetStub.withArgs('redirect_after_login').returns('/redirection/path');
        stubs.search.returns({});
        authentication.login();
      });

      it('deletes the redirection cookie', function () {
        expect(cookiesDelStub).toBeCalledWith('redirect_after_login');
      });

      it('redirects the path', function () {
        expect(stubs.path).toBeCalledWith('/redirection/path');
      });
    });
  });

  describe('login with existing token from cookie', function () {
    beforeEach(function () {
      stubs.search.returns({});
      stubs.hash.returns('');
      cookiesGetStub.withArgs('token').returns('logintoken');
      cookiesGetStub.withArgs('redirect_after_login').returns(false);
    });

    describe('no notifications or redirections', function () {
      beforeEach(function () {
        authentication.login();
      });

      it('saves the access token on a param', function () {
        expect(authentication.token).toBe('logintoken');
      });

      it('shows no notification if already authenticated', function () {
        sinon.assert.notCalled(stubs.info);
      });

      it('does not delete a redirect cookie', function () {
        sinon.assert.notCalled(cookiesDelStub);
      });

      it('does not attempt to redirect', function () {
        sinon.assert.notCalled(stubs.path);
      });

    });

    describe('notification if already authenticated', function () {
      it('shows a notification if already authenticated', function () {
        stubs.search.returns({already_authenticated: true});
        authentication.login();
        expect(stubs.info).toBeCalled();
      });
    });

    describe('redirection after login', function () {
      beforeEach(function () {
        cookiesGetStub.withArgs('redirect_after_login').returns('/redirection/path');
        authentication.login();
      });

      it('deletes the redirection cookie', function () {
        expect(cookiesDelStub).toBeCalledWith('redirect_after_login');
      });

      it('redirects the path', function () {
        expect(stubs.path).toBeCalledWith('/redirection/path');
      });
    });
  });


  describe('fail to login with no token', function () {
    var redirectStub;
    beforeEach(function () {
      stubs.hash.returns('');
      cookiesGetStub.withArgs('token').returns(false);
      redirectStub = sinon.stub(authentication, 'redirectToLogin');
    });

    afterEach(function () {
      redirectStub.restore();
    });

    it('redirect is called', function () {
      stubs.path.returns('/');
      authentication.login();
      expect(redirectStub).toBeCalled();
    });

    it('redirect is called and cookie is set', function () {
      stubs.path.returns('/path');
      authentication.login();
      expect(redirectStub).toBeCalled();
      expect(cookiesSetStub).toBeCalledWith('redirect_after_login', '/path');
    });
  });


  describe('logout', function () {
    beforeEach(function () {
      authentication.logout();
    });

    it('deletes the token cookie', function () {
      expect(cookiesDelStub).toBeCalledWith('token');
    });

    it('sets the window location', inject(function ($window) {
      expect($window.location).toEqual('//basehost/logout');
    }));
  });

  describe('goodbye', function () {
    beforeEach(function () {
      authentication.goodbye();
    });

    it('deletes the token cookie', function () {
      expect(cookiesDelStub).toBeCalledWith('token');
    });

    it('sets the window location', inject(function ($window) {
      expect($window.location).toEqual('marketinghost/goodbye');
    }));
  });

  describe('is logged in', function () {
    it('is true', function () {
      authentication.token = {};
      expect(authentication.isLoggedIn()).toBeTruthy();
    });

    it('is false', function () {
      expect(authentication.isLoggedIn()).toBeFalsy();
    });
  });

  it('account url', function () {
    expect(authentication.accountUrl()).toEqual('//basehost/account');
  });


  it('support url', function () {
    expect(authentication.supportUrl()).toEqual('//basehost/integrations/zendesk/login');
  });

  it('space settings url', function () {
    expect(authentication.spaceSettingsUrl('123')).toEqual('//basehost/settings/spaces/123');
  });

  describe('redirect to login', function () {
    beforeEach(inject(function ($window) {
      $window.location = {
        protocol: 'redirectprotocol',
        host: 'redirecthost'
      };
      authentication.redirectToLogin();
    }));

    it('redirectingToLogin set to true', function () {
      expect(authentication.redirectingToLogin).toBeTruthy();
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
      clientTokenLookupStub = sinon.stub(authentication.client, 'getTokenLookup');
    });

    afterEach(function () {
      clientTokenLookupStub.restore();
    });

    describe('fails because login redirection', function () {
      beforeEach(function () {
        authentication.redirectingToLogin = true;
        authentication.getTokenLookup();
      });

      it('client token lookup not called', function () {
        sinon.assert.notCalled(clientTokenLookupStub);
      });
    });

    describe('rejects because call fails', function () {
      var tokenLookup, errorResponse;
      beforeEach(function () {
        errorResponse = {error: 'response'};
        clientTokenLookupStub.returns($q.reject(errorResponse));
        tokenLookup = authentication.getTokenLookup();
        $rootScope.$apply();
      });

      it('client token lookup is called', function () {
        expect(clientTokenLookupStub).toBeCalled();
      });

      it('logger error is fired', function () {
        expect(stubs.loggerError).toBeCalled();
      });

      it('client token lookup promise fails', inject(function ($rootScope) {
        $rootScope.$apply(function () {
          tokenLookup.catch(function (error) {
            expect(error).toBe(errorResponse);
          });
        });
      }));
    });

    describe('resolves because call succeeds', function () {
      var tokenLookup, tokenLookupObj, dataResponse, setTokenStub;
      beforeEach(function () {
        dataResponse = {token: 'lookup'};
        clientTokenLookupStub.returns($q.when(dataResponse));
        setTokenStub = sinon.stub(authentication, 'setTokenLookup');
        tokenLookupObj = {parsed: 'lookup'};
        authentication.tokenLookup = tokenLookupObj;
        tokenLookup = authentication.getTokenLookup();
        $rootScope.$apply();
      });

      it('client token lookup is called', function () {
        expect(clientTokenLookupStub).toBeCalled();
      });

      it('client token lookup promise resolves', inject(function ($rootScope) {
        $rootScope.$apply(function () {
          tokenLookup.then(function () {
            expect(setTokenStub).toBeCalledWith(dataResponse);
          });
        });
      }));

      it('client token lookup is returned from promise', inject(function ($rootScope) {
        $rootScope.$apply(function () {
          tokenLookup.then(function (data) {
            expect(data).toBe(authentication.tokenLookup);
          });
        });
      }));
    });
  });

  describe('get user', function () {
    it('no token lookup', function () {
      authentication.tokenLookup = null;
      expect(authentication.getUser()).toBeFalsy();
    });

    it('with token lookup', function () {
      var user = {name: 'doge'};
      authentication.tokenLookup = {sys: {createdBy: user}};
      expect(authentication.getUser()).toBe(user);
    });
  });

  describe('set token lookup', function () {
    var tokenLookup;
    beforeEach(function () {
      tokenLookup = {token: 'lookup'};
      stubs.resolveQueryLinks.returns(['resolvedLink']);
      authentication.setTokenLookup(tokenLookup);
    });

    it('is stored internally', function () {
      expect(authentication._unresolvedTokenLookup).toBe(tokenLookup);
    });

    it('queryLinkResolver is called with tokenLookup', function () {
      expect(stubs.resolveQueryLinks).toBeCalledWith(tokenLookup);
    });

    it('is parsed by querylink resolver', function () {
      expect(authentication.tokenLookup).toBe('resolvedLink');
    });
  });

});
