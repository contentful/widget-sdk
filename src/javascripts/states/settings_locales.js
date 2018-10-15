'use strict';

angular
  .module('contentful')

  /**
   * @ngdoc service
   * @name states/settings/locales
   */
  .factory('states/settings/locales', [
    'require',
    require => {
      var contextHistory = require('navigation/Breadcrumbs/History.es6').default;
      var crumbFactory = require('navigation/Breadcrumbs/Factory.es6');
      const ChangeSpaceService = require('services/ChangeSpaceService.es6');
      const Enforcements = require('access_control/Enforcements.es6');

      function localeEditorState(options, isNew) {
        return _.extend(
          {
            template: '<cf-locale-editor class="workbench" />',
            controller: [
              '$scope',
              '$stateParams',
              'locale',
              'spaceLocales',
              ($scope, $stateParams, locale, spaceLocales) => {
                $scope.context.isNew = isNew;
                $scope.locale = locale;
                $scope.spaceLocales = spaceLocales;

                contextHistory.set([
                  crumbFactory.LocaleList(),
                  crumbFactory.Locale($stateParams.localeId, $scope.context)
                ]);
              }
            ]
          },
          options
        );
      }

      // injecting `spaceContext` here to assure `TheLocaleStore.init` was called
      // TODO drop global `TheLocaleStore` in favour of a space-scoped service
      var resolveSpaceLocales = [
        'TheLocaleStore',
        'spaceContext',
        (TheLocaleStore, _sc) => TheLocaleStore.refresh()
      ];

      var newLocale = localeEditorState(
        {
          name: 'new',
          url: '_new',
          resolve: {
            spaceLocales: resolveSpaceLocales,
            locale: function() {
              return {
                sys: {},
                code: null,
                fallbackCode: null,
                contentDeliveryApi: true,
                contentManagementApi: true
              };
            }
          }
        },
        true
      );

      var detail = localeEditorState(
        {
          name: 'detail',
          url: '/:localeId',
          resolve: {
            spaceLocales: resolveSpaceLocales,
            locale: [
              'spaceLocales',
              '$stateParams',
              (spaceLocales, $stateParams) => {
                var id = $stateParams.localeId;
                var found = _.find(spaceLocales, { sys: { id: id } });

                if (found) {
                  return _.cloneDeep(found);
                } else {
                  throw new Error('No locale with ID ' + id + ' found.');
                }
              }
            ]
          }
        },
        false
      );

      return {
        name: 'locales',
        url: '/locales',
        abstract: true,
        children: [
          {
            name: 'list',
            url: '',
            template:
              '<react-component name="app/settings/locales/routes/LocalesListRoute.es6" props="props" />',
            controller: [
              '$scope',
              'spaceContext',
              ($scope, spaceContext) => {
                $scope.props = {
                  showUpgradeSpaceDialog: ({ onSubmit }) => {
                    ChangeSpaceService.showDialog({
                      organizationId: spaceContext.organization.sys.id,
                      space: spaceContext.space.data,
                      action: 'change',
                      scope: 'space',
                      onSubmit
                    });
                  },
                  getComputeLocalesUsageForOrganization: () => {
                    return Enforcements.computeUsageForOrganization(
                      spaceContext.organization,
                      'locale'
                    );
                  }
                };
              }
            ]
          },
          newLocale,
          detail
        ]
      };
    }
  ]);
