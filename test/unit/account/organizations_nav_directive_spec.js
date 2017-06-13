import * as K from 'helpers/mocks/kefir';

describe('cfAccountOrganizationsNav directive', function () {
  beforeEach(function () {
    module('contentful/test');
    this.OrganizationRoles = this.$inject('services/OrganizationRoles');
    this.$state = this.$inject('$state');
    this.$state.go = sinon.stub();
    this.tokenStore = this.$inject('services/TokenStore');
    this.tokenStore.refresh = sinon.stub().resolves();
    this.tokenStore.organizations$ = K.createMockProperty(this.orgs);
    this.OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(true);

    this.compile = function () {
      return this.$compile('<cf-account-organizations-nav />');
    };
    this.orgs = [{
      subscriptionPlan: {limits: {features: {offsiteBackup: true}}},
      subscription: { status: 'paid' },
      sys: {id: 'test-org-1'}
    }, {
      subscriptionPlan: {limits: {features: {offsiteBackup: false}}},
      subscription: { status: 'free' },
      sys: {id: 'test-org-2'}
    }, {
      subscriptionPlan: {limits: {features: {offsiteBackup: true}}},
      subscription: { status: 'free' },
      sys: {id: 'test-org-3'}
    }, {
      subscriptionPlan: {limits: {features: {offsiteBackup: false}}},
      subscription: { status: 'paid' },
      sys: {id: 'test-org-4'}
    }];
  });

  it('when org is invalid, redirects to home', function () {
    this.$state.params.orgId = 'test-org-3';
    this.tokenStore.getOrganization = sinon.stub().rejects();
    this.compile();
    sinon.assert.calledWith(this.$state.go, 'home');
  });

  describe('organization state', function () {
    beforeEach(function () {
      this.$state.current.name = 'account.organizations.users';
    });

    describe('displays the list of available tabs', function () {
      describeTabsLengthTest('with offsite backup and billing', 'test-org-1', 6);

      describeTabsLengthTest('without offsite backup and billing', 'test-org-2', 4);

      describeTabsLengthTest('with offsite backup, without billing', 'test-org-3', 5);

      describeTabsLengthTest('without offsite backup, with billing', 'test-org-4', 5);

      function describeTabsLengthTest (name, orgId, tabsLength) {
        it(name, function () {
          const org = this.orgs.find((org) => org.sys.id === orgId);
          this.tokenStore.getOrganization = sinon.stub().resolves(org);
          this.$state.params.orgId = orgId;
          const element = this.compile();
          expect(element.isolateScope().nav.tabs.length).toBe(tabsLength);
          const tabList = element.find('a[role="tab"]');
          expect(tabList.length).toBe(tabsLength);
        });
      }
    });
  });
});
