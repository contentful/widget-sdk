describe('account/UrlSyncHelper', () => {
  beforeEach(function() {
    module('contentful/test');
    this.$state = this.mockService('$state');
    this.$state.go = sinon.spy();
    this.$location = this.mockService('$location');
    this.UrlSyncHelper = this.$inject('account/UrlSyncHelper');
  });

  describe('.getGatekeeperUrl()', () => {
    beforeEach(function() {
      this.$location.url.returns('/account/profile/user/foo%2fbar');
      this.$state.href.withArgs('account').returns('/account');
    });
    it('returns gatekeeper url', function() {
      expect(this.UrlSyncHelper.getGatekeeperUrl()).toBe(
        '//be.test.com/account/profile/user/foo/bar'
      );
    });
  });

  describe('.updateWebappUrl()', () => {
    beforeEach(function() {
      this.$state.current.name = 'account.profile.foo';
      this.$state.href.returns('/account/profile/user/foo/bar');
      this.$state.href
        .withArgs(this.$state.current.name, { pathSuffix: '' })
        .returns('/account/profile/user');
    });

    it('silently updates URL if state is the same', function() {
      this.UrlSyncHelper.updateWebappUrl('/account/profile/user/blah/blah');
      expect(this.$state.go.lastCall.args[1].pathSuffix).toBe('/blah/blah');
    });

    it('updates location if the state has changed', function() {
      const newPath = '/account/profile/space_memberships/blah/blah';
      this.UrlSyncHelper.updateWebappUrl(newPath);

      sinon.assert.notCalled(this.$state.go);
      sinon.assert.calledOnce(this.$location.url.withArgs(newPath));
    });
  });
});
