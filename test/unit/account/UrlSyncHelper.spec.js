import sinon from 'sinon';
import { $initialize } from 'test/helpers/helpers';

describe('account/UrlSyncHelper.es6', () => {
  beforeEach(async function() {
    this.$state = {
      href: sinon.stub(),
      go: sinon.spy(),
      current: {}
    };
    this.$location = {
      url: sinon.stub()
    };

    await $initialize(this.system, $provide => {
      $provide.constant('$state', this.$state);
      $provide.constant('$location', this.$location);
    });

    this.UrlSyncHelper = await this.system.import('account/UrlSyncHelper.es6');
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
