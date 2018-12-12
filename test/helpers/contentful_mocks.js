import createLaunchDarklyMock from './mocks/LaunchDarkly';
import _ from 'lodash';

angular
  .module('contentful/init')
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
angular
  .module('contentful/mocks', [])

  .decorator('TheStore/ClientStorageWrapper.es6', [
    '$delegate',
    'mocks/TheStore/ClientStorageWrapper',
    ($delegate, mock) =>
      _.extend(
        {
          _noMock: $delegate
        },
        mock
      )
  ])

  .config([
    '$provide',
    '$controllerProvider',
    ($provide, $controllerProvider) => {
      $provide.value('$exceptionHandler', e => {
        throw e;
      });

      $provide.decorator('ReloadNotification', [
        '$delegate',
        $delegate => {
          // TODO firefox does not yet support for (const x in y)
          /* eslint prefer-const: off */
          for (let prop in $delegate) {
            sinon.stub($delegate, prop);
          }
          return $delegate;
        }
      ]);

      $provide.constant('@contentful/sharejs/lib/client', {
        Connection: sinon.stub().returns({
          socket: {},
          emit: _.noop,
          disconnect: _.noop
        })
      });

      $provide.provider('realLogger', ['loggerProvider', _.identity]);

      $provide.factory('logger', () => ({
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
      }));

      $provide.value('services/Filestack.es6', {
        makeDropPane: sinon.stub(),
        pick: sinon.stub(),
        pickMultiple: sinon.stub(),
        store: sinon.stub()
      });

      $provide.decorator('utils/LaunchDarkly', [
        '$delegate',
        '$q',
        ($delegate, $q) => {
          const mock = createLaunchDarklyMock($q);
          return {
            ...mock,
            _noMock: $delegate
          };
        }
      ]);

      $provide.stubDirective = (name, definition) => {
        $provide.factory(name + 'Directive', () => [
          _.extend(
            {
              name: name,
              restrict: 'A',
              priority: 0
            },
            definition
          )
        ]);
      };

      $provide.removeDirectives = function(...args) {
        _.flatten(args).forEach(directive => {
          const fullName = directive + 'Directive';
          $provide.factory(fullName, () => []);
        });
      };

      $provide.removeController = (label, fakeController) => {
        $controllerProvider.register(label, fakeController || angular.noop);
      };

      $provide.removeControllers = function(...args) {
        _.flatten(args).forEach(controller => {
          $controllerProvider.register(controller, angular.noop);
        });
      };

      $provide.stubFilter = (filterName, returnValue) => {
        $provide.value(filterName + 'Filter', () => returnValue || '');
      };

      $provide.makeStubs = function makeStubs(stubList) {
        if (!_.isArray(stubList)) stubList = _.flatten(arguments);
        const stubs = {};
        _.each(stubList, val => {
          stubs[val] = sinon.stub();
        });
        return stubs;
      };
    }
  ]);
