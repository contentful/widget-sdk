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
.directive('cfIframeWidget', ['$injector', function($injector) {
  return {
    restrict: 'E',
    template: '<iframe style="width:100%" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>',
    link: function (scope, element) {
      var ShareJS = $injector.get('ShareJS');
      var fieldFactory = $injector.get('fieldFactory');
      var spaceContext = $injector.get('spaceContext');
      var $q = $injector.get('$q');

      var $iframe  = element.find('iframe');
      var iframe   = $iframe.get(0);
      var WidgetAPI = $injector.get('widgets/API');
      var Widgets = $injector.get('widgets');

      var descriptor = Widgets.get(scope.widget.widgetId);
      var fields = scope.contentType.data.fields;

      var widgetAPI = new WidgetAPI(
        spaceContext.space, fields, scope.entry.data,
        {field: scope.field, locale: scope.locale}, iframe
      );

      scope.$on('$destroy', function () {
        widgetAPI.destroy();
      });

      widgetAPI.registerHandler('setValue', function (apiName, localeCode, value) {
        var path = widgetAPI.buildDocPath(apiName, localeCode);
        var doc = scope.otDoc.doc;
        if (doc) {
          return updateDocValue(doc, path, value);
        }
      });

      widgetAPI.registerHandler('removeValue', function (apiName, localeCode) {
        var path = widgetAPI.buildDocPath(apiName, localeCode);
        var doc = scope.otDoc.doc;
        if (doc) {
          return removeDocValue(doc, path);
        }
      });

      initializeIframe();

      function initializeIframe() {
        iframe.addEventListener('load', function () {
          widgetAPI.connect();
        });

        if (descriptor.src) {
          $iframe.attr('src', descriptor.src);
        } else {
          $iframe.attr('srcdoc', descriptor.srcdoc);
        }
      }

      function updateDocValue (doc, path, value) {
        return ShareJS.setDeep(doc, path, value)
        .catch(function (e) {
          // Should only throw an error when `value` does not have the
          // correct type. Then `e` will be "forbidden".
          return $q.reject({
            code: 'ENTRY UPDATE FAILED',
            message: 'Could not update entry field',
            data: {
              shareJSCode: e
            }
          });
        });
      }

      function removeDocValue (doc, path) {
        return $q.denodeify(function (cb) {
          // We catch synchronous errors since they tell us that a
          // value along the path does not exist.
          try {
            doc.removeAt(path, cb);
          } catch (e) {}
        });
      }

      scope.$watch('entry.data.sys', sendSysUpdate, true);

      scope.$on('otChange', function (ev, doc, ops) {
        var paths = _.map(ops, function (op) {
          return op.p.slice(0,3);
        });
        _.each(paths, function (path) {
          if (path[0] === 'fields') {
            var id = path[1];
            var locale = path[2];
            var value = ShareJS.peek(doc, ['fields', id, locale]);
            widgetAPI.sendFieldValueChange(id, locale, value);
          }
        });
      });

      function sendSysUpdate (sys) {
        widgetAPI.send('sysChanged', [sys]);
      }

      scope.$on('otDocReady', function (ev, doc) {
        _.forEach(fields, function (field) {
          var locales = fieldFactory.getLocaleCodes(field);
          _.forEach(locales, function (locale) {
            var value = ShareJS.peek(doc, ['fields', field.id, locale]);
            widgetAPI.sendFieldValueChange(field.id, locale, value);
          });
        });
      });
    }
  };
}]);
