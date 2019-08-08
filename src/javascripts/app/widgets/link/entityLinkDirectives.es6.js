import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import { caseofEq } from 'sum-types';
import tokens from '@contentful/forma-36-tokens';
import assetCardTemplateDef from 'app/widgets/link/AssetCardTemplate.es6';
import entityLinkTemplateDef from 'app/widgets/link/EntityLinkTemplate.es6';
import userLinkTemplateDef from 'app/widgets/link/UserLinkTemplate.es6';
import { makeEntityRef } from 'states/Navigator.es6';
import * as EntityState from 'data/CMA/EntityState.es6';

import * as Analytics from 'analytics/Analytics.es6';

export default function register() {
  /**
   * Creates a definition object for an entity link directive.
   * Entity link directives share both controller and an isolated
   * scope configuration, but differ in a template.
   */
  function createEntityLinkDirective(template) {
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
  }

  registerDirective('cfAssetCard', [() => createEntityLinkDirective(assetCardTemplateDef())]);

  registerDirective('cfEntityLink', [() => createEntityLinkDirective(entityLinkTemplateDef())]);

  registerDirective('cfUserLink', () => ({
    restrict: 'E',
    scope: {
      // user to be rendered:
      user: '<'
    },
    template: userLinkTemplateDef()
  }));

  registerController('EntityLinkController', [
    '$scope',
    $scope => {
      /**
       * Given an entity state we return
       */
      function entityStateColor(state) {
        return caseofEq(state, [
          [EntityState.State.Archived(), _.constant(tokens.colorRedLight)],
          [EntityState.State.Draft(), _.constant(tokens.colorOrangeLight)],
          [EntityState.State.Published(), _.constant(tokens.colorGreenLight)],
          [EntityState.State.Changed(), _.constant(tokens.colorBlueLight)]
        ]);
      }

      const data = $scope.entity;
      $scope.config = { ...($scope.config || {}) };
      $scope.actions = $scope.actions || {};
      $scope.onClick = $event => {
        if (!$scope.actions.edit) {
          return;
        }
        $event.preventDefault();
        $scope.actions.edit($event);
        Analytics.track('reference_editor_action:edit', {
          ctId: _.get($scope.entity, 'sys.contentType.sys.id')
        });
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

      const buildTagPropsFromState = entityState => {
        let children;
        let tagType;

        switch (entityState) {
          case 'archived':
            children = 'archived';
            tagType = 'negative';
            break;

          case 'changed':
            children = 'changed';
            tagType = 'primary';
            break;

          case 'published':
            children = 'published';
            tagType = 'positive';
            break;

          default:
            children = 'draft';
            tagType = 'warning';
        }

        return {
          children,
          tagType,
          'data-entity-state': entityState
        };
      };

      const getEntityState = () => {
        if ($scope.config.link) {
          // Despite using slide-in, we still need this for `href` having a
          // target, allowing us to open in a new tab.
          $scope.stateRef = makeEntityRef(data);
        }

        const state = EntityState.getState(data.sys);

        // We do not show the state indicator for published assets
        if (!(data.sys.type === 'Asset' && state === EntityState.State.Published())) {
          $scope.entityState = EntityState.stateName(state);
          $scope.tagProps = buildTagPropsFromState($scope.entityState);
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
}
