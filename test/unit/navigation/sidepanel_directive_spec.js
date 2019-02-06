import * as sinon from 'test/helpers/sinon';
import * as K from 'test/helpers/mocks/kefir';
import * as DOM from 'test/helpers/DOM';
import $ from 'jquery';

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
    can: sinon
      .stub()
      .withArgs('manage', 'Environment')
      .returns(true)
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

  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('services/CreateSpace.es6', CreateSpace);
      $provide.value('states/Navigator.es6', Navigator);
      $provide.value('access_control/AccessChecker/index.es6', accessChecker);
      $provide.value('services/OrganizationRoles.es6', OrganizationRoles);
      $provide.value('utils/LaunchDarkly/index.es6', { onFeatureFlag: sinon.stub() });
      $provide.value('data/EndpointFactory.es6', { createSpaceEndpoint: sinon.stub() });
      $provide.value('data/CMA/SpaceEnvironmentsRepo.es6', { create: () => environmentsRepo });
      $provide.value('data/CMA/FeatureCatalog.es6', { getOrgFeature: () => sinon.stub() });
    });

    const NavState = this.$inject('navigation/NavState.es6');
    NavState.navState$ = navState$;
    NavStates = NavState.NavStates;
    navState$.set(NavStates.Default());

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

    this.init = (testEnvironments = false) => {
      const rewrittenSpaces = Object.keys(spacesByOrg).reduce((acc, orgId) => {
        return Object.assign(acc, {
          [orgId]: spacesByOrg[orgId].map(space => {
            return Object.assign({ spaceMembership: { admin: testEnvironments } }, space);
          })
        });
      }, {});

      const tokenStore = this.$inject('services/TokenStore.es6');
      tokenStore.organizations$ = K.createMockProperty(orgs);
      tokenStore.spacesByOrganization$ = K.createMockProperty(rewrittenSpaces);

      this.$inject('utils/LaunchDarkly/index.es6').onFeatureFlag.callsFake((_1, _2, cb) =>
        cb(testEnvironments)
      );

      // TODO abstract this into DOM helper
      const container = DOM.createUI($('<div class=client>').get(0));
      $(container.element).appendTo('body');

      let $scope;
      const element = this.$compileWith('<cf-nav-sidepanel is-shown="isShown" />', _$scope => {
        $scope = _$scope;
      });

      element.appendTo(container.element);

      this.$flush();

      $scope.isShown = true;
      this.$apply();

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

  it('opens/closes sidepanel', function() {
    const [container, $scope] = this.init();
    const sidepanel = container.find('sidepanel');

    $scope.isShown = false;
    this.$apply();
    sidepanel.assertNotVisible();
    $scope.isShown = true;
    this.$apply();
    sidepanel.assertIsVisible();

    container.destroy();
  });

  it('closes sidepanel via click', function() {
    const [container] = this.init();
    const sidepanel = container.find('sidepanel');
    const sidepanelCloseButton = container.find('sidepanel-close-btn');

    // Close sidepanel via click
    sidepanelCloseButton.click();
    this.$apply();
    sidepanel.assertNotVisible();

    container.destroy();
  });

  it('toggles org dropdown', function() {
    const [container] = this.init();
    const sidepanelHeader = container.find('sidepanel-header');
    const orgsDropdown = container.find('sidepanel-org-list');
    const orgsDropdownActiveClass = 'nav-sidepanel__org-list-container--is-visible';

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

    container.destroy();
  });

  it('allows user to switch orgs', function() {
    const [container] = this.init(true);
    const sidepanelHeader = container.find('sidepanel-header');
    const orgLink = container.find('sidepanel-org-link-2');
    const currentOrg = container.find('sidepanel-header-curr-org');

    // Open orgs dropdown
    sidepanelHeader.click();
    this.$apply();
    // Switch org
    orgLink.click();
    this.$apply();
    currentOrg.assertHasText('test-org-3');
    // Check org contains expected spaces
    container.find('sidepanel-space-link-0').assertHasText('test-space-3-1');
    container.find('sidepanel-space-link-1').assertHasText('test-space-3-2');

    container.destroy();
  });

  it('calls navigator when switching spaces', function() {
    const [container] = this.init();
    const spaceLink = container.find('sidepanel-space-link-0');

    // Switch space
    spaceLink.click();
    this.$apply();

    sinon.assert.calledWith(Navigator.go, {
      path: ['spaces', 'detail'],
      params: { spaceId: 'test-space-id-1-1', environmentId: undefined },
      options: { reload: true }
    });

    container.destroy();
  });

  it('renders org icon with correct initials', function() {
    const [container] = this.init();
    const orgIcon = container.find('sidepanel-header-org-icon');

    orgIcon.assertHasText('TE');

    container.destroy();
  });

  it('fetches environments for admins', function() {
    const [container] = this.init(true);
    const spaceLink = container.find('sidepanel-space-link-0');
    const createSpaceEndpoint = this.$inject('data/EndpointFactory.es6').createSpaceEndpoint;
    const repo = this.$inject('data/CMA/SpaceEnvironmentsRepo.es6').create();

    spaceLink.click();
    this.$apply();

    // path: '/spaces/test-space-id-1-1/environments',
    sinon.assert.calledWith(createSpaceEndpoint, 'test-space-id-1-1');
    sinon.assert.calledOnce(repo.getAll);

    container.destroy();
  });
});
