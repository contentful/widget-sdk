import * as K from 'helpers/mocks/kefir';

describe('cfAccountOrganizationsNav directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.OrganizationList = this.$inject('OrganizationList');
    this.$state = this.$inject('$state');
    this.$state.go = sinon.stub();
    this.tokenStore = this.$inject('tokenStore');
    this.tokenStore.refresh = sinon.stub().resolves();

    this.compile = function () {
      this.element = this.$compile('<cf-account-organizations-nav />');
      this.controller = this.element.isolateScope().nav;
      this.OrganizationList.organizations$ = K.createMockProperty(this.orgs);
    };
    this.orgs = [{
      subscriptionPlan: {limits: {features: {offsiteBackup: true}}},
      sys: {id: 'test-org-1'}
    }, {
      subscriptionPlan: {limits: {features: {offsiteBackup: false}}},
      sys: {id: 'test-org-2'}
    }];
  });

  describe('new state', function () {
    beforeEach(function () {
      this.$state.current.name = 'account.organizations.new';
      this.compile();
    });

    it('displays the new organization tabs', function () {
      const tabList = this.element.find('a[role="tab"]');
      const tab = $(tabList[0]);
      expect(tabList.length).toBe(1);
      expect(tab.text()).toBe('New Organization');
      expect(tab.attr('aria-selected')).toBe('true');
    });

    it('organization switcher goes to the subscriptions state', function () {
      this.controller.goToOrganization('test-org-1');

      sinon.assert.calledWith(
        this.$state.go,
        'account.organizations.subscription',
        {orgId: 'test-org-1'}
      );
    });
  });

  describe('organization state', function () {
    beforeEach(function () {
      this.$state.current.name = 'account.organizations.users';
    });

    describe('displays the list of available tabs', function () {
      it('with offsite backup', function () {
        this.$state.params.orgId = 'test-org-1';
        this.OrganizationList.get = sinon.stub().returns(this.orgs[0]);
        this.compile();
        expect(this.controller.tabs.length).toBe(5);
        const tabList = this.element.find('a[role="tab"]');
        expect(tabList.length).toBe(5);
      });

      it('without offsite backup', function () {
        this.$state.params.orgId = 'test-org-2';
        this.OrganizationList.get = sinon.stub().returns(this.orgs[1]);
        this.compile();
        const tabList = this.element.find('a[role="tab"]');
        expect(tabList.length).toBe(4);
      });
    });

    describe('invalid org', function () {
      beforeEach(function () {
        this.$state.params.orgId = 'test-org-3';
        this.OrganizationList.get = sinon.stub().returns();
        this.compile();
      });

      it('attempts to refresh token', function () {
        sinon.assert.calledOnce(this.tokenStore.refresh);
      });

      it('redirects to home', function () {
        sinon.assert.calledWith(this.$state.go, 'home');
      });
    });
  });
});
