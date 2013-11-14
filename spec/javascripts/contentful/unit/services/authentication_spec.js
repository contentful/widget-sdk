'use strict';

describe('Authentication service', function () {
  var authentication, $rootScope;
  var hashStub, searchStub, pathStub;
  var cookiesSetStub, cookiesGetStub, cookiesDelStub;
  var infoStub;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      hashStub = sinon.stub();
      searchStub = sinon.stub();
      pathStub = sinon.stub();
      infoStub = sinon.stub();

      $provide.value('$location', {
        hash: hashStub,
        search: searchStub,
        path: pathStub
      });

      $provide.value('notification', {
        info: infoStub
      });
    });
    inject(function (_$rootScope_, _authentication_) {
      $rootScope = _$rootScope_;
      authentication = _authentication_;

      cookiesSetStub = sinon.stub($.cookies, 'set');
      cookiesGetStub = sinon.stub($.cookies, 'get');
      cookiesDelStub = sinon.stub($.cookies, 'del');
    });
  });

  afterEach(inject(function ($log) {
    cookiesGetStub.restore();
    cookiesSetStub.restore();
    cookiesDelStub.restore();
    $log.assertEmpty();
  }));

  it('has a client', function () {
    expect(authentication.client).toBeDefined();
  });

  describe('login with existing token from hash param', function () {
    beforeEach(function () {
      hashStub.returns('#access_token=logintoken');
      searchStub.returns({});
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
        expect(hashStub.calledWith('')).toBe(true);
      });

      it('shows no notification if already authenticated', function () {
        expect(infoStub.called).toBe(false);
      });

      it('does not delete a redirect cookie', function () {
        expect(cookiesDelStub.called).toBe(false);
      });

      it('does not attempt to redirect', function () {
        expect(pathStub.called).toBe(false);
      });

    });

    describe('notification if already authenticated', function () {
      beforeEach(function () {
        searchStub.returns({already_authenticated: true});
        authentication.login();
      });

      it('shows a notification if already authenticated', function () {
        expect(infoStub.called).toBe(true);
      });
    });

    describe('redirection after login', function () {
      beforeEach(function () {
        cookiesGetStub.withArgs('redirect_after_login').returns('/redirection/path');
        searchStub.returns({});
        authentication.login();
      });

      it('deletes the redirection cookie', function () {
        expect(cookiesDelStub.calledWith('redirect_after_login')).toBe(true);
      });

      it('redirects the path', function () {
        expect(pathStub.calledWith('/redirection/path')).toBe(true);
      });
    });
  });

  describe('login with existing token from cookie', function () {
    beforeEach(function () {
      searchStub.returns({});
      hashStub.returns('');
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
        expect(infoStub.called).toBe(false);
      });

      it('does not delete a redirect cookie', function () {
        expect(cookiesDelStub.called).toBe(false);
      });

      it('does not attempt to redirect', function () {
        expect(pathStub.called).toBe(false);
      });

    });

    describe('notification if already authenticated', function () {
      it('shows a notification if already authenticated', function () {
        searchStub.returns({already_authenticated: true});
        authentication.login();
        expect(infoStub.called).toBe(true);
      });
    });

    describe('redirection after login', function () {
      beforeEach(function () {
        cookiesGetStub.withArgs('redirect_after_login').returns('/redirection/path');
        authentication.login();
      });

      it('deletes the redirection cookie', function () {
        expect(cookiesDelStub.calledWith('redirect_after_login')).toBe(true);
      });

      it('redirects the path', function () {
        expect(pathStub.calledWith('/redirection/path')).toBe(true);
      });
    });
  });


  describe('fail to login with no token', function () {
    var redirectStub;
    beforeEach(function () {
      hashStub.returns('');
      cookiesGetStub.withArgs('token').returns(false);
      redirectStub = sinon.stub(authentication, 'redirectToLogin');
    });

    afterEach(function () {
      redirectStub.restore();
    });

    it('redirect is called', function () {
      pathStub.returns('/');
      authentication.login();
      expect(redirectStub.called).toBe(true);
    });

    it('redirect is called and cookie is set', function () {
      pathStub.returns('/path');
      authentication.login();
      expect(redirectStub.called).toBe(true);
      expect(cookiesSetStub.calledWith('redirect_after_login', '/path')).toBe(true);
    });


  });

});
