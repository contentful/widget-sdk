import { registerDirective, registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { getAvailableContentTypes } from 'app/widgets/link/utils.es6';

registerDirective('cfReferenceEditor', [
  'app/widgets/link/ReferenceEditorController.es6',
  ({ default: createController }) => ({
    restrict: 'E',
    scope: {
      type: '@',
      style: '@variant',
      single: '='
    },
    template: JST.cf_reference_editor(),
    controller: [
      '$scope',
      $scope => {
        // We need to define the uiSortable property in the pre-link
        // stage. The ui-sortable directive will obtain a reference to
        // the object that we can later modify.
        $scope.uiSortable = { update: _.noop };
      }
    ],
    require: '^cfWidgetApi',
    link: function($scope, _$elem, _$attrs, widgetApi) {
      createController($scope, widgetApi);
    }
  })
]);

registerFactory('cfReferenceEditor/createEntity', [
  'modalDialog',
  modalDialog => {
    return function createEntity(entityType, field, space) {
      if (entityType === 'Entry') {
        return maybeAskAndCreateEntry();
      } else if (entityType === 'Asset') {
        return space.createAsset({});
      } else {
        throw new TypeError('Unknown entity type ' + entityType);
      }

      function maybeAskAndCreateEntry() {
        return getAvailableContentTypes(space, field).then(cts => {
          if (cts.length === 1) {
            return createEntry(cts[0]);
          } else {
            return askForContentType(cts).then(createEntry);
          }
        });
      }

      function askForContentType(cts) {
        return modalDialog.open({
          template: 'select_ct_of_new_entry',
          scopeData: { cts: cts }
        }).promise;
      }

      function createEntry(ct) {
        return space.createEntry(ct.sys.id, {});
      }
    };
  }
]);
