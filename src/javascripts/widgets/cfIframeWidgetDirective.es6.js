import { registerDirective } from 'NgRegistry.es6';
import Channel from './ExtensionIFrameChannel.es6';
import ExtensionAPI from './ExtensionAPI.es6';
import createBridge from './EditorExtensionBridge.es6';

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

        const bridge = createBridge({
          $rootScope,
          $scope: scope,
          spaceContext,
          TheLocaleStore,
          entitySelector,
          Analytics
        });

        const iframe = element[0].querySelector('iframe');
        const channel = new Channel(iframe, $window, bridge.apply);
        const extensionApi = new ExtensionAPI({ channel, ...bridge.getData() });
        bridge.install(extensionApi);
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
