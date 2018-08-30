'use strict';

angular
  .module('cf.app')

  /**
   * @ngdoc service
   * @module cf.app
   * @name createEntityLinkDirective
   * @description
   * Creates a definition object for an entity link directive.
   * Entity link directives share both controller and an isolated
   * scope configuration, but differ in a template.
   */
  .value('createEntityLinkDirective', template => {
    return {
      restrict: 'E',
      scope: {
        // entity to be rendered:
        entity: '<',
        // instance of entity helpers bound to a specific locale
        // TODO instead of passing the helpers object the 'entity' should
        // be a special purpose object with all the properties requested
        // from the helper. This object should be build by the user of
        // this directive.
        entityHelpers: '<',
        // collection of action functions
        // supported actions are:
        // - `remove()` If this function is defined, the directive adds
        //   a button with a cross icon that calls this function
        // - `edit()` If this function is defined, the directive adds
        //   a button with a pen icon that calls this function. Also
        //   clicking on any part of the entity link will call this
        //   function.
        actions: '<?',
        contentType: '<?',
        // object of visual configuration options
        // valid options are
        // - draggable
        // - largeImage: If true, show a 270px preview of an image asset
        // - showDetails:  Show description and thumbnail for entries
        // - disableTooltip
        // - link: Provide a link to entity editor. This has no effect if
        //   the 'edit' action is specified.
        config: '<'
      },
      controller: 'EntityLinkController',
      template: template
    };
  })

  .directive('cfAssetCard', [
    'require',
    'createEntityLinkDirective',
    (require, create) => {
      return create(require('app/widgets/link/AssetCardTemplate.es6').default());
    }
  ])

  .directive('cfEntityLink', [
    'require',
    'createEntityLinkDirective',
    (require, create) => {
      return create(require('app/widgets/link/EntityLinkTemplate.es6').default());
    }
  ])

  .directive('cfUserLink', [
    'require',
    require => {
      return {
        restrict: 'E',
        scope: {
          // user to be rendered:
          user: '<'
        },
        template: require('app/widgets/link/UserLinkTemplate.es6').default()
      };
    }
  ])

  .controller('EntityLinkController', [
    'require',
    '$scope',
    (require, $scope) => {
      const $state = require('$state');
      const makeEntityRef = require('states/Navigator.es6').makeEntityRef;
      const EntityState = require('data/CMA/EntityState.es6');
      const entityStateColor = require('Styles/Colors.es6').entityStateColor;
      const LD = require('utils/LaunchDarkly');
      const Analytics = require('analytics/Analytics.es6');
      const _ = require('lodash');

      const INLINE_REFERENCE_FEATURE_FLAG = 'feature-at-02-2018-inline-reference-field';
      const REFERENCE_CARD_REDESIGN_FEATURE_FLAG = 'feature-at-06-2018-reference-cards-redesign';

      LD.onFeatureFlag($scope, INLINE_REFERENCE_FEATURE_FLAG, isEnabled => {
        $scope.isInlineEditingEnabled = isEnabled;
      });

      LD.onFeatureFlag($scope, REFERENCE_CARD_REDESIGN_FEATURE_FLAG, isEnabled => {
        $scope.useRedesignedCardTemplate = isEnabled;
      });

      const data = $scope.entity;
      $scope.config = _.assign({}, $scope.config || {});
      $scope.actions = $scope.actions || {};
      $scope.onClick = $event => {
        if (!$scope.stateRef && !$scope.actions.edit) return;

        if (($scope.stateRef || $scope.actions.slideinEdit) && !$scope.actions.edit) {
          if ($scope.actions.slideinEdit) {
            // This will prevent navigating to the entry page
            // when clicking the ref link and open it inline instead.
            // This will still allow users to navigate to entry page
            // with right click + open in a new tab.
            $event.preventDefault();
            const eventData = $scope.actions.slideinEdit();
            Analytics.track('slide_in_editor:open', eventData);
            Analytics.track('reference_editor_action:edit', {
              ctId: _.get($scope.entity, 'sys.contentType.sys.id')
            });
          } else {
            // Control navigation to entry editor even if the link has
            // an href to prevent app reload and losing navigation history.
            $event.preventDefault();
            $state.go($scope.stateRef.path.join('.'), $scope.stateRef.params);
          }
        }

        if ($scope.actions.edit) {
          $scope.actions.edit($event);
          Analytics.track('reference_editor_action:edit', {
            ctId: _.get($scope.entity, 'sys.contentType.sys.id')
          });
          $scope.actions.trackEdit();
        }
      };

      if ($scope.config.largeImage) {
        $scope.config.imageSize = 270;
      } else {
        $scope.config.imageSize = 123;
      }

      // $scope.hasTooltip is true if the tooltip has not been disabled and if there
      // is content in the tooltip.
      $scope.$watch(
        () => {
          return (
            !$scope.config.disableTooltip &&
            ($scope.file || $scope.actions.remove || $scope.downloadUrl)
          );
        },
        hasTooltip => {
          $scope.hasTooltip = hasTooltip;
        }
      );
      if ($scope.contentType) {
        $scope.contentType.then(ct => {
          $scope.contentTypeName = _.get(ct, 'data.name');
        });
      }

      const get = (getter, scopeProperty, arg) => {
        return $scope.entityHelpers[getter](arg || data).then(value => {
          $scope[scopeProperty] = value;
          return value;
        });
      };

      const is = type => data.sys.type === type;

      const getBasicEntityInfo = () => {
        get('entityTitle', 'title');
      };

      const maybeGetEntryDetails = () => {
        if (is('Entry') && $scope.config.showDetails) {
          get('entityDescription', 'description');
          get('entryImage', 'image');
        }
      };

      const maybeGetAssetDetails = () => {
        if (is('Asset')) {
          get('assetFile', 'file').then(_.partial(get, 'assetFileUrl', 'downloadUrl'));
        }
      };

      const getEntityState = () => {
        if ($scope.config.link) {
          $scope.stateRef = makeEntityRef(data);
        }

        const state = EntityState.getState(data.sys);

        // We do not show the state indicator for published assets
        if (!(data.sys.type === 'Asset' && state === EntityState.State.Published())) {
          $scope.entityState = EntityState.stateName(state);
        }

        $scope.statusDotStyle = {
          backgroundColor: entityStateColor(state)
        };
      };

      if (data) {
        getBasicEntityInfo();
        getEntityState();
        maybeGetEntryDetails();
        maybeGetAssetDetails();
      } else {
        $scope.missing = true;
      }
    }
  ]);
