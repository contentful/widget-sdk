import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('cfNavSidePanel directive', () => {
  let $stateParamsOrgId = '';
  const $stateParams = Object.defineProperty({}, 'orgId', {
    get () {
      return $stateParamsOrgId;
    }
  });

  const CreateSpace = {
    showDialog: sinon.stub()
  };

  const spaceContext = {
    getData: sinon.stub()

  };
  const accessChecker = {
    canCreateSpaceInOrganization: sinon.stub()
  };

  const OrganizationRoles = {
    isOwnerOrAdmin: sinon.stub()
  };

  const Navigator = {
    go: sinon.stub()
  };

  const LaunchDarkly = {
    setOnScope: sinon.stub()
  };

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      // stub $stateParams
      $provide.value('$stateParams', $stateParams);
      $provide.value('services/CreateSpace', CreateSpace);
      $provide.value('states/Navigator', Navigator);
      $provide.value('spaceContext', spaceContext);
      $provide.value('accessChecker', accessChecker);
      $provide.value('services/OrganizationRoles', OrganizationRoles);
      $provide.value('utils/LaunchDarkly', LaunchDarkly);
    });

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
    const $rootEl = this.$compile('<cf-nav-side-panel />');

    this.$containerEl = $rootEl.find('.nav-sidepanel-container');
    this.$sidePanel = $rootEl.find('.nav-sidepanel');
    this.$scope = $rootEl.isolateScope();

    // helper methods
    this.setScopeProp = function (prop, value) {
      this.$scope[prop] = value;
      this.$apply();
    };

    this.verifyScopePropsBasedOnOrg = function (org, isOwnerOrAdmin, canCreateSpaceInOrg, viewingOrgSettings) {
      expect(this.$scope.canGotoOrgSettings).toEqual(isOwnerOrAdmin);
      expect(this.$scope.canCreateSpaceInCurrOrg).toEqual(canCreateSpaceInOrg);
      expect(this.$scope.twoLetterOrgName).toEqual(org.name.slice(0, 2).toUpperCase());
      expect(this.$scope.viewingOrgSettings).toEqual(viewingOrgSettings);
    };
  });

  afterEach(function () {
    // reset stub call counts
    spaceContext.getData.reset();
    accessChecker.canCreateSpaceInOrganization.reset();
    OrganizationRoles.isOwnerOrAdmin.reset();
    Navigator.go.reset();

    // reset $spaceParams.orgId
    $stateParamsOrgId = '';

    // delete space data
    delete spaceContext.space;
  });

  it('derives properties from currOrg', function () {
    const org = this.orgs[2];

    OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(true);
    accessChecker.canCreateSpaceInOrganization = sinon.stub().returns(true);

    this.$scope.setCurrOrg(org);
    $stateParamsOrgId = org.sys.id; // to emulate user on org settings page
    this.$scope.$apply();
    this.verifyScopePropsBasedOnOrg(org, true, true, true);
  });

  it('grabs orgs from the organizatons$ stream', function () {
    expect(this.$scope.orgs).toEqual(this.orgs);
    expect(this.$sidePanel.find('.nav-sidepanel__org-name').length).toEqual(3);
  });

  it('grabs spaces by org from spacesByOrg$ stream', function () {
    expect(this.$scope.spacesByOrg).toEqual(this.spacesByOrg);
  });

  it('it sets curr org based on commit logic', function () {
    // prefer org id in stateParams over all
    $stateParamsOrgId = 'test-org-id-2';
    this.$scope.$digest();
    expect(this.$scope.currOrg).toEqual(this.orgs[1]);

    // else choose org of current space
    $stateParamsOrgId = '';
    spaceContext.organizationContext = {
      organization: this.orgs[2]
    };
    this.$scope.$digest();
    expect(this.$scope.currOrg).toEqual(this.orgs[2]);

    // else choose first org from list of orgs
    $stateParamsOrgId = '';
    spaceContext.organizationContext = null;
    this.$scope.$digest();
    expect(this.$scope.currOrg).toEqual(this.orgs[0]);
  });

  it('updates viewingOrgSettings flag based on curr org id and org id in url', function () {
    const orgId = 'test-org-id-2';

    $stateParamsOrgId = orgId;
    this.$scope.currOrg = this.orgs[1];
    this.$scope.$digest();
    expect(this.$scope.viewingOrgSettings).toEqual(true);

    $stateParamsOrgId = 1;
    this.$scope.$digest();
    expect(this.$scope.viewingOrgSettings).toEqual(false);
  });

  it('updates curr space based on space context', function () {
    expect(this.$scope.currSpace).toEqual(undefined);
    spaceContext.space = {
      data: {name: 'test-space-1-1', sys: {id: 'test-space-id-1-1'}}
    };
    this.$scope.$apply();
    expect(this.$scope.currSpace).toEqual(spaceContext.space.data);
  });

  describe('#toggleSidePanel', function () {
    it('toggles sidepanel visibility based on a property on scope', function () {
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(false);
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(true);
      this.$scope.orgDropdownIsShown = true;
      this.$scope.toggleSidePanel();
      this.$scope.$apply();
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(true);
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(false);
      expect(this.$scope.orgDropdownIsShown).toBe(false);
    });
    it('hides org list dropdown', function () {
      const $dropdownContainer = this.$sidePanel.find('.nav-sidepanel__org-list-container');

      this.$scope.toggleOrgsDropdown();
      this.$scope.$apply();
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-visible')).toBe(true);
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-not-visible')).toBe(false);

      this.$scope.toggleSidePanel();
      this.$scope.$apply();
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-visible')).toBe(false);
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-not-visible')).toBe(true);
    });
  });

  describe('#toggleOrgsDropdown', function () {
    it('toggles org dropdown visibility based on a property on scope', function () {
      const $dropdownContainer = this.$sidePanel.find('.nav-sidepanel__org-list-container');

      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-visible')).toBe(false);
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-not-visible')).toBe(true);
      this.$scope.toggleOrgsDropdown();
      this.$apply();
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-visible')).toBe(true);
      expect($dropdownContainer.hasClass('nav-sidepanel__org-list-container--is-not-visible')).toBe(false);
    });
  });

  describe('#setCurrOrg', function () {
    it('sets curr org to the argument given to setCurrOrg method', function () {
      expect(this.$scope.currOrg).toEqual(this.orgs[0]);
      this.verifyScopePropsBasedOnOrg(this.orgs[0], undefined, undefined, false);

      OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(true);
      accessChecker.canCreateSpaceInOrganization = sinon.stub().returns(true);
      this.$scope.setCurrOrg(this.orgs[2]);
      this.$scope.$apply();
      expect(this.$scope.currOrg).toEqual(this.orgs[2]);
      this.verifyScopePropsBasedOnOrg(this.orgs[2], true, true, false);
    });
  });

  describe('#gotoOrgSettings', function () {
    beforeEach(function () {
      this.testNav = function (org, isOwnerOrAdmin, canCreateSpaceInOrg) {
        const orgId = org.sys.id;

        // default selected org is the first one
        expect(this.$scope.currOrg).toEqual(this.orgs[0]);
        this.verifyScopePropsBasedOnOrg(this.orgs[0], undefined, undefined, false);

        // toggle sidepanel, toggle org dropdown
        this.$scope.toggleSidePanel();
        this.$scope.toggleOrgsDropdown();
        expect(this.$scope.sidePanelIsShown).toBe(true);
        expect(this.$scope.orgDropdownIsShown).toBe(true);

        // setup stub return values to be tested in the verify method
        OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(isOwnerOrAdmin);
        accessChecker.canCreateSpaceInOrganization = sinon.stub().returns(canCreateSpaceInOrg);
        // choose new org and go to org settings
        this.$scope.setCurrOrg(org);
        this.$scope.gotoOrgSettings();
        $stateParamsOrgId = orgId; // to fake that we are on org settings page for current org
        this.$scope.$apply();
        expect(this.$scope.sidePanelIsShown).toBe(false);
        expect(this.$scope.orgDropdownIsShown).toBe(false);
        this.verifyScopePropsBasedOnOrg(org, isOwnerOrAdmin, canCreateSpaceInOrg, true);
      };
    });
    it('navigates to subscription page for the current org, hides the sidepanel and sets navigated to org as curr org if user is allowed', function () {
      this.testNav(this.orgs[1], true, true);
      sinon.assert.calledOnce(Navigator.go);
    });
    it('does not navigate if the user does not have permission to view the settings page', function () {
      this.testNav(this.orgs[1], false, true);
      sinon.assert.notCalled(Navigator.go);
    });
  });

  describe('#createNewOrg', function () {
    it('it toggles sidepanel and navigates to create new org page', function () {
      this.$scope.toggleSidePanel();
      this.$scope.toggleOrgsDropdown();
      expect(this.$scope.sidePanelIsShown).toBe(true);
      expect(this.$scope.orgDropdownIsShown).toBe(true);

      this.$scope.createNewOrg();
      expect(this.$scope.sidePanelIsShown).toBe(false);
      expect(this.$scope.orgDropdownIsShown).toBe(false);
      sinon.assert.calledWith(Navigator.go, {
        path: ['account', 'organizations', 'new']
      });
    });
  });

  describe('#setAndGotoSpace', function () {
    it('navigates to given space and toggles the side panel', function () {
      const space = {
        sys: { id: 1234 }
      };

      this.$scope.toggleSidePanel();
      this.$scope.toggleOrgsDropdown();
      expect(this.$scope.sidePanelIsShown).toBe(true);
      expect(this.$scope.orgDropdownIsShown).toBe(true);

      this.$scope.setAndGotoSpace(space);
      this.$scope.$apply();
      expect(this.$scope.currSpace).toEqual(space);
      expect(this.$scope.sidePanelIsShown).toBe(false);
      expect(this.$scope.orgDropdownIsShown).toBe(false);
      sinon.assert.calledWith(Navigator.go, {
        path: ['spaces', 'detail'],
        params: { spaceId: space.sys.id }
      });
    });
  });

  describe('#showCreateSpaceModal', function () {
    it('shows create space modal for the given org id and toggles sidepanel', function () {
      this.$scope.toggleSidePanel();
      this.$scope.toggleOrgsDropdown();
      expect(this.$scope.sidePanelIsShown).toBe(true);
      expect(this.$scope.orgDropdownIsShown).toBe(true);

      this.$scope.showCreateSpaceModal(1);

      expect(this.$scope.sidePanelIsShown).toBe(false);
      expect(this.$scope.orgDropdownIsShown).toBe(false);
      sinon.assert.calledWith(CreateSpace.showDialog, 1);
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
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(true);
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(false);
      this.setScopeProp('sidePanelIsShown', false);
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(false);
      expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(true);
    });

    it('toggles org dropdown based on a flag', function () {
      const $orgContainer = this.$sidePanel.find('.nav-sidepanel__org-list-container');
      const $sidePanelHeader = this.$sidePanel.find('.nav-sidepanel__header');

      this.setScopeProp('orgDropdownIsShown', true);
      expect($orgContainer.hasClass('nav-sidepanel__org-list-container--is-visible')).toBe(true);
      expect($sidePanelHeader.hasClass('nav-sidepanel__header--is-active')).toBe(true);

      this.setScopeProp('orgDropdownIsShown', false);
      expect($orgContainer.hasClass('nav-sidepanel__org-list-container--is-not-visible')).toBe(true);
      expect($sidePanelHeader.hasClass('nav-sidepanel__header--is-active')).toBe(false);
    });

    describe('Sidepanel header', function () {
      beforeEach(function () {
        this.$sidePanelHeader = this.$sidePanel.find('.nav-sidepanel__header');
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
        const $orgs = this.$sidePanelHeader.find('.nav-sidepanel__org-name');

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
          $stateParamsOrgId = org.sys.id;
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

        this.$scope.setCurrOrg(org);
        $stateParamsOrgId = org.sys.id; // make current org "committed" or "selected"
        this.$scope.$apply();
        this.$scope.setAndGotoSpace(this.spacesByOrg[org.sys.id][1].data);
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
        this.updateOrgAndPerm = function (org, perm, viewingOrgSettings = false) {
          OrganizationRoles.isOwnerOrAdmin = sinon.stub().returns(perm);
          this.$scope.setCurrOrg(org);
          $stateParamsOrgId = viewingOrgSettings ? org.sys.id : null;
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
        let $orgSettingsAction;

        this.updateOrgAndPerm(this.orgs[2], true, true);
        $orgSettingsAction = this.$sidePanel.find('.nav-sidepanel__org-actions-goto-settings');
        expect($orgSettingsAction.hasClass('nav-sidepanel__org-actions-goto-settings--is-active')).toBe(true);

        this.updateOrgAndPerm(this.orgs[1], true, false);
        $orgSettingsAction = this.$sidePanel.find('.nav-sidepanel__org-actions-goto-settings');
        expect($orgSettingsAction.hasClass('nav-sidepanel__org-actions-goto-settings--is-active')).toBe(false);
      });
    });

    describe('Close button', function () {
      it('should close side panel if open', function () {
        const $closeBtn = this.$sidePanel.find('.nav-sidepanel__close-btn');

        expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(false);
        expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(true);
        this.$scope.toggleSidePanel();
        this.$scope.$apply();
        expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(true);
        expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(false);
        $closeBtn.click();
        expect(this.$sidePanel.hasClass('nav-sidepanel--slide-in')).toBe(false);
        expect(this.$sidePanel.hasClass('nav-sidepanel--slide-out')).toBe(true);
      });
    });
  });
});
