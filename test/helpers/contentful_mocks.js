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

      $provide.constant('@contentful/sharejs/lib/client', {
        Connection: sinon.stub().returns({
          socket: {},
          emit: _.noop,
          disconnect: _.noop
        })
      });

      $provide.value('services/Filestack.es6', {
        makeDropPane: sinon.stub(),
        pick: sinon.stub(),
        pickMultiple: sinon.stub(),
        store: sinon.stub()
      });

      $provide.decorator('utils/LaunchDarkly/index.es6', [
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
