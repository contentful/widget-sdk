import { registerDirective } from 'NgRegistry.es6';
import { get } from 'lodash';
import * as K from 'utils/kefir.es6';
import * as PathUtils from 'utils/Path.es6';
import Channel from './ExtensionIFrameChannel.es6';
import ExtensionAPI from './ExtensionAPI.es6';

const ERROR_CODES = { EBADUPDATE: 'ENTRY UPDATE FAILED' };

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field'
};

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
registerDirective('cfIframeWidget', [
  '$window',
  '$rootScope',
  'spaceContext',
  'Config.es6',
  'TheLocaleStore',
  'entitySelector',
  'analytics/Analytics.es6',
  ($window, $rootScope, spaceContext, Config, TheLocaleStore, entitySelector, Analytics) => {
    return {
      restrict: 'E',
      template:
        '<iframe style="width:100%" allowfullscreen msallowfullscreen sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>',
      link: function(scope, element) {
        const appDomain = `app.${Config.domain}`;
        const doc = scope.docImpl || scope.otDoc;

        const current = {
          field: scope.widget.field,
          locale: scope.locale
        };
        const locales = {
          available: TheLocaleStore.getPrivateLocales(),
          default: TheLocaleStore.getDefaultLocale()
        };
        const parameters = {
          instance: scope.widget.settings || {},
          installation: scope.widget.installationParameterValues || {}
        };

        const iframe = element[0].querySelector('iframe');
        const channel = new Channel(iframe, $window, cb => $rootScope.$apply(cb));

        const extensionApi = new ExtensionAPI({
          channel,
          spaceMembership: spaceContext.space.data.spaceMembership,
          parameters,
          entryData: doc.getValueAt([]),
          contentTypeData: scope.entityInfo.contentType,
          current,
          locales
        });

        // SENDING EVENTS TO THE EXTENSION:

        scope.$on('$destroy', () => extensionApi.destroy());

        scope.$watch(
          () => scope.fieldLocale.access.disabled,
          isDisabled => {
            extensionApi.send('isDisabledChanged', [isDisabled]);
          }
        );

        K.onValueScope(scope, doc.sysProperty, sys => {
          extensionApi.send('sysChanged', [sys]);
        });

        K.onValueScope(scope, scope.fieldLocale.errors$, errors => {
          extensionApi.send('schemaErrorsChanged', [errors || []]);
        });

        K.onValueScope(
          scope,
          doc.changes.filter(path => PathUtils.isAffecting(path, ['fields'])),
          path => extensionApi.update(path, doc.getValueAt([]))
        );

        // RECEIVING EVENTS FROM THE EXTENSION:

        extensionApi.registerHandler('callSpaceMethod', async (methodName, args) => {
          try {
            const entity = await spaceContext.cma[methodName](...args);
            maybeTrackEntryAction(methodName, args, entity);
            return entity;
          } catch ({ code, body }) {
            const err = new Error('Request failed.');
            throw Object.assign(err, { code, data: body });
          }
        });

        function maybeTrackEntryAction(methodName, args, entity) {
          try {
            if (get(entity, ['sys', 'type']) !== 'Entry') {
              return;
            }

            if (methodName === 'createEntry') {
              trackEntryAction('create', args[0], entity);
            } else if (methodName === 'publishEntry') {
              const contentTypeId = get(args[0], ['sys', 'contentType', 'sys', 'id']);
              trackEntryAction('publish', contentTypeId, entity);
            }
          } catch (err) {
            // Just catch and ignore, failing to track should not
            // demonstrate itself outside.
          }
        }

        function trackEntryAction(action, contentTypeId, data) {
          Analytics.track(`entry:${action}`, {
            eventOrigin: 'ui-extension',
            // Stub content type object:
            contentType: {
              sys: { id: contentTypeId, type: 'ContentType' },
              fields: []
            },
            response: { data }
          });
        }

        extensionApi.registerHandler('setHeight', height => {
          iframe.setAttribute('height', height);
        });

        extensionApi.registerHandler('openDialog', async (type, options) => {
          if (type === 'entitySelector') {
            return entitySelector.openFromExtension(options);
          } else {
            throw new Error('Unknown dialog type.');
          }
        });

        extensionApi.registerPathHandler('setValue', async (path, value) => {
          try {
            await doc.setValueAt(path, value);
            return value;
          } catch (err) {
            throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
          }
        });

        extensionApi.registerPathHandler('removeValue', async path => {
          try {
            await doc.removeValueAt(path);
          } catch (err) {
            throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
          }
        });

        function makeShareJSError(shareJSError, message) {
          const data = {};
          if (shareJSError && shareJSError.message) {
            data.shareJSCode = shareJSError.message;
          }

          const error = new Error(message);
          return Object.assign(error, { code: ERROR_CODES.EBADUPDATE, data });
        }

        extensionApi.registerHandler('setInvalid', (isInvalid, localeCode) => {
          scope.fieldController.setInvalid(localeCode, isInvalid);
        });

        extensionApi.registerHandler('setActive', isActive => {
          scope.fieldLocale.setActive(isActive);
        });

        // IFRAME SETUP:

        initializeIframe();

        function initializeIframe() {
          const $iframe = element.find('iframe');
          const { src, srcdoc } = scope.widget;

          $iframe.one('load', () => {
            scope.$applyAsync(() => extensionApi.connect());
          });

          if (src && !isAppDomain(src)) {
            $iframe.attr('sandbox', `${$iframe.attr('sandbox')} allow-same-origin`);
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
      }
    };
  }
]);
