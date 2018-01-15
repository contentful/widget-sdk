'use strict';

angular.module('cf.ui')
// We do not load the file containing the icons. Therefore we need to
// create a dummy service.
.constant('icons', {});


/**
 * @ngdoc module
 * @name contentful/mocks
 * @description
 * This module provides mocks for business domain objects.
 *
 * Mocked objects include the API clients `Space`, `ContentType`,
 * `Entry` and `Asset` classes.
 */
angular.module('contentful/mocks', [])

.decorator('TheStore/ClientStorageWrapper', ['$delegate', 'mocks/TheStore/ClientStorageWrapper', function ($delegate, mock) {
  return _.extend({
    _noMock: $delegate
  }, mock);
}])

.config(['$provide', '$controllerProvider', function ($provide, $controllerProvider) {
  $provide.value('$exceptionHandler', function (e) {
    throw e;
  });

  $provide.decorator('ReloadNotification', ['$delegate', function ($delegate) {
    // TODO firefox does not yet support for (const x in y)
    /* eslint prefer-const: off */
    for (let prop in $delegate) {
      sinon.stub($delegate, prop);
    }
    return $delegate;
  }]);

  $provide.constant('libs/sharejs', {
    Connection: sinon.stub().returns({
      socket: {},
      emit: _.noop,
      disconnect: _.noop
    })
  });

  $provide.provider('realLogger', provider('logger'));
  $provide.provider('realFilepicker', provider('services/Filepicker'));

  $provide.factory('logger', function () {
    return {
      enable: sinon.stub(),
      disable: sinon.stub(),
      findActualServerError: sinon.stub(),
      logException: sinon.stub(),
      logError: sinon.stub(),
      logServerError: sinon.stub(),
      logServerWarn: sinon.stub(),
      logSharejsError: sinon.stub(),
      logSharejsWarn: sinon.stub(),
      logWarn: sinon.stub(),
      leaveBreadcrumb: sinon.stub(),
      log: sinon.stub()
    };
  });

  $provide.value('services/Filepicker', {
    makeDropPane: sinon.stub(),
    pick: sinon.stub(),
    pickMultiple: sinon.stub(),
    store: sinon.stub()
  });

  $provide.stubDirective = function (name, definition) {
    $provide.factory(name + 'Directive', function () {
      return [_.extend({
        name: name,
        restrict: 'A',
        priority: 0
      }, definition)];
    });
  };

  $provide.stubLaunchDarkly = function () {
    $provide.factory('utils/LaunchDarkly', function () {
      return {
        init: sinon.stub(),
        onABTest: sinon.stub(),
        onFeatureFlag: sinon.stub(),
        getCurrentVariation: sinon.stub()
      };
    });
  };

  $provide.removeDirectives = function () {
    _.flatten(arguments).forEach(function (directive) {
      const fullName = directive + 'Directive';
      $provide.factory(fullName, function () {
        return [];
      });
    });
  };

  $provide.removeController = function (label, fakeController) {
    $controllerProvider.register(label, fakeController || angular.noop);
  };

  $provide.removeControllers = function () {
    _.flatten(arguments).forEach(function (controller) {
      $controllerProvider.register(controller, angular.noop);
    });
  };

  $provide.stubFilter = function (filterName, returnValue) {
    $provide.value(filterName + 'Filter', function () {
      return returnValue || '';
    });
  };

  $provide.makeStubs = function makeStubs (stubList) {
    if (!_.isArray(stubList)) stubList = _.flatten(arguments);
    const stubs = {};
    _.each(stubList, function (val) {
      stubs[val] = sinon.stub();
    });
    return stubs;
  };

  function provider (name) {
    return [name + 'Provider', _.identity];
  }
}]);
