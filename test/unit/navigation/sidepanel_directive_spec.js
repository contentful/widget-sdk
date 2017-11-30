import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('cfNavSidepanel directive', () => {
  let NavStates;
  const navState$ = K.createMockProperty();

  const CreateSpace = {
    showDialog: sinon.stub()
  };

  const accessChecker = {
    canCreateSpaceInOrganization: sinon.stub(),
    canCreateOrganization: sinon.stub(),
    isInitialized$: K.createMockProperty(true)
  };

  const OrganizationRoles = {
    isOwnerOrAdmin: sinon.stub()
  };

  const Navigator = {
    go: sinon.stub()
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('services/CreateSpace', CreateSpace);
      $provide.value('states/Navigator', Navigator);
      $provide.value('accessChecker', accessChecker);
      $provide.value('services/OrganizationRoles', OrganizationRoles);
    });

    const NavState = this.$inject('navigation/NavState');
    NavState.navState$ = navState$;
    NavStates = NavState.NavStates;
    navState$.set(NavStates.Default());

    // tokenStore
    this.orgs = [{
      name: 'test-org-1',
      sys: {id: 'test-org-id-1'}
    }, {
      name: 'test-org-2',
      sys: {id: 'test-org-id-2'}
    }, {
      name: 'test-org-3',
      sys: {id: 'test-org-id-3'}
    }];
    this.spacesByOrg = {
      'test-org-id-1': [{
        data: {name: 'test-space-1-1', sys: {id: 'test-space-id-1-1'}}
      }],
      'test-org-id-2': [],
      'test-org-id-3': [{
        data: {name: 'test-space-3-1', sys: {id: 'test-space-id-3-1'}}
      }, {
        data: {name: 'test-space-3-2', sys: {id: 'test-space-id-3-2'}}
      }]
    };
    this.tokenStore = this.$inject('services/TokenStore');
    this.tokenStore.organizations$ = K.createMockProperty(this.orgs);
    this.tokenStore.spacesByOrganization$ = K.createMockProperty(this.spacesByOrg);

    // directive element
    const $rootEl = this.$compile('<cf-nav-sidepanel is-shown="true" />');

    this.$containerEl = $rootEl.find('.nav-sidepanel-container');
    this.$sidePanel = $rootEl.find('.nav-sidepanel');
    this.$scope = $rootEl.isolateScope();

    // helper methods
    this.setScopeProp = function (prop, value) {
      this.$scope[prop] = value;
      this.$apply();
    };

    this.emulateSettingsPage = function (org) {
      navState$.set(NavStates.OrgSettings(org));
    };

    this.emulateSpacePage = function (space, org) {
      navState$.set(NavStates.Space(space, org));
    };

    this.verifyScopePropsBasedOnOrg = function (org, isOwnerOrAdmin, canCreateSpaceInOrg, viewingOrgSettings) {
      expect(this.$scope.canGotoOrgSettings).toEqual(isOwnerOrAdmin);
      expect(this.$scope.canCreateSpaceInCurrOrg).toEqual(canCreateSpaceInOrg);
      expect(this.$scope.twoLetterOrgName).toEqual(org.name.slice(0, 2).toUpperCase());
      expect(this.$scope.viewingOrgSettings).toEqual(viewingOrgSettings);
    };

    this.expectSidePanelVisibility =
      expectVisibility(this.$sidePanel, 'nav-sidepanel--slide-in', 'nav-sidepanel--slide-out');

    this.expectDropdownVisibility = expectVisibility(
      this.$sidePanel.find('.nav-sidepanel__org-list-container'),
      'nav-sidepanel__org-list-container--is-visible',
      'nav-sidepanel__org-list-container--is-not-visible'
    );
  });

  afterEach(function () {
    // reset stubs
    accessChecker.canCreateSpaceInOrganization.reset();
    accessChecker.canCreateOrganization.reset();
    OrganizationRoles.isOwnerOrAdmin.reset();
    Navigator.go.reset();
    navState$.set(new NavStates.Default());
  });

  it('derives properties from currOrg', function () {
    const org = this.orgs[2];
    OrganizationRoles.isOwnerOrAdmin.returns(true);
    accessChecker.canCreateSpaceInOrganization.returns(true);
    accessChecker.canCreateOrganization.returns(true);
    this.emulateSettingsPage(org);
    this.$scope.$apply();
    this.verifyScopePropsBasedOnOrg(org, true, true, true);
    expect(this.$scope.canCreateOrg).toEqual(true);
  });

  it('grabs orgs from the organizatons$ stream', function () {
    expect(this.$scope.orgs).toEqual(this.orgs);
    expect(this.$sidePanel.find('.nav-sidepanel__org-name').length).toEqual(3);
  });

  it('grabs spaces by org from spacesByOrg$ stream', function () {
    expect(this.$scope.spacesByOrg).toEqual(this.spacesByOrg);
  });

  it('updates curr space based on space context', function () {
    const space = {name: 'test-space-1-1', sys: {id: 'test-space-id-1-1'}};
    expect(this.$scope.currSpace).toEqual(undefined);
    this.emulateSpacePage(space);
    this.$scope.$apply();
    expect(this.$scope.currSpace).toEqual(space);
  });

  it('sets curr org from nav state or default', function () {
    const org = this.orgs[2];
    const space = this.spacesByOrg[org.sys.id][1];
    this.emulateSpacePage(space, org);
    expect(this.$scope.currOrg).toEqual(org);
  });

  it('defaults currOrg to first if nav state has no org', function () {
    this.emulateSpacePage(null, null);
    expect(this.$scope.currOrg).toEqual(this.orgs[0]);
  });

  it('sets sidepanel visibility based on a property on scope', function () {
    this.$scope.$apply();
    expect(this.$scope.sidePanelIsShown).toBe(true);
    this.expectSidePanelVisibility(true);
  });

  describe('#closeSidePanel', function () {
    it('toggles sidepanel visibility', function () {
      this.$scope.closeSidePanel();
      this.$scope.$apply();
      expect(this.$scope.sidePanelIsShown).toBe(false);
      this.expectSidePanelVisibility(false);
    });

    it('hides org list dropdown', function () {
      this.$scope.openOrgsDropdown({stopPropagation: () => {}});
      this.$scope.closeSidePanel();
      this.$scope.$apply();
      this.expectDropdownVisibility(false);
    });
  });

  describe('#openOrgsDropdown', function () {
    it('shows dropdown', function () {
      this.expectDropdownVisibility(false);
      this.$scope.openOrgsDropdown({stopPropagation: () => {}});
      this.$apply();
      this.expectDropdownVisibility(true);
    });

    it('stops event propagation', function () {
      const stopPropagation = sinon.stub();
      this.$scope.openOrgsDropdown({stopPropagation});
      sinon.assert.calledOnce(stopPropagation);
    });
  });

  describe('#closeOrgsDropdown', function () {
    it('hides dropdown', function () {
      this.$scope.openOrgsDropdown({stopPropagation: () => {}});
      this.$apply();
      this.$scope.closeOrgsDropdown();
      this.$apply();
      this.expectDropdownVisibility(false);
    });
  });

  describe('#setCurrOrg', function () {
    it('sets curr org to the argument given to setCurrOrg method', function () {
      this.$scope.setCurrOrg(this.orgs[0]);
      expect(this.$scope.currOrg).toEqual(this.orgs[0]);
      this.verifyScopePropsBasedOnOrg(this.orgs[0], undefined, undefined, false);

      OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(true);
      accessChecker.canCreateSpaceInOrganization = sinon.stub().returns(true);
      this.$scope.setCurrOrg(this.orgs[2]);
      this.$scope.$apply();
      expect(this.$scope.currOrg).toEqual(this.orgs[2]);
      this.verifyScopePropsBasedOnOrg(this.orgs[2], true, true, false);
    });

    it('updates viewingOrgSettings flag based on curr org id and org id in state params', function () {
      const org = this.orgs[1];
      this.emulateSettingsPage(org);
      this.$scope.setCurrOrg(org);
      expect(this.$scope.viewingOrgSettings).toEqual(true);

      this.emulateSettingsPage(this.orgs[0]);
      this.$scope.setCurrOrg(org);
      expect(this.$scope.viewingOrgSettings).toEqual(false);
    });
  });

  describe('#gotoOrgSettings', function () {
    it('navigates to subscription page for the current org, hides the sidepanel and sets navigated to org as curr org', function () {
      const org = this.orgs[1];

      // default selected org is the first one
      expect(this.$scope.currOrg).toEqual(this.orgs[0]);

      // choose new org and go to org settings
      this.$scope.setCurrOrg(org);
      this.$scope.gotoOrgSettings();
      sinon.assert.calledWith(Navigator.go, {
        path: ['account', 'organizations', 'subscription'],
        params: { orgId: org.sys.id }
      });
      expect(this.$scope.sidePanelIsShown).toBe(false);
      this.emulateSettingsPage(org);
      this.verifyScopePropsBasedOnOrg(org, undefined, undefined, true);
    });
  });

  describe('#createNewOrg', function () {
    it('it hides sidepanel and navigates to create new org page', function () {
      this.$scope.createNewOrg();
      expect(this.$scope.sidePanelIsShown).toBe(false);
      sinon.assert.calledWith(Navigator.go, {
        path: ['account', 'organizations', 'new']
      });
    });
  });

  describe('#setAndGotoSpace', function () {
    it('navigates to given space and toggles the side panel', function () {
      const space = { sys: { id: 1234 } };

      this.$scope.setAndGotoSpace(space);
      this.emulateSpacePage(space);
      this.$scope.$apply();
      expect(this.$scope.currSpace).toEqual(space);
      expect(this.$scope.sidePanelIsShown).toBe(false);
      sinon.assert.calledWith(Navigator.go, {
        path: ['spaces', 'detail'],
        params: { spaceId: space.sys.id },
        options: { reload: true }
      });
    });
  });

  describe('#showCreateSpaceModal', function () {
    it('shows create space modal for the given org id and toggles sidepanel', function () {
      const org = this.orgs[1];
      this.$scope.setCurrOrg(org);
      this.$scope.showCreateSpaceModal();
      expect(this.$scope.sidePanelIsShown).toBe(false);
      sinon.assert.calledWith(CreateSpace.showDialog, org.sys.id);
    });
  });

  describe('UI updates based on scope props', function () {
    beforeEach(function () {
      this.setScopeProp = function (prop, val) {
        this.$scope[prop] = val;
        this.$scope.$apply();
      };
    });

    it('toggles sidepanel based on a flag', function () {
      this.setScopeProp('sidePanelIsShown', true);
      this.expectSidePanelVisibility(true);
      this.setScopeProp('sidePanelIsShown', false);
      this.expectSidePanelVisibility(false);
    });

    it('toggles org dropdown based on a flag', function () {
      const $sidePanelHeader = this.$sidePanel.find('.nav-sidepanel__header');

      this.setScopeProp('orgDropdownIsShown', true);
      this.expectDropdownVisibility(true);
      expect($sidePanelHeader.hasClass('nav-sidepanel__header--is-active')).toBe(true);

      this.setScopeProp('orgDropdownIsShown', false);
      this.expectDropdownVisibility(false);
      expect($sidePanelHeader.hasClass('nav-sidepanel__header--is-active')).toBe(false);
    });

    describe('Sidepanel header', function () {
      beforeEach(function () {
        this.$sidePanelHeader = this.$sidePanel.find('.nav-sidepanel__header');
        this.$orgList = this.$sidePanel.find('.nav-sidepanel__org-list');
      });

      it('shows two letter org name', function () {
        const $twoLetterOrgName = this.$sidePanelHeader.find('.nav-sidepanel__org-img');
        const org = this.orgs[1];

        this.setScopeProp('currOrg', org);
        expect($twoLetterOrgName.text()).toBe(org.name.slice(0, 2).toUpperCase());
      });

      it('shows current org in the org header', function () {
        const $orgName = this.$sidePanelHeader.find('.nav-sidepanel__org-selector > div > p:last');
        const org = this.orgs[2];

        this.setScopeProp('currOrg', org);
        expect($orgName.text()).toBe(org.name);
      });

      it('uses orgs for org list in org list dropdown', function () {
        const $orgs = this.$orgList.find('.nav-sidepanel__org-name');

        expect($orgs.length).toEqual(this.orgs.length);
        this.orgs.forEach((org, i) => expect($($orgs[i]).text()).toBe(org.name));
      });
    });

    describe('Spaces list', function () {
      beforeEach(function () {
        this.$spacesContainer = this.$sidePanel.find('.nav-sidepanel__spaces-container');
        this.updateOrgAndPerm = function (org, perm) {
          accessChecker.canCreateSpaceInOrganization = sinon.stub().returns(perm);
          this.$scope.setCurrOrg(org);
          this.$scope.$apply(); // run the watchers
        };
        this.assertCreateSpaceOnPerm = function (org, perm) {
          this.updateOrgAndPerm(org, perm);

          const $addSpaceLink = this.$spacesContainer.find('.nav-sidepanel__spaces-header > .text-link');
          expect(!!$addSpaceLink.get(0)).toBe(perm);
        };
      });

      it('shows spaces for current org', function () {
        const org = this.orgs[2];

        this.setScopeProp('currOrg', org);

        const $spaces = this.$spacesContainer.find('.nav-sidepanel__space-name');

        this.spacesByOrg[org.sys.id].forEach((space, i) => expect($($spaces[i]).text()).toBe(space.data.name));
      });

      it('marks current space as active', function () {
        const org = this.orgs[2];
        const space = this.spacesByOrg[org.sys.id][1].data;

        this.$scope.setCurrOrg(org);
        this.$scope.setAndGotoSpace(space);
        this.emulateSpacePage(space, org);
        this.$scope.$apply();

        const $space = this.$spacesContainer.find('.nav-sidepanel__space-name:nth-child(2)');

        expect($space.hasClass('nav-sidepanel__space-name--is-active')).toBe(true);
      });

      it('toggles create space action based on user permissions', function () {
        this.assertCreateSpaceOnPerm(this.orgs[2], true);
        this.assertCreateSpaceOnPerm(this.orgs[0], false);
      });

      it('shows correct advice', function () {
        let $advice;
        // canCreateSpaceInCurrOrg
        this.updateOrgAndPerm(this.orgs[1], false); // no spaces, no perm
        $advice = this.$spacesContainer.find('.nav-sidepanel__no-spaces > p:first');
        expect($advice.text()).toEqual('Uh oh! Nothing to see here');
        this.updateOrgAndPerm(this.orgs[0], true); // need to switch orgs for the watchers to trigger for the switch to org[1] below
        this.updateOrgAndPerm(this.orgs[1], true); // no spaces, no perm
        $advice = this.$spacesContainer.find('.nav-sidepanel__no-spaces > p:first');
        expect($advice.text()).toEqual('Let’s go - create your first space!');
      });
    });

    describe('Org settings panel', function () {
      beforeEach(function () {
        this.updateOrgAndPerm = function (org, perm) {
          OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(perm);
          this.emulateSettingsPage(org);
          this.$scope.$apply(); // run the watchers
        };
      });
      it('toggles goto org settings action based on user permissions', function () {
        let $orgSettings;

        // canGotoOrgSettings
        this.updateOrgAndPerm(this.orgs[2], false);
        $orgSettings = this.$sidePanel.find('.nav-sidepanel__org-actions');
        expect(!!$orgSettings.get(0)).toBe(false);
        this.updateOrgAndPerm(this.orgs[0], true);
        $orgSettings = this.$sidePanel.find('.nav-sidepanel__org-actions');
        expect(!!$orgSettings.get(0)).toBe(true);
      });
      it('toggles goto org settings action activation based on whether is user is viewing org settings currently', function () {
        this.updateOrgAndPerm(this.orgs[2], true);
        const $orgSettingsAction = this.$sidePanel.find('.nav-sidepanel__org-actions-goto-settings');
        expect($orgSettingsAction.hasClass('nav-sidepanel__org-actions-goto-settings--is-active')).toBe(true);
      });
    });

    describe('Close button', function () {
      it('should close side panel if open', function () {
        const $closeBtn = this.$sidePanel.find('.nav-sidepanel__close-btn');
        this.$scope.$apply();
        this.expectSidePanelVisibility(true);
        $closeBtn.click();
        this.expectSidePanelVisibility(false);
      });
    });
  });
});

function expectVisibility (element, shownClass, hiddenClass) {
  return function (isVisible) {
    expect(element.hasClass(hiddenClass)).toBe(!isVisible);
    expect(element.hasClass(shownClass)).toBe(isVisible);
  };
}
