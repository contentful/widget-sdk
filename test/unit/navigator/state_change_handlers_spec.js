'use strict';

describe('navigation/stateChangeHandlers', function () {
  let logger;
  let $rootScope;
  let modalCloseStub;

  beforeEach(function () {
    this.state = {go: sinon.stub()};
    modalCloseStub = sinon.stub();

    module('contentful/test', ($provide) => {
      $provide.value('$state', this.state);
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
    it('does not close modals', function () {
      sinon.assert.notCalled(modalCloseStub);
    });

    it('redirects if `redirectTo` property is provided', function () {
      this.state.go.returns();
      const to = {name: 'spaces.detail.entries', redirectTo: 'spaces.detail.content_types'};
      $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      sinon.assert.calledWith(this.state.go, to.redirectTo, {});
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
