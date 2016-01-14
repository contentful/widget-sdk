'use strict';

describe('navigation/stateChangeHandlers', function () {
  var logger;
  var $rootScope;

  beforeEach(function () {
    var spaceTools = {goToInitialSpace: sinon.stub()};

    module('cf.app', function ($provide) {
      $provide.value('$state', {});
      $provide.value('spaceTools', spaceTools);
      $provide.value('contextHistory', {});
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
});
