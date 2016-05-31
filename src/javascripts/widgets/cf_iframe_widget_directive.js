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
 * @scope.requires {otDoc} otDoc  Provided by the `otDocFor` directive
 * @scope.requires {Client.Entry} entry
 * @scope.requires {API.Locale} locale
 * @scope.requires {API.ContentType.Field} field
 */
.directive('cfIframeWidget', ['$injector', function ($injector) {
  return {
    restrict: 'E',
    template: '<iframe style="width:100%" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>',
    link: function (scope, element) {
      var ShareJS = $injector.get('ShareJS');
      var fieldFactory = $injector.get('fieldFactory');
      var spaceContext = $injector.get('spaceContext');
      var $q = $injector.get('$q');

      var $iframe = element.find('iframe');
      var iframe = $iframe.get(0);
      var WidgetAPI = $injector.get('widgets/API');
      var Widgets = $injector.get('widgets');

      var descriptor = Widgets.get(scope.widget.widgetId);
      var fields = scope.contentType.data.fields;
      var fieldsById = _.transform(fields, function (fieldsById, field) {
        fieldsById[field.id] = field;
      }, {});

      var widgetAPI = new WidgetAPI(
        spaceContext.space, fields, scope.entry.data,
        {field: scope.field, locale: scope.locale}, iframe
      );

      scope.$on('$destroy', function () {
        widgetAPI.destroy();
      });

      widgetAPI.registerHandler('setValue', function (apiName, localeCode, value) {
        var path = widgetAPI.buildDocPath(apiName, localeCode);
        return scope.otDoc.setValueAt(path, value)
        .catch(function (e) {
          if (e && e.message) {
            e = e.message;
          }
          return $q.reject({
            code: 'ENTRY UPDATE FAILED',
            message: 'Could not update entry field',
            data: {
              shareJSCode: e
            }
          });
        });
      });

      initializeIframe();

      function initializeIframe () {
        iframe.addEventListener('load', function () {
          widgetAPI.connect();
        });

        if (descriptor.src) {
          $iframe.attr('src', descriptor.src);
        } else {
          $iframe.attr('srcdoc', descriptor.srcdoc);
        }
      }

      scope.$watch('entry.data.sys', function (sys) {
        widgetAPI.send('sysChanged', [sys]);
      }, true);

      scope.$on('otDocReady', function (_ev, doc) {
        updateWidgetFields(doc);
      });

      scope.$on('otChange', function (_ev, doc, ops) {
        var paths = _.pluck(ops, 'p');
        paths = _.filter(paths, function (path) {
          return path[0] === 'fields';
        });
        _.each(paths, function (path) {
          updateWidgetValue(doc, path[1], path[2]);
        });
      });

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
      function updateWidgetValue (doc, fieldId, locale) {
        if (!fieldId) {
          updateWidgetFields(doc);
          return;
        }

        if (!locale) {
          updateWidgetLocales(doc, fieldId);
          return;
        }

        updateWidgetLocaleValue(doc, fieldId, locale);
      }

      function updateWidgetFields (doc) {
        _.forEach(fields, function (field) {
          updateWidgetLocales(doc, field.id);
        });
      }

      function updateWidgetLocales (doc, fieldId) {
        var locales = fieldFactory.getLocaleCodes(fieldsById[fieldId]);
        _.forEach(locales, function (locale) {
          updateWidgetLocaleValue(doc, fieldId, locale);
        });
      }

      function updateWidgetLocaleValue (doc, fieldId, locale) {
        var value = ShareJS.peek(doc, ['fields', fieldId, locale]);
        widgetAPI.sendFieldValueChange(fieldId, locale, value);
      }
    }
  };
}]);
