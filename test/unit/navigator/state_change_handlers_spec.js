'use strict';

describe('navigation/stateChangeHandlers', function () {
  let logger;
  let $rootScope;
  let spaceTools;
  let modalCloseStub;

  beforeEach(function () {
    spaceTools = {goToInitialSpace: sinon.stub()};

    modalCloseStub = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.value('$state', {});
      $provide.value('spaceTools', spaceTools);
      $provide.value('contextHistory');
      $provide.value('logger', {});
      $provide.value('modalDialog', { closeAll: modalCloseStub });
      $provide.value('contextHistory', {purge: sinon.stub()});
    });

    $rootScope = this.$inject('$rootScope');
    logger = this.$inject('logger');

    const setup = this.$inject('navigation/stateChangeHandlers').setup;
    setup();
  });

  describe('state change', function () {
    it('closes opened modal dialog', function () {
      $rootScope.$emit('$stateChangeStart', {name: 'page1'}, {}, {name: 'page2'}, {});
      sinon.assert.calledOnce(modalCloseStub);
    });
  });

  describe('error handling', function () {

    it('logs exceptions raised during routing', function () {
      logger.logException = sinon.stub();

      const error = new Error();
      $rootScope.$emit('$stateChangeError', {}, {}, {}, {}, error);
      sinon.assert.calledWith(logger.logException, error);
    });

    it('logs servers errors encountered during routing', function () {
      logger.logServerError = sinon.stub();

      const error = {statusCode: 500};
      $rootScope.$emit('$stateChangeError', {}, {}, {}, {}, error);
      sinon.assert.called(logger.logServerError);
    });

  });

  describe('redirections', function () {
    let $state;

    beforeEach(function () {
      $state = this.$inject('$state');
      $state.go = sinon.stub();
    });

    it('redirects "spaces" to initial space', function () {
      const to = {name: 'spaces'};
      const change = $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.calledOnce(spaceTools.goToInitialSpace);
    });

    it('redirects "otherwise" to initial space', function () {
      const to = {name: 'otherwise'};
      const change = $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.calledOnce(spaceTools.goToInitialSpace);
    });

    it('redirects "spaces.detail" with missing id to initial space', function () {
      const to = {name: 'spaces.detail'};
      const toParams = {spaceId: null};
      const change = $rootScope.$emit('$stateChangeStart', to, toParams, {}, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.calledOnce(spaceTools.goToInitialSpace);
    });

    it('it does not request leave confirmation when redirecting', function () {
      const requestLeaveConfirmation = sinon.stub().rejects();
      const to = {name: 'otherwise'};
      const from = {
        data: {
          dirty: true,
          requestLeaveConfirmation: requestLeaveConfirmation
        }
      };
      const change = $rootScope.$emit('$stateChangeStart', to, {}, from, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.notCalled(requestLeaveConfirmation);
    });

    it('does not close modals', function () {
      sinon.assert.notCalled(modalCloseStub);
    });

    it('redirects if `redirectTo` property is provided', function () {
      $state.go.returns();
      const to = {name: 'spaces.detail.entries', redirectTo: 'spaces.detail.content_types'};
      $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      sinon.assert.calledWith($state.go, to.redirectTo, {});
    });

  });

  describe('leave confirmation', function () {
    it('logs error when changing state during confirmation', function () {
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

  describe('addToContext', function () {
    it('prevents transition when only "addToContext" has changed', function () {
      const change = $rootScope.$emit(
        '$stateChangeStart',
        {name: 'A'},
        {addToContext: true},
        {name: 'A'},
        {addToContext: false}
      );
      expect(change.defaultPrevented).toBe(true);
    });

    it('does not prevent transition when "addToContext" is missing', function () {
      const change = $rootScope.$emit(
        '$stateChangeStart',
        {name: 'A'},
        {other: true},
        {name: 'A'},
        {other: true}
      );
      expect(change.defaultPrevented).toBe(false);
    });

    it('does not prevent transition when name is different', function () {
      const change = $rootScope.$emit(
        '$stateChangeStart',
        {name: 'A'},
        {addToContext: true},
        {name: 'B'},
        {addToContext: false}
      );
      expect(change.defaultPrevented).toBe(false);
    });
  });
});
