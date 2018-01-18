import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';
import * as DOM from 'helpers/DOM';

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
        name: 'test-space-1-1', sys: {id: 'test-space-id-1-1'}
      }],
      'test-org-id-2': [],
      'test-org-id-3': [{
        name: 'test-space-3-1', sys: {id: 'test-space-id-3-1'}
      }, {
        name: 'test-space-3-2', sys: {id: 'test-space-id-3-2'}
      }]
    };
    this.tokenStore = this.$inject('services/TokenStore');
    this.tokenStore.organizations$ = K.createMockProperty(this.orgs);
    this.tokenStore.spacesByOrganization$ = K.createMockProperty(this.spacesByOrg);

    // TODO abstract this into DOM helper
    this.container = DOM.createUI($('<div class=client>').get(0));
    $(this.container.element).appendTo('body');
    this.$scope = this.$inject('$rootScope').$new();

    const element = this.$compileWith('<cf-nav-sidepanel is-shown="isShown" />', ($scope) => {
      this.$scope = $scope;
    });
    element.appendTo(this.container.element);

    this.$flush();
  });

  afterEach(function () {
    // reset stubs
    accessChecker.canCreateSpaceInOrganization.reset();
    accessChecker.canCreateOrganization.reset();
    OrganizationRoles.isOwnerOrAdmin.reset();
    Navigator.go.reset();
    navState$.set(new NavStates.Default());

    // Destroy UI
    this.container.destroy();
  });

  it('opens sidepanel', function () {
    const sidepanel = this.container.find('sidepanel');

    sidepanel.assertNotVisible();
    this.$scope.isShown = true;
    this.$apply();
    sidepanel.assertIsVisible();
  });

  it('closes sidepanel via click', function () {
    const sidepanel = this.container.find('sidepanel');
    const sidepanelCloseButton = this.container.find('sidepanel-close-btn');

    // Open sidepanel
    this.$scope.isShown = true;
    this.$apply();
    // Close sidepanel via click
    sidepanelCloseButton.click();
    this.$apply();
    sidepanel.assertNotVisible();
  });

  it('toggles org dropdown', function () {
    const sidepanelHeader = this.container.find('sidepanel-header');
    const orgsDropdown = this.container.find('sidepanel-org-list');
    const orgsDropdownActiveClass = 'nav-sidepanel__org-list-container--is-visible';

    // Ensure sidepanel is open
    this.$scope.isShown = true;
    this.$apply();
    // Ensure orgs dropdown is inactive
    expect(orgsDropdown.element.classList.contains(orgsDropdownActiveClass)).toEqual(false);
    // Open orgs dropdown
    sidepanelHeader.click();
    this.$apply();
    expect(orgsDropdown.element.classList.contains(orgsDropdownActiveClass)).toEqual(true);
    // Close orgs dropdown
    sidepanelHeader.click();
    this.$apply();
    expect(orgsDropdown.element.classList.contains(orgsDropdownActiveClass)).toEqual(false);
  });

  it('allows user to switch orgs', function () {
    const sidepanelHeader = this.container.find('sidepanel-header');
    const orgLink = this.container.find('sidepanel-org-link-2');
    const currentOrg = this.container.find('sidepanel-header-curr-org');

    // Ensure sidepanel is open
    this.$scope.isShown = true;
    this.$apply();
    // Open orgs dropdown
    sidepanelHeader.click();
    this.$apply();
    // Switch org
    orgLink.click();
    this.$apply();
    currentOrg.assertHasText('test-org-3');
    // Check org contains expected spaces
    this.container.find('sidepanel-space-link-0').assertHasText('test-space-3-1');
    this.container.find('sidepanel-space-link-1').assertHasText('test-space-3-2');
  });

  it('calls navigator when switching spaces', function () {
    const spaceLink = this.container.find('sidepanel-space-link-0');

    // Open sidepanel
    this.$scope.isShown = true;
    this.$apply();
    // Switch space
    spaceLink.click();
    this.$apply();

    sinon.assert.calledWith(Navigator.go, {
      path: ['spaces', 'detail'],
      params: { spaceId: 'test-space-id-1-1' },
      options: { reload: true }
    });
  });

  it('renders org icon with correct initials', function () {
    const orgIcon = this.container.find('sidepanel-header-org-icon');

    // Open sidepanel
    this.$scope.isShown = true;
    this.$apply();
    // Check value of org icon
    orgIcon.assertHasText('TE');
  });
});
