'use strict';

/**
 * @ngdoc type
 * @name AddFieldDialogController
 *
 * @scope.requires {object} dialog
 *
 * @scope.provides {object}          viewState
 * @scope.provides {FieldDescriptor[]} availableFields
 * @scope.provides {Field}           newField
 * @scope.provides {FieldDescriptor} selectedType
 * @scope.provides {bool}            fieldIsList
 */
angular.module('contentful').controller('AddFieldDialogController', [
  '$scope',
  'require',
  function AddFieldDialogController($scope, require) {
    const $controller = require('$controller');
    const fieldFactory = require('fieldFactory');
    const fieldDecorator = require('fieldDecorator');
    const random = require('random');
    const stringUtils = require('stringUtils');
    const buildMessage = require('fieldErrorMessageBuilder');
    const $q = require('$q');
    const $timeout = require('$timeout');
    const LD = require('utils/LaunchDarkly');

    const STRUCTURED_TEXT_FIELD_FEATURE_FLAG = 'feature-at-06-2018-structured-text-field';

    $scope.viewState = $controller('ViewStateController', {
      $scope: $scope,
      defaultState: 'fieldSelection'
    });

    $scope.selectFieldGroup = selectFieldGroup;
    $scope.showFieldSelection = showFieldSelection;
    $scope.create = create;
    $scope.createAndConfigure = createAndConfigure;
    setFieldGroupRows($scope);

    LD.getCurrentVariation(STRUCTURED_TEXT_FIELD_FEATURE_FLAG).then(isEnabled => {
      $timeout(() => setFieldGroupRows($scope, isEnabled));
    });

    $scope.schema = {
      errors: function(field) {
        return fieldDecorator.validateInContentType(field, $scope.contentType.data);
      },
      buildMessage: buildMessage
    };

    // Initial dialog state
    showFieldSelection();

    /**
     * @ngdoc method
     * @name AddFieldDialogController#scope#showFieldSelection
     *
     * @description
     * Resets the information regarding the selected type of field
     * in case the user wants to change their selection
     */
    function showFieldSelection() {
      $scope.field = {
        data: {
          name: '',
          id: random.id(),
          apiName: ''
        },
        isList: false
      };
      $scope.viewState.set('fieldSelection');

      if ($scope.newFieldForm) {
        $scope.newFieldForm.showErrors = false;
      }
    }

    function selectFieldGroup(group) {
      $scope.fieldGroup = group;
      $scope.fieldTypes = _.mapValues(_.groupBy(group.types, 'name'), first);
      $scope.field.type = group.types[0];

      $scope.viewState.set('fieldConfiguration');
    }

    $scope.$watch('field.data.name', name => {
      const apiNameField = $scope.newFieldForm.apiName;
      const apiName = $scope.field.data.apiName;
      if (!apiNameField || !apiNameField.$touched || !apiName) {
        $scope.field.data.apiName = stringUtils.toIdentifier(name);
        if (apiNameField) {
          apiNameField.$setUntouched();
        }
      }
    });

    /**
     * @ngdoc method
     * @name AddFieldDialogController#$scope.create
     *
     * @description
     * Create a field from the user input and validate it. Then confirm
     * the dialog with that field.
     */
    function create() {
      const field = $scope.field.data;
      const typeInfo = fieldFactory.createTypeInfo($scope.field.type, $scope.field.isList);
      _.extend(field, typeInfo);

      if (!$scope.validator.run()) {
        $scope.newFieldForm.showErrors = true;
        return $q.reject(new Error('Invalid user data'));
      }

      return $scope.dialog.confirm(field).promise.then(() => field);
    }

    /**
     * @ngdoc method
     * @name AddFieldDialogController#$scope.createAndConfigure
     *
     * @description
     * Call `$scope.create()` and open the field configuration dialog
     * afterwards.
     */
    function createAndConfigure() {
      create()
        // We don’t care about validation errors raised by
        // `configureField`, so catch is noop.
        .then(field => {
          $scope.ctEditorController.openFieldDialog(field);
        }, _.noop);
    }

    function setFieldGroupRows(scope, enableExperimentalStructuredText = false) {
      let fieldGroups = fieldFactory.groups;
      if (!enableExperimentalStructuredText) {
        fieldGroups = _.filter(fieldGroups, fieldGroup => fieldGroup.name !== 'structured-text');
      }
      scope.fieldGroupRows = fieldGroupsToRows(fieldGroups);
    }

    function fieldGroupsToRows(fieldGroups) {
      const NUMBER_OF_ROWS = 2;
      const itemsPerGroup = Math.ceil(fieldGroups.length / NUMBER_OF_ROWS);
      return _.chunk(fieldGroups, itemsPerGroup);
    }

    function first(array) {
      return array[0];
    }
  }
]);
