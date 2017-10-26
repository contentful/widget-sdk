angular.module('contentful')

/**
 * @description
 * Directive that renders the sidebar for entries and assets
 *
 * TODO we should use an isolated scope
 *
 * @scope.requires {object} preferences.showAuxPanel
 *   Determines whether we show the entity information
 * @scope.requires {object} locales
 *   An instance of 'entityEditor/LocalesController' to change active
 *   locales.
 * @scope.requires {object} state
 *   An instance of 'entityEditor/StateController'
 * @scope.requires {object} otDoc
 *   An instance of 'entityEditor/Document'
 * @scope.requires {object} entityInfo
 *   As provided by the entry/asset editor controller
 * @scope.requires {object} sidebarControls
 *   These probably need a lot of stuff in return
 */
.directive('cfEntitySidebar', ['require', function (require) {
  var K = require('utils/kefir');

  return {
    restrict: 'E',
    scope: true,
    template: JST.cf_entity_sidebar(),
    controller: ['$scope', function ($scope) {
      $scope.data = {
        isEntry: $scope.entityInfo.type === 'Entry'
      };

      // We make sure that we do not leak entity instances from the
      // editor controller into the current scope
      $scope.entity = null;
      $scope.entry = null;
      $scope.asset = null;

      $scope.entitySys$ = $scope.otDoc.sysProperty;

      // This code is responsible for showing the saving indicator. We
      // debounce switching the indicator off so that it is shown for
      // at least one second.
      var setNotSavingTimeout;
      K.onValueScope($scope, $scope.otDoc.state.isSaving$.skipDuplicates(), function (isSaving) {
        clearTimeout(setNotSavingTimeout);
        if (isSaving) {
          $scope.data.documentIsSaving = true;
        } else {
          setNotSavingTimeout = setTimeout(function () {
            $scope.data.documentIsSaving = false;
            $scope.$apply();
          }, 1000);
        }
      });

      K.onValueScope($scope, $scope.otDoc.sysProperty, function (sys) {
        $scope.data.documentUpdatedAt = sys.updatedAt;
      });

      K.onValueScope($scope, $scope.otDoc.collaborators, function (collaborators) {
        $scope.data.docCollaborators = collaborators;
      });
    }]
  };
}]);
