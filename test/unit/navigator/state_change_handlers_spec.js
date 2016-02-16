'use strict';

describe('navigation/stateChangeHandlers', function () {
  var logger;
  var $rootScope;
  var spaceTools;

  beforeEach(function () {
    spaceTools = {goToInitialSpace: sinon.stub()};

    module('cf.app', function ($provide) {
      $provide.value('$state', {});
      $provide.value('spaceTools', spaceTools);
      $provide.value('contextHistory');
      $provide.value('logger', {});
    });

    $rootScope = this.$inject('$rootScope');
    logger = this.$inject('logger');

    var setup = this.$inject('navigation/stateChangeHandlers').setup;
    setup();
  });

  describe('error handling', function () {

    it('logs exceptions raised during routing', function () {
      logger.logException = sinon.stub();

      var error = new Error();
      $rootScope.$emit('$stateChangeError', {}, {}, {}, {}, error);
      sinon.assert.calledWith(logger.logException, error);
    });

    it('logs servers errors encountered during routing', function () {
      logger.logServerError = sinon.stub();

      var error = {statusCode: 500};
      $rootScope.$emit('$stateChangeError', {}, {}, {}, {}, error);
      sinon.assert.called(logger.logServerError);
    });

  });

  describe('redirections', function () {
    var $state;

    beforeEach(function () {
      $state = this.$inject('$state');
      $state.go = sinon.stub();
    });

    it('redirects "spaces" to initial space', function () {
      var to = {name: 'spaces'};
      var change = $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.calledOnce(spaceTools.goToInitialSpace);
    });

    it('redirects "otherwise" to initial space', function () {
      var to = {name: 'otherwise'};
      var change = $rootScope.$emit('$stateChangeStart', to, {}, {}, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.calledOnce(spaceTools.goToInitialSpace);
    });

    it('redirects "spaces.detail" with missing id to initial space', function () {
      var to = {name: 'spaces.detail'};
      var toParams = {spaceId: null};
      var change = $rootScope.$emit('$stateChangeStart', to, toParams, {}, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.calledOnce(spaceTools.goToInitialSpace);
    });

    it('it does not request leave confirmation when redirecting', function () {
      var requestLeaveConfirmation = sinon.stub().rejects();
      var to = {name: 'otherwise'};
      var from = {
        data: {
          dirty: true,
          requestLeaveConfirmation: requestLeaveConfirmation
        }
      };
      var change = $rootScope.$emit('$stateChangeStart', to, {}, from, {});
      expect(change.defaultPrevented).toBe(true);
      sinon.assert.notCalled(requestLeaveConfirmation);
    });
  });
});
