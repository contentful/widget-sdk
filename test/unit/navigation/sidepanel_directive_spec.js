import sinon from 'sinon';
import * as K from 'test/helpers/mocks/kefir';
import * as DOM from 'test/helpers/DOM';
import $ from 'jquery';
import {
  $initialize,
  $apply,
  $flush,
  $compileWith,
  $waitForControllerLoaded
} from 'test/helpers/helpers';

describe('cfNavSidepanel directive', () => {
  let NavStates;
  const navState$ = K.createMockProperty();

  const CreateSpace = {
    showDialog: sinon.stub()
  };

  const accessChecker = {
    canCreateSpaceInOrganization: sinon.stub(),
    canCreateOrganization: sinon.stub(),
    isInitialized$: K.createMockProperty(true),
    canAccessSpaceEnvironments: sinon.stub().returns(true)
  };

  const OrganizationRoles = {
    isOwnerOrAdmin: sinon.stub()
  };

  const Navigator = {
    go: sinon.stub().resolves()
  };

  const environmentsRepo = {
    getAll: sinon.stub().resolves([])
  };

  const TokenStore = {
    organizations$: K.createMockProperty(null),
    spacesByOrganization$: K.createMockProperty(null)
  };

  const LD = {
    onFeatureFlag: sinon.stub()
  };

  const EndpointFactory = {
    createSpaceEndpoint: sinon.stub(),
    createOrganizationEndpoint: sinon.stub().returns(() => Promise.resolve({ sys: {} }))
  };

  beforeEach(async function() {
    this.system.set('services/CreateSpace.es6', CreateSpace);
    this.system.set('states/Navigator.es6', Navigator);
    this.system.set('access_control/AccessChecker/index.es6', accessChecker);
    this.system.set('services/OrganizationRoles.es6', OrganizationRoles);
    this.system.set('utils/LaunchDarkly/index.es6', { onFeatureFlag: sinon.stub() });
    this.system.set('data/EndpointFactory.es6', EndpointFactory);
    this.system.set('data/CMA/SpaceEnvironmentsRepo.es6', { create: () => environmentsRepo });

    this.system.set('services/TokenStore.es6', TokenStore);

    this.system.set('utils/LaunchDarkly/index.es6', LD);
    this.system.override('navigation/NavState.es6', {
      navState$
    });

    NavStates = (await this.system.import('navigation/NavState.es6')).NavStates;
    navState$.set(NavStates.Default());

    await $initialize(this.system);

    const orgs = [
      {
        name: 'test-org-1',
        sys: { id: 'test-org-id-1' }
      },
      {
        name: 'test-org-2',
        sys: { id: 'test-org-id-2' }
      },
      {
        name: 'test-org-3',
        sys: { id: 'test-org-id-3' }
      }
    ];

    const spacesByOrg = {
      'test-org-id-1': [
        {
          name: 'test-space-1-1',
          sys: { id: 'test-space-id-1-1' }
        }
      ],
      'test-org-id-2': [],
      'test-org-id-3': [
        {
          name: 'test-space-3-1',
          sys: { id: 'test-space-id-3-1' }
        },
        {
          name: 'test-space-3-2',
          sys: { id: 'test-space-id-3-2' }
        }
      ]
    };

    this.init = async (testEnvironments = false) => {
      const rewrittenSpaces = Object.keys(spacesByOrg).reduce((acc, orgId) => {
        return Object.assign(acc, {
          [orgId]: spacesByOrg[orgId].map(space => {
            return Object.assign({ spaceMember: { admin: testEnvironments } }, space);
          })
        });
      }, {});

      TokenStore.organizations$.set(orgs);
      TokenStore.spacesByOrganization$.set(rewrittenSpaces);

      LD.onFeatureFlag.callsFake((_1, _2, cb) => cb(testEnvironments));

      // TODO abstract this into DOM helper
      const container = DOM.createUI($('<div class=client>').get(0));
      $(container.element).appendTo('body');

      let $scope;
      const element = $compileWith('<cf-nav-sidepanel is-shown="isShown" />', _$scope => {
        $scope = _$scope;
      });

      await $waitForControllerLoaded(element.isolateScope());

      element.appendTo(container.element);

      $flush();

      $scope.isShown = true;
      $apply();

      return [container, $scope];
    };
  });

  afterEach(() => {
    // reset stubs
    accessChecker.canCreateSpaceInOrganization.reset();
    accessChecker.canCreateOrganization.reset();
    OrganizationRoles.isOwnerOrAdmin.reset();
    Navigator.go.reset();
    Navigator.go.resolves();
    navState$.set(new NavStates.Default());
  });

  it('opens/closes sidepanel', async function() {
    const [container, $scope] = await this.init();
    const sidepanel = container.find('sidepanel');

    $scope.isShown = false;
    $apply();
    sidepanel.assertNotVisible();
    $scope.isShown = true;
    $apply();
    sidepanel.assertIsVisible();

    container.destroy();
  });

  it('closes sidepanel via click', async function() {
    const [container] = await this.init();
    const sidepanel = container.find('sidepanel');
    const sidepanelCloseButton = container.find('sidepanel-close-btn');

    // Close sidepanel via click
    sidepanelCloseButton.click();
    $apply();
    sidepanel.assertNotVisible();

    container.destroy();
  });

  it('toggles org dropdown', async function() {
    const [container] = await this.init();
    const sidepanelHeader = container.find('sidepanel-header');
    const orgsDropdown = container.find('sidepanel-org-list');
    const orgsDropdownActiveClass = 'nav-sidepanel__org-list-container--is-visible';

    // Ensure orgs dropdown is inactive
    expect(orgsDropdown.element.classList.contains(orgsDropdownActiveClass)).toEqual(false);
    // Open orgs dropdown
    sidepanelHeader.click();
    $apply();
    expect(orgsDropdown.element.classList.contains(orgsDropdownActiveClass)).toEqual(true);
    // Close orgs dropdown
    sidepanelHeader.click();
    $apply();
    expect(orgsDropdown.element.classList.contains(orgsDropdownActiveClass)).toEqual(false);

    container.destroy();
  });

  it('allows user to switch orgs', async function() {
    const [container] = await this.init(true);
    const sidepanelHeader = container.find('sidepanel-header');
    const orgLink = container.find('sidepanel-org-link-2');
    const currentOrg = container.find('sidepanel-header-curr-org');

    // Open orgs dropdown
    sidepanelHeader.click();
    $apply();
    // Switch org
    orgLink.click();
    $apply();
    currentOrg.assertHasText('test-org-3');
    // Check org contains expected spaces
    container.find('sidepanel-space-link-0').assertHasText('test-space-3-1');
    container.find('sidepanel-space-link-1').assertHasText('test-space-3-2');

    container.destroy();
  });

  it('calls navigator when switching spaces', async function() {
    const [container] = await this.init();
    const spaceLink = container.find('sidepanel-space-link-0');

    // Switch space
    spaceLink.click();
    $apply();

    sinon.assert.calledWith(Navigator.go, {
      path: ['spaces', 'detail'],
      params: { spaceId: 'test-space-id-1-1', environmentId: undefined },
      options: { reload: true }
    });

    container.destroy();
  });

  it('renders org icon with correct initials', async function() {
    const [container] = await this.init();
    const orgIcon = container.find('sidepanel-header-org-icon');

    orgIcon.assertHasText('TE');

    container.destroy();
  });

  it('fetches environments for admins', async function() {
    const [container] = await this.init(true);
    const spaceLink = container.find('sidepanel-space-link-0');

    spaceLink.click();
    $apply();

    // path: '/spaces/test-space-id-1-1/environments',
    sinon.assert.calledWith(EndpointFactory.createSpaceEndpoint, 'test-space-id-1-1');
    sinon.assert.calledOnce(environmentsRepo.getAll);

    container.destroy();
  });
});
