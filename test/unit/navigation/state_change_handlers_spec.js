import * as sinon from 'helpers/sinon';
import * as K from 'helpers/mocks/kefir';

describe('navigation/stateChangeHandlers', () => {
  let logger;
  let $rootScope;
  let modalCloseStub;

  afterEach(() => {
    // Avoid memory leak
    logger = $rootScope = modalCloseStub = null;
  });

  beforeEach(function() {
    this.state = { go: sinon.stub() };
    this.spaceContext = {
      space: null,
      organization: null,
      purge: sinon.stub()
    };
    this.tokenStore = { getOrganization: sinon.stub().resolves({}) };
    modalCloseStub = sinon.stub();

    module('contentful/test', $provide => {
      $provide.value('$state', this.state);
      $provide.value('spaceContext', this.spaceContext);
      $provide.value('services/TokenStore.es6', this.tokenStore);
      $provide.value('logger', {});
      $provide.value('modalDialog', { closeAll: modalCloseStub });
      $provide.value('navigation/Breadcrumbs/History.es6', {
        default: {
          purge: sinon.stub()
        }
      });
    });

    $rootScope = this.$inject('$rootScope');
    logger = this.$inject('logger');
    const NavState = this.$inject('navigation/NavState.es6');
    this.NavStates = NavState.NavStates;
    this.navState$ = NavState.navState$;

    const stateChangeHandlers = this.$inject('navigation/stateChangeHandlers');
    stateChangeHandlers.setup();
  });

  describe('state change', () => {
    it('closes opened modal dialog', () => {
      $rootScope.$emit('$stateChangeStart', { name: 'page1' }, {}, { name: 'page2' }, {});
      sinon.assert.calledOnce(modalCloseStub);
    });
  });

  describe('error handling', () => {
    it('logs exceptions raised during routing', () => {
      logger.logException = sinon.stub();

      const error = new Error();
      $rootScope.$emit('$stateChangeError', {}, {}, {}, {}, error);
      sinon.assert.calledWith(logger.logException, error);
    });

    it('logs servers errors encountered during routing', () => {
      logger.logServerError = sinon.stub();

      const error = { statusCode: 500 };
      $rootScope.$emit('$stateChangeError', {}, {}, {}, {}, error);
      sinon.assert.called(logger.logServerError);
    });
  });

  describe('redirections', () => {
    it('does not close modals', () => {
      sinon.assert.notCalled(modalCloseStub);
    });

    it('redirects if `redirectTo` property is provided', function() {
      this.state.go.returns();
      const to = { name: 'spaces.detail.entries', redirectTo: 'spaces.detail.content_types' };
      $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      sinon.assert.calledWith(this.state.go, to.redirectTo, {}, { relative: to });
    });
  });

  describe('leave confirmation', () => {
    it('logs error when changing state during confirmation', function() {
      const logger = this.$inject('logger');
      logger.logError = sinon.stub();

      const $q = this.$inject('$q');
      const requestLeaveConfirmation = sinon.stub().returns($q.defer().promise);
      const from = {
        name: 'any',
        data: {
          dirty: true,
          requestLeaveConfirmation: requestLeaveConfirmation
        }
      };

      $rootScope.$emit('$stateChangeStart', {}, {}, from, {});
      $rootScope.$emit('$stateChangeStart', {}, {}, from, {});
      sinon.assert.calledWith(logger.logError, 'Change state during state change confirmation');
    });
  });

  describe('addToContext', () => {
    it('prevents transition when only "addToContext" has changed', () => {
      const change = $rootScope.$emit(
        '$stateChangeStart',
        { name: 'A' },
        { addToContext: true },
        { name: 'A' },
        { addToContext: false }
      );
      expect(change.defaultPrevented).toBe(true);
    });

    it('does not prevent transition when "addToContext" is missing', () => {
      const change = $rootScope.$emit(
        '$stateChangeStart',
        { name: 'A' },
        { other: true },
        { name: 'A' },
        { other: true }
      );
      expect(change.defaultPrevented).toBe(false);
    });

    it('does not prevent transition when name is different', () => {
      const change = $rootScope.$emit(
        '$stateChangeStart',
        { name: 'A' },
        { addToContext: true },
        { name: 'B' },
        { addToContext: false }
      );
      expect(change.defaultPrevented).toBe(false);
    });
  });

  describe('nav states', () => {
    beforeEach(function() {
      logger.leaveBreadcrumb = () => {};

      this.emitStateChange = function(stateName, params) {
        this.state.params = params;
        $rootScope.$emit('$stateChangeSuccess', { name: stateName }, params);
      };
      this.setSpaceContext = function(space, org) {
        this.spaceContext.space = { data: space };
        this.spaceContext.organization = org;
      };
      this.setOrgContext = function(org) {
        this.tokenStore.getOrganization.resolves(org);
      };
      this.expectNavState = function(state, props) {
        return Promise.resolve().then(() => {
          const off = K.onValue(this.navState$.changes(), currNavState => {
            expect(currNavState instanceof state).toBe(true);
            for (const prop in props) {
              expect(currNavState[prop]).toEqual(props[prop]);
            }
            off();
          });
        });
      };
    });

    it('starts with default state', function() {
      expect(K.getValue(this.navState$) instanceof this.NavStates.Default).toBe(true);
    });

    it('sets space state', function*() {
      const space = { sys: { id: 'test-space-1' } };
      const org = { sys: { id: 'test-org-1' } };
      this.setSpaceContext(space, org);
      this.emitStateChange('spaces.detail', { spaceId: space.sys.id });
      yield this.expectNavState(this.NavStates.Space, { space, org });
    });

    it('sets org settings state', function*() {
      const org = { sys: { id: 'test-org-1' } };
      this.setOrgContext(org);
      this.emitStateChange('account.organizations.detail', { orgId: org.sys.id });
      yield this.expectNavState(this.NavStates.OrgSettings, { org });
    });

    it('sets new org state', function*() {
      this.emitStateChange('account.organizations.new');
      yield this.expectNavState(this.NavStates.NewOrg);
    });

    it('sets user profile state', function*() {
      this.emitStateChange('account.profile');
      yield this.expectNavState(this.NavStates.UserProfile);
    });

    it('defaults to the Default state', function*() {
      this.emitStateChange('foo.bar');
      yield this.expectNavState(this.NavStates.Default);
    });
  });
});
