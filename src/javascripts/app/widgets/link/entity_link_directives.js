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
      // object of visual configuration options
      // valid options are: draggable, asThumb, showDetails, disableTooltip
      config: '<'
    },
    controller: 'EntityLinkController',
    template: JST[template]()
  };
})

.directive('cfAssetCard', ['createEntityLinkDirective', function (create) {
  return create('cf_asset_card');
}])

.directive('cfEntityLink', ['createEntityLinkDirective', function (create) {
  return create('cf_entity_link');
}])

.controller('EntityLinkController', ['$scope', function ($scope) {
  var data = $scope.entity;
  $scope.config = $scope.config || {};
  $scope.actions = $scope.actions || {};

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

  if (data) {
    getBasicEntityInfo();
    maybeGetEntryDetails();
    maybeGetAssetDetails();
  } else {
    $scope.stateRef = null;
    $scope.missing = true;
  }

  function getBasicEntityInfo () {
    get('entityStatus', 'status');
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
