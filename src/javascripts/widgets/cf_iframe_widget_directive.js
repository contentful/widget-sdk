'use strict';

angular.module('contentful')

/**
 * @ngdoc directive
 * @name cfIframeWidget
 * @description
 * Creates an iframe to render a custom widget in and sets up
 * communication between the widget and the UI.
 *
 * @scope.requires {Widget.Renderable} widget
 *   Provided by FormWidgetsController
 * @scope.requires {otDoc} otDoc
 *   Provided by EntryEditorController
 * @scope.requires {object} entityInfo
 *   Provided by EntryEditorController
 * @scope.requires {API.Locale} locale
 *   Provided by FieldLocaleController
 */
.directive('cfIframeWidget', ['require', function (require) {
  var ERRORS = {
    codes: {
      EBADUPDATE: 'ENTRY UPDATE FAILED'
    },
    messages: {
      MFAILUPDATE: 'Could not update entry field',
      MFAILREMOVAL: 'Could not remove value for field'
    }
  };

  return {
    restrict: 'E',
    template: '<iframe style="width:100%" allowfullscreen msallowfullscreen sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>',
    link: function (scope, element) {
      var fieldFactory = require('fieldFactory');
      var spaceContext = require('spaceContext');
      var $q = require('$q');

      var $iframe = element.find('iframe');
      var iframe = $iframe.get(0);
      var WidgetAPI = require('widgets/API');
      var K = require('utils/kefir');
      var PathUtils = require('utils/Path');

      var doc = scope.docImpl || scope.otDoc;
      var descriptor = _.find(spaceContext.widgets.getAll(), {id: scope.widget.widgetId});
      var entityInfo = scope.entityInfo;

      var fields = entityInfo.contentType.fields;
      var fieldsById = _.transform(fields, function (fieldsById, field) {
        fieldsById[field.id] = field;
      }, {});

      var parameters = {
        instance: scope.widget.settings,
        installation: scope.widget.installationParameterValues
      };

      var widgetAPI = new WidgetAPI(
        spaceContext.cma, spaceContext.space.data.spaceMembership, parameters,
        fields, doc.getValueAt([]), scope.transformedContentTypeData,
        // TODO the isDisabled property is only required for <v2.1 of the
        // extension SDK. We should remove it
        {field: scope.widget.field, locale: scope.locale, isDisabled: scope.fieldLocale.access.disabled},
        iframe
      );

      scope.$on('$destroy', function () {
        widgetAPI.destroy();
      });

      widgetAPI.registerHandler('setValue', function (apiName, localeCode, value) {
        var path = widgetAPI.buildDocPath(apiName, localeCode);

        return doc.setValueAt(path, value)
        .catch(makeErrorHandler(ERRORS.codes.EBADUPDATE, ERRORS.messages.MFAILUPDATE));
      });

      widgetAPI.registerHandler('removeValue', function (apiName, localeCode) {
        var path = widgetAPI.buildDocPath(apiName, localeCode);

        return doc.removeValueAt(path)
        .catch(makeErrorHandler(ERRORS.codes.EBADUPDATE, ERRORS.messages.MFAILREMOVAL));
      });

      widgetAPI.registerHandler('setInvalid', function (isInvalid, localeCode) {
        scope.fieldController.setInvalid(localeCode, isInvalid);
      });

      widgetAPI.registerHandler('setActive', function (isActive) {
        scope.fieldLocale.setActive(isActive);
      });

      initializeIframe();

      function makeErrorHandler (code, msg) {
        return function (e) {
          if (e && e.message) {
            e = e.message;
          }
          return $q.reject({
            code: code,
            message: msg,
            data: {
              shareJSCode: e
            }
          });
        };
      }

      function initializeIframe () {
        $iframe.one('load', function () {
          scope.$applyAsync(function () {
            widgetAPI.connect();
          });
        });

        if (descriptor.src) {
          $iframe.attr('src', descriptor.src);
        } else {
          $iframe.attr('srcdoc', descriptor.srcdoc);
        }
      }

      K.onValueScope(scope, doc.sysProperty, function (sys) {
        widgetAPI.send('sysChanged', [sys]);
      });

      K.onValueScope(scope, scope.fieldLocale.errors$, function (errors) {
        errors = errors || [];
        widgetAPI.send('schemaErrorsChanged', [errors]);
      });

      var fieldChanges = doc.changes.filter(function (path) {
        return PathUtils.isAffecting(path, ['fields']);
      });

      K.onValueScope(scope, fieldChanges, function (path) {
        updateWidgetValue(path[1], path[2]);
      });

      // Send a message when the disabled status of the field changes
      scope.$watch(isEditingDisabled, function (isDisabled) {
        widgetAPI.send('isDisabledChanged', [isDisabled]);
      });

      // Retrieve whether field is disabled or not
      function isEditingDisabled () {
        return scope.fieldLocale.access.disabled;
      }

      /**
       * Retrieves the field value at the given path from the document
       * and sends it to the widget.
       *
       * If `locale` is not given it retrieves the localization object
       * for the field and sends an update for each locale.
       *
       * Similarly, if `fieldId` is not given it sends an update for
       * every field and locale.
       */
      function updateWidgetValue (fieldId, locale) {
        if (!fieldId) {
          updateWidgetFields();
        } else if (!locale) {
          updateWidgetLocales(fieldId);
        } else {
          updateWidgetLocaleValue(fieldId, locale);
        }
      }

      function updateWidgetFields () {
        _.forEach(fields, function (field) {
          updateWidgetLocales(field.id);
        });
      }

      function updateWidgetLocales (fieldId) {
        var field = fieldsById[fieldId];

        // We might receive changes from other uses on fields that we
        // do not yet know about. We silently ignore them.
        if (!field) {
          return;
        }

        var locales = fieldFactory.getLocaleCodes(field);
        _.forEach(locales, function (locale) {
          updateWidgetLocaleValue(fieldId, locale);
        });
      }

      function updateWidgetLocaleValue (fieldId, locale) {
        var value = doc.getValueAt(['fields', fieldId, locale]);
        widgetAPI.sendFieldValueChange(fieldId, locale, value);
      }
    }
  };
}]);
