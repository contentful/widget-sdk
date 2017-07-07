'use strict';

angular.module('cf.app')
.directive('cfReferenceEditor', ['require', function (require) {
  var createController = require('app/widgets/link/ReferenceEditorController').default;

  return {
    restrict: 'E',
    scope: {
      type: '@',
      style: '@variant',
      single: '='
    },
    template: JST.cf_reference_editor(),
    controller: ['$scope', function ($scope) {
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

.factory('cfReferenceEditor/createEntity', ['require', function (require) {
  var modalDialog = require('modalDialog');

  return function createEntity (entityType, field, space) {
    if (entityType === 'Entry') {
      return maybeAskAndCreateEntry();
    } else if (entityType === 'Asset') {
      return space.createAsset({});
    } else {
      throw new TypeError('Unknown entity type ' + entityType);
    }

    function maybeAskAndCreateEntry () {
      return getAvailableContentTypes()
      .then(function (cts) {
        if (cts.length === 1) {
          return createEntry(cts[0]);
        } else {
          return askForContentType(cts)
          .then(createEntry);
        }
      });
    }

    function getAvailableContentTypes () {
      return space.getContentTypes({order: 'name', limit: 1000})
      .then(function (res) {
        return _.filter(res.items, canCreate(field));
      });
    }

    function canCreate (field) {
      var validations = [].concat(field.validations || [], field.itemValidations || []);
      var found = _.find(validations, function (v) {
        return Array.isArray(v.linkContentType) || _.isString(v.linkContentType);
      });
      var linkedCts = found && found.linkContentType;
      linkedCts = _.isString(linkedCts) ? [linkedCts] : linkedCts;

      return function (ct) {
        var canLink = !linkedCts || linkedCts.indexOf(ct.sys.id) > -1;
        return !!ct.sys.publishedVersion && canLink;
      };
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
