'use strict';

angular
  .module('contentful')

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
  .directive('cfIframeWidget', [
    'require',
    require => {
      const ERRORS = {
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
        template:
          '<iframe style="width:100%" allowfullscreen msallowfullscreen sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>',
        link: function(scope, element) {
          const _ = require('lodash');
          const fieldFactory = require('fieldFactory');
          const spaceContext = require('spaceContext');
          const $q = require('$q');
          const WidgetAPI = require('widgets/API');
          const K = require('utils/kefir.es6');
          const PathUtils = require('utils/Path.es6');

          const appDomain = 'app.' + require('Config.es6').domain;

          const doc = scope.docImpl || scope.otDoc;
          const entityInfo = scope.entityInfo;

          const fields = entityInfo.contentType.fields;
          const fieldsById = _.transform(
            fields,
            (fieldsById, field) => {
              fieldsById[field.id] = field;
            },
            {}
          );

          const parameters = {
            instance: scope.widget.settings || {},
            installation: scope.widget.installationParameterValues || {}
          };

          const widgetAPI = new WidgetAPI(
            spaceContext.cma,
            spaceContext.space.data.spaceMembership,
            parameters,
            fields,
            doc.getValueAt([]),
            scope.transformedContentTypeData,
            // TODO the isDisabled property is only required for <v2.1 of the
            // extension SDK. We should remove it
            {
              field: scope.widget.field,
              locale: scope.locale,
              isDisabled: scope.fieldLocale.access.disabled
            },
            element[0].querySelector('iframe')
          );

          scope.$on('$destroy', () => {
            widgetAPI.destroy();
          });

          widgetAPI.registerHandler('setValue', (apiName, localeCode, value) => {
            const path = widgetAPI.buildDocPath(apiName, localeCode);

            return doc
              .setValueAt(path, value)
              .catch(makeErrorHandler(ERRORS.codes.EBADUPDATE, ERRORS.messages.MFAILUPDATE));
          });

          widgetAPI.registerHandler('removeValue', (apiName, localeCode) => {
            const path = widgetAPI.buildDocPath(apiName, localeCode);

            return doc
              .removeValueAt(path)
              .catch(makeErrorHandler(ERRORS.codes.EBADUPDATE, ERRORS.messages.MFAILREMOVAL));
          });

          widgetAPI.registerHandler('setInvalid', (isInvalid, localeCode) => {
            scope.fieldController.setInvalid(localeCode, isInvalid);
          });

          widgetAPI.registerHandler('setActive', isActive => {
            scope.fieldLocale.setActive(isActive);
          });

          initializeIframe();

          function makeErrorHandler(code, msg) {
            return e => {
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

          function initializeIframe() {
            const $iframe = element.find('iframe');
            const src = scope.widget.src;
            const srcdoc = scope.widget.srcdoc;

            $iframe.one('load', () => {
              scope.$applyAsync(() => {
                widgetAPI.connect();
              });
            });

            if (src && !isAppDomain(src)) {
              const sandbox = $iframe.attr('sandbox') + ' allow-same-origin';
              $iframe.attr('sandbox', sandbox);
              $iframe.attr('src', src);
            } else if (srcdoc) {
              $iframe.attr('srcdoc', srcdoc);
            }
          }

          function isAppDomain(src) {
            const protocol = ['//', 'http://', 'https://'].find(p => src.startsWith(p));

            if (protocol) {
              const [domain] = src.slice(protocol.length).split('/');
              return domain === appDomain || domain.endsWith(`.${appDomain}`);
            } else {
              return false;
            }
          }

          K.onValueScope(scope, doc.sysProperty, sys => {
            widgetAPI.send('sysChanged', [sys]);
          });

          K.onValueScope(scope, scope.fieldLocale.errors$, errors => {
            errors = errors || [];
            widgetAPI.send('schemaErrorsChanged', [errors]);
          });

          const fieldChanges = doc.changes.filter(path => PathUtils.isAffecting(path, ['fields']));

          K.onValueScope(scope, fieldChanges, path => {
            updateWidgetValue(path[1], path[2]);
          });

          // Send a message when the disabled status of the field changes
          scope.$watch(isEditingDisabled, isDisabled => {
            widgetAPI.send('isDisabledChanged', [isDisabled]);
          });

          // Retrieve whether field is disabled or not
          function isEditingDisabled() {
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
          function updateWidgetValue(fieldId, locale) {
            if (!fieldId) {
              updateWidgetFields();
            } else if (!locale) {
              updateWidgetLocales(fieldId);
            } else {
              updateWidgetLocaleValue(fieldId, locale);
            }
          }

          function updateWidgetFields() {
            _.forEach(fields, field => {
              updateWidgetLocales(field.id);
            });
          }

          function updateWidgetLocales(fieldId) {
            const field = fieldsById[fieldId];

            // We might receive changes from other uses on fields that we
            // do not yet know about. We silently ignore them.
            if (!field) {
              return;
            }

            const locales = fieldFactory.getLocaleCodes(field);
            _.forEach(locales, locale => {
              updateWidgetLocaleValue(fieldId, locale);
            });
          }

          function updateWidgetLocaleValue(fieldId, locale) {
            const value = doc.getValueAt(['fields', fieldId, locale]);
            widgetAPI.sendFieldValueChange(fieldId, locale, value);
          }
        }
      };
    }
  ]);
