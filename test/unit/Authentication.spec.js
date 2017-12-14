import * as K from 'helpers/mocks/kefir';

describe('Authentication', function () {
  beforeEach(function () {
    this.$http = sinon.stub();
    this.window = {
      location: '',
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub()
    };

    module('contentful/test', ($provide) => {
      $provide.value('$http', this.$http);
      $provide.value('$window', this.window);
    });

    this.$http.resolves({data: {access_token: 'NEW TOKEN'}});
    this.Auth = this.$inject('Authentication');
    this.$q = this.$inject('$q');

    const TheStore = this.$inject('TheStore');
    this.store = TheStore.forKey('token');
  });


  describe('#refreshToken()', function () {
    beforeEach(function () {
      this.store.set('STORED_TOKEN');
      this.Auth.init();
    });

    it('sends a form encoded post request with credentials', function () {
      this.Auth.refreshToken();
      sinon.assert.calledWith(this.$http, sinon.match({
        method: 'POST',
        url: '//be.test.com/oauth/token',
        data:
          'grant_type=password' +
          '&client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
          '&scope=content_management_manage',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true
      }));
    });

    it('emits token on token$', function* () {
      const tokenRef = K.getRef(this.Auth.token$);
      expect(tokenRef.value).toBe('STORED_TOKEN');
      yield this.Auth.refreshToken();
      expect(tokenRef.value).toBe('NEW TOKEN');
    });

    it('stores the new token in local storage', function* () {
      yield this.Auth.refreshToken();
      expect(this.store.get()).toBe('NEW TOKEN');
    });

    it('returns new token', function* () {
      const token = yield this.Auth.refreshToken();
      expect(token).toBe('NEW TOKEN');
    });

    it('updates getToken() promise', function* () {
      expect(yield this.Auth.getToken()).toBe('STORED_TOKEN');
      yield this.Auth.refreshToken();
      expect(yield this.Auth.getToken()).toBe('NEW TOKEN');
    });

    it('does not issue a second request when one is in progress', function () {
      this.Auth.refreshToken();
      this.Auth.refreshToken();
      sinon.assert.calledOnce(this.$http);
    });

    it('redirects to login when token fetch fails', function () {
      this.$http.rejects();
      this.Auth.refreshToken();
      this.$apply();
      expect(this.window.location).toBe('//be.test.com/login');
    });
  });

  describe('#init()', function () {
    it('obtains token from local storage', function* () {
      this.store.set('STORED_TOKEN');
      this.Auth.init();
      expect(K.getValue(this.Auth.token$)).toBe('STORED_TOKEN');
      expect(yield this.Auth.getToken()).toBe('STORED_TOKEN');
    });

    it('sends authentication request without stored token', function* () {
      this.store.remove();
      this.$http.resolves({data: {access_token: 'NEW TOKEN'}});
      this.Auth.init();
      expect(yield this.Auth.getToken()).toBe('NEW TOKEN');
      expect(K.getValue(this.Auth.token$)).toBe('NEW TOKEN');
    });

    it('updates token if changed in another tab', function* () {
      this.store.set('STORED_TOKEN');
      this.Auth.init();
      this.window.addEventListener.withArgs('storage').yield({key: 'token', newValue: 'NEW TOKEN'});
      expect(yield this.Auth.getToken()).toBe('NEW TOKEN');
      expect(K.getValue(this.Auth.token$)).toBe('NEW TOKEN');
    });
  });

  describe('#logout()', function () {
    beforeEach(function () {
      this.store.set('STORED_TOKEN');
      this.Auth.init();
    });

    it('deletes the token from local storage', function* () {
      expect(this.store.get()).toBe('STORED_TOKEN');
      yield this.Auth.logout();
      expect(this.store.get()).toBe(null);
    });

    it('revokes the token', function* () {
      yield this.Auth.logout();
      this.$apply();
      sinon.assert.calledWith(this.$http, sinon.match({
        method: 'POST',
        url: '//be.test.com/oauth/revoke',
        data: 'token=STORED_TOKEN',
        headers: {
          'Authorization': 'Bearer STORED_TOKEN'
        }
      }));
    });

    it('redirects to the logout page', function* () {
      yield this.Auth.logout();
      expect(this.window.location).toEqual('//be.test.com/logout');
    });

    it('redirects to the logout page if revokation fails', function* () {
      this.$http.rejects();
      yield this.Auth.logout().catch(() => {});
      expect(this.window.location).toEqual('//be.test.com/logout');
    });
  });
});
