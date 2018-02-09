'use strict';

angular.module('cf.app')

/**
 * @ngdoc service
 * @module cf.app
 * @name createEntityLinkDirective
 * @description
 * Creates a definition object for an entity link directive.
 * Entity link directives share both controller and an isolated
 * scope configuration, but differ in a template.
 */
.value('createEntityLinkDirective', function (template) {
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

.directive('cfAssetCard', ['require', 'createEntityLinkDirective', function (require, create) {
  return create(require('app/widgets/link/AssetCardTemplate').default());
}])

.directive('cfEntityLink', ['require', 'createEntityLinkDirective', function (require, create) {
  return create(require('app/widgets/link/EntityLinkTemplate').default());
}])

.directive('cfUserLink', ['require', function (require) {
  return {
    restrict: 'E',
    scope: {
      // user to be rendered:
      user: '<'
    },
    template: require('app/widgets/link/UserLinkTemplate').default()
  };
}])

.controller('EntityLinkController', ['require', '$scope', function (require, $scope) {
  var makeEntityRef = require('states/Navigator').makeEntityRef;
  var EntityState = require('data/CMA/EntityState');
  var entityStateColor = require('Styles/Colors').entityStateColor;
  var LD = require('utils/LaunchDarkly');

  var INLINE_REFERENCE_FEATURE_FLAG = 'feature-at-02-2018-inline-reference-field';

  LD.onFeatureFlag($scope, INLINE_REFERENCE_FEATURE_FLAG, function (isEnabled) {
    $scope.isInlineEditingEnabled = isEnabled;
  });

  var data = $scope.entity;
  $scope.config = _.assign({}, $scope.config || {});
  $scope.actions = $scope.actions || {};
  $scope.onClick = function ($event) {
    var slidingEntryEditor = $scope.actions.slideinEdit;

    if (slidingEntryEditor) {
      // This will prevent navigating to the entry page
      // when clicking the ref link and open it inline instead.
      // This will still allow users to navigate to entry page
      // with right click + open in a new tab.
      $event.preventDefault();
      $scope.actions.slideinEdit();
    } else {
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
  $scope.$watch(function () {
    return !$scope.config.disableTooltip && (
      $scope.file ||
      $scope.actions.remove ||
      $scope.downloadUrl
    );
  }, function (hasTooltip) {
    $scope.hasTooltip = hasTooltip;
  });
  if ($scope.contentType) {
    $scope.contentType.then(function (ct) {
      $scope.contentTypeName = _.get(ct, 'data.name');
    });
  }

  if (data) {
    getBasicEntityInfo();
    getEntityState();
    maybeGetEntryDetails();
    maybeGetAssetDetails();
  } else {
    $scope.missing = true;
  }

  function getBasicEntityInfo () {
    get('entityTitle', 'title');
  }

  function maybeGetEntryDetails () {
    if (is('Entry') && $scope.config.showDetails) {
      get('entityDescription', 'description');
      get('entryImage', 'image');
    }
  }

  function maybeGetAssetDetails () {
    if (is('Asset')) {
      get('assetFile', 'file')
      .then(_.partial(get, 'assetFileUrl', 'downloadUrl'));
    }
  }

  function getEntityState () {
    if ($scope.config.link && !$scope.actions.edit) {
      $scope.stateRef = makeEntityRef(data);
    }
    var state = EntityState.getState(data.sys);

    // We do not show the state indicator for published assets
    if (!(data.sys.type === 'Asset' && state === EntityState.State.Published())) {
      $scope.entityState = EntityState.stateName(state);
    }

    $scope.statusDotStyle = {
      backgroundColor: entityStateColor(state)
    };
  }

  function get (getter, scopeProperty, arg) {
    return $scope.entityHelpers[getter](arg || data)
    .then(function (value) {
      $scope[scopeProperty] = value;
      return value;
    });
  }

  function is (type) {
    return data.sys.type === type;
  }
}]);
