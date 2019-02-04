import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import * as Navigator from 'states/Navigator.es6';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient/index.es6';
import * as PublicContentType from 'widgets/PublicContentType.es6';

export default function register() {
  /**
   * @deprecated Use and extend the new `app/widgets/WidgetApi/buildWidgetApi.es6.js` instead.
   *
   * @description
   * Provides an interface similar to the ui-extensions-sdk `extension` object:
   * https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md#dialogsselectsingleentryoptions
   *
   * @scope.requires {object} entity
   * @scope.requires {object} locale
   * @scope.requires {object} otSubDoc
   * @scope.requires {object} fields
   * @scope.requires {object} widget
   * @scope.requires {object} fieldController
   * @scope.requires {object} state
   */
  registerDirective('cfWidgetApi', () => ({
    restrict: 'A',
    controller: 'WidgetApiController'
  }));

  /**
   * @ngdoc type
   * @name WidgetApiController
   * @description
   * Interface for a widget to communicate with an entry.
   *
   * Exposed by the `cfWidgetApi` directive.
   */
  registerController('WidgetApiController', [
    '$scope',
    'spaceContext',
    'TheLocaleStore',
    'EntityHelpers',
    function($scope, spaceContext, TheLocaleStore, EntityHelpers) {
      const fieldLocale = $scope.fieldLocale;
      const ctField = $scope.widget.field;

      const isEditingDisabled = fieldLocale.access$.map(access => !!access.disabled);

      this.settings = _.clone($scope.widget.settings);
      this.settings.helpText = this.settings.helpText || $scope.widget.defaultHelpText;

      this.locales = {
        default: getDefaultLocaleCode(),
        available: getAvailableLocaleCodes()
      };

      this.contentType = PublicContentType.fromInternal($scope.entityInfo.contentType);

      // Collection of APIs that are not exposed by the extensions API.
      this._internal = {};
      if ($scope.editorContext.editReferences) {
        this._internal.editReferences = (index, cb) => {
          $scope.editorContext.editReferences(
            this.field.id,
            $scope.locale.internal_code,
            index,
            cb
          );
        };
      }

      // TODO: This is used to create multiple reference contexts
      // to be able to open multiple instances of the bulk editor
      // simultaneously.
      if ($scope.editorContext.createReferenceContext) {
        this._internal.createReferenceContext = (index, cb) =>
          $scope.editorContext.createReferenceContext(
            ctField.id,
            $scope.locale.internal_code,
            index,
            cb
          );
      }

      if ($scope.editorContext.toggleSlideinEditor) {
        this._internal.toggleSlideinEditor = $scope.editorContext.toggleSlideinEditor;
      }

      this.entry = {
        // TODO only used by slug and reference editor; we should
        // remove it and only offer a property interface
        getSys: function() {
          return K.getValue(fieldLocale.doc.sys);
        },
        onSysChanged: function(cb) {
          return K.onValueScope($scope, fieldLocale.doc.sys, cb);
        },
        fields: $scope.fields // comes from entry editor controller
      };

      this.space = getBatchingApiClient(spaceContext.cma);
      this.entityHelpers = EntityHelpers.newForLocale($scope.locale.code);
      this.state = {
        goToEditor: function(entity) {
          const ref = Navigator.makeEntityRef(entity);
          return Navigator.go(ref);
        }
      };

      // This interface is not exposed on the Extensions SDK. It serves for
      // internal convenience. Everything that uses these values can be
      // written (albeit awkwardly) with the Extensions SDK.
      this.fieldProperties = {
        // Property<boolean>
        isDisabled$: isEditingDisabled,
        // Property<Error[]?>
        schemaErrors$: fieldLocale.errors$,
        // Property<any>
        value$: fieldLocale.doc.value$
      };

      this.field = {
        onIsDisabledChanged: function(cb) {
          return K.onValueScope($scope, isEditingDisabled, cb);
        },
        onPermissionChanged: function(cb) {
          return K.onValueScope($scope, fieldLocale.access$, cb);
        },
        onSchemaErrorsChanged: function(cb) {
          return K.onValueScope($scope, fieldLocale.errors$, cb);
        },
        setInvalid: setInvalid,
        onValueChanged: function(cb) {
          return K.onValueScope($scope, fieldLocale.doc.valueProperty, cb);
        },
        getValue: fieldLocale.doc.get,
        setValue: fieldLocale.doc.set,
        removeValue: fieldLocale.doc.remove,
        removeValueAt: fieldLocale.doc.removeAt,
        insertValue: fieldLocale.doc.insert,
        pushValue: fieldLocale.doc.push,

        id: ctField.apiName, // we only want to expose the public ID
        name: ctField.name,
        locale: $scope.locale.code,
        type: ctField.type,
        linkType: ctField.linkType,
        itemLinkType: _.get(ctField, ['items', 'linkType']),
        required: !!ctField.required,
        validations: ctField.validations || [],
        itemValidations: _.get(ctField, ['items', 'validations'], []),

        registerUnpublishedReferencesWarning: $scope.state.registerUnpublishedReferencesWarning,

        // Convenience properties not provided by the extensions API but
        // easily emulated.
        value$: fieldLocale.doc.value$
      };

      /**
       * @ngdoc method
       * @name WidgetApiController#field.setInvalid
       * @description
       * Set to true to indicate that the user input is invalid.
       *
       * If true this will set the field state to invalid and show a red side
       * border.
       *
       * @param {boolean} isInvalid
       */
      function setInvalid(isInvalid) {
        $scope.fieldController.setInvalid($scope.locale.code, isInvalid);
      }

      function getDefaultLocaleCode() {
        return TheLocaleStore.getDefaultLocale().code;
      }

      function getAvailableLocaleCodes() {
        return _.map(TheLocaleStore.getPrivateLocales(), 'code');
      }
    }
  ]);
}
