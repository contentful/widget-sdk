import {
  convertInternalStateToConfiguration,
  convertConfigirationToInternalState
} from './SidebarSync.es6';
import { flatten, uniq } from 'lodash';
import { SidebarType } from '../constants.es6';
import { NAMESPACE_EXTENSION, NAMESPACE_SIDEBAR_BUILTIN } from 'widgets/WidgetNamespaces.es6';
import {
  EntryConfiguration,
  Publication as PublicationWidget,
  ScheduledPublication as ScheduledPublicationWidget,
  Versions as VersionsWidget,
  ContentPreview as ContentPreviewWidget,
  Links as LinksWidget,
  Translation as TranslationWidget,
  Users as UsersWidget,
  EntryActivity as EntryActivityWidget
} from '../defaults.es6';

function getAllKeys(arr) {
  return uniq(flatten(arr.map(item => Object.keys(item))));
}

describe('EntrySidebar/Configuration/SidebarSync.es6', () => {
  describe('convertInternalStateToConfiguration', () => {
    it('should be nullable if default config is selected', () => {
      expect(
        convertInternalStateToConfiguration({
          sidebarType: SidebarType.default,
          items: EntryConfiguration
        })
      ).toBeUndefined();
    });

    it('should return valid configuration with disabled defaults and ignore problem items', () => {
      const items = [
        PublicationWidget,
        VersionsWidget,
        {
          widgetId: 'some-custom-extension',
          widgetNamespace: NAMESPACE_EXTENSION
        },
        {
          widgetId: 'some-problem-extension-that-was-deleted',
          widgetNamespace: NAMESPACE_EXTENSION,
          problem: true
        }
      ];
      const state = {
        sidebarType: SidebarType.custom,
        items
      };
      const configuration = convertInternalStateToConfiguration(state);
      expect(getAllKeys(configuration)).toEqual([
        'widgetId',
        'widgetNamespace',
        'settings',
        'disabled'
      ]);

      expect(configuration).toHaveLength(EntryConfiguration.length + 1);
      expect(configuration.filter(item => item.disabled)).toHaveLength(
        EntryConfiguration.length - 2
      );
    });
  });

  describe('convertConfigirationToInternalState', () => {
    it('should return default state is configuration is not array', () => {
      const defaultState = {
        sidebarType: SidebarType.default,
        configurableWidget: null,
        items: EntryConfiguration,
        availableItems: []
      };
      expect(convertConfigirationToInternalState(null, [])).toEqual(defaultState);
      expect(convertConfigirationToInternalState(undefined, [])).toEqual(defaultState);
      expect(convertConfigirationToInternalState({ foo: 'bar' }, [])).toEqual(defaultState);
    });

    it('should split configuration to items and availableItems', () => {
      const allDisabled = EntryConfiguration.map(widget => ({
        widgetId: widget.widgetId,
        widgetNamespace: widget.widgetNamespace,
        disabled: true
      }));
      const state = convertConfigirationToInternalState(allDisabled, []);
      expect(state).toEqual({
        sidebarType: SidebarType.custom,
        configurableWidget: null,
        items: [],
        availableItems: EntryConfiguration
      });
      expect(getAllKeys(state.availableItems)).toEqual([
        'widgetId',
        'widgetNamespace',
        'name',
        'description'
      ]);
    });

    it('should mark as problem non-existent builtin items and all extensions that are not installed in space', () => {
      const configuration = [
        {
          widgetId: PublicationWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: ScheduledPublicationWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: VersionsWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: 'some-extension-that-is-not-installed',
          widgetNamespace: NAMESPACE_EXTENSION
        },
        {
          widgetId: UsersWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
          disabled: true
        },
        {
          widgetId: 'looks-like-in-invalid-built-in',
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        }
      ];

      const state = convertConfigirationToInternalState(configuration, []);

      expect(state).toEqual({
        sidebarType: SidebarType.custom,
        configurableWidget: null,
        items: [
          PublicationWidget,
          ScheduledPublicationWidget,
          VersionsWidget,
          {
            widgetId: 'some-extension-that-is-not-installed',
            widgetNamespace: NAMESPACE_EXTENSION,
            problem: true
          },
          {
            widgetId: 'looks-like-in-invalid-built-in',
            widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN,
            problem: true
          }
        ],
        availableItems: [
          ContentPreviewWidget,
          LinksWidget,
          TranslationWidget,
          UsersWidget,
          EntryActivityWidget
        ]
      });
    });

    it('should push to available only those extension that are not installed', () => {
      const configuration = [
        {
          widgetId: PublicationWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: ScheduledPublicationWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: VersionsWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: UsersWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: 'netlify-extension',
          widgetNamespace: NAMESPACE_EXTENSION,
          parameters: [
            {
              id: 'netlifyBuildHook',
              name: 'Netlify build hook',
              required: true,
              type: 'Symbol'
            }
          ]
        },
        {
          widgetId: LinksWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: ContentPreviewWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        },
        {
          widgetId: TranslationWidget.widgetId,
          widgetNamespace: NAMESPACE_SIDEBAR_BUILTIN
        }
      ];

      const state = convertConfigirationToInternalState(configuration, [
        { id: 'netlify-extension', name: 'Netlify Extension' },
        { id: 'custom-publish-button', name: 'Custom Publish button' }
      ]);

      expect(state).toEqual({
        sidebarType: SidebarType.custom,
        configurableWidget: null,
        items: [
          PublicationWidget,
          ScheduledPublicationWidget,
          VersionsWidget,
          UsersWidget,
          {
            name: 'Netlify Extension',
            widgetId: 'netlify-extension',
            widgetNamespace: NAMESPACE_EXTENSION,
            parameters: []
          },
          LinksWidget,
          ContentPreviewWidget,
          TranslationWidget
        ],
        availableItems: [
          EntryActivityWidget,
          {
            widgetId: 'custom-publish-button',
            widgetNamespace: NAMESPACE_EXTENSION,
            name: 'Custom Publish button',
            parameters: []
          }
        ]
      });
    });
  });
});
