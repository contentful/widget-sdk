'use strict';

angular.module('cf.app')
.directive('cfReferenceEditor', ['require', require => {
  const createController = require('app/widgets/link/ReferenceEditorController').default;

  return {
    restrict: 'E',
    scope: {
      type: '@',
      style: '@variant',
      single: '='
    },
    template: JST.cf_reference_editor(),
    controller: ['$scope', $scope => {
      // We need to define the uiSortable property in the pre-link
      // stage. The ui-sortable directive will obtain a reference to
      // the object that we can later modify.
      $scope.uiSortable = {update: _.noop};
    }],
    require: '^cfWidgetApi',
    link: function ($scope, _$elem, _$attrs, widgetApi) {
      createController($scope, widgetApi);
    }
  };
}])

.factory('cfReferenceEditor/createEntity', ['require', require => {
  const modalDialog = require('modalDialog');
  const getAvailableContentTypes = require('app/widgets/link/utils').getAvailableContentTypes;

  return function createEntity (entityType, field, space) {
    if (entityType === 'Entry') {
      return maybeAskAndCreateEntry();
    } else if (entityType === 'Asset') {
      return space.createAsset({});
    } else {
      throw new TypeError('Unknown entity type ' + entityType);
    }

    function maybeAskAndCreateEntry () {
      return getAvailableContentTypes(space, field)
      .then(cts => {
        if (cts.length === 1) {
          return createEntry(cts[0]);
        } else {
          return askForContentType(cts)
          .then(createEntry);
        }
      });
    }

    function askForContentType (cts) {
      return modalDialog.open({
        template: 'select_ct_of_new_entry',
        scopeData: {cts: cts}
      }).promise;
    }

    function createEntry (ct) {
      return space.createEntry(ct.sys.id, {});
    }
  };
}]);
