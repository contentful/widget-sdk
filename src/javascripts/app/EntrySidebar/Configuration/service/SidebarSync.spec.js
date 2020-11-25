import {
  convertInternalStateToConfiguration,
  convertConfigurationToInternalState,
} from './SidebarSync';
import { flatten, uniq } from 'lodash';
import {
  EntryConfiguration,
  Publication as PublicationWidget,
  Tasks as TasksWidget,
  Versions as VersionsWidget,
  ContentPreview as ContentPreviewWidget,
  Links as LinksWidget,
  Translation as TranslationWidget,
  Users as UsersWidget,
} from '../defaults';
import { WidgetNamespace } from '@contentful/widget-renderer';

function getAllKeys(arr) {
  return uniq(flatten(arr.map((item) => Object.keys(item))));
}

describe('EntrySidebar/Configuration/SidebarSync', () => {
  describe('convertInternalStateToConfiguration', () => {
    it('should be nullable if default config is selected', () => {
      expect(
        convertInternalStateToConfiguration(
          {
            items: EntryConfiguration,
          },
          EntryConfiguration
        )
      ).toBeUndefined();
    });

    it('should return valid configuration with disabled defaults included', () => {
      const items = [
        PublicationWidget,
        VersionsWidget,
        {
          widgetId: 'some-custom-extension',
          widgetNamespace: WidgetNamespace.EXTENSION,
        },
      ];
      const state = {
        items,
      };
      const configuration = convertInternalStateToConfiguration(state, EntryConfiguration);
      expect(getAllKeys(configuration)).toEqual([
        'widgetId',
        'widgetNamespace',
        'settings',
        'disabled',
      ]);

      expect(configuration).toHaveLength(EntryConfiguration.length + 1);
      expect(configuration.filter((item) => item.disabled)).toHaveLength(
        EntryConfiguration.length - 2
      );
    });
  });

  describe('convertConfigurationToInternalState', () => {
    it('should return default state if configuration is not array', () => {
      const defaultState = {
        configurableWidget: null,
        items: EntryConfiguration,
        availableItems: [],
      };
      expect(convertConfigurationToInternalState(null, [], EntryConfiguration)).toEqual(
        defaultState
      );
      expect(convertConfigurationToInternalState(undefined, [], EntryConfiguration)).toEqual(
        defaultState
      );
      expect(convertConfigurationToInternalState({ foo: 'bar' }, [], EntryConfiguration)).toEqual(
        defaultState
      );
    });

    it('should label custom items in configuration that are missing from widgets', () => {
      const configuration = [
        {
          widgetId: 'netlify-extension',
          widgetNamespace: WidgetNamespace.EXTENSION,
          settings: {
            netlifyBuildHook: 'http://hook',
          },
        },
        {
          widgetId: 'custom-publish-button',
          widgetNamespace: WidgetNamespace.EXTENSION,
        },
      ];

      const customWidgets = [
        {
          id: 'custom-publish-button',
          namespace: WidgetNamespace.EXTENSION,
          name: 'Custom Publish button',
        },
      ];

      const state = convertConfigurationToInternalState(
        configuration,
        customWidgets,
        EntryConfiguration
      );

      expect(state.items).toEqual([
        {
          widgetId: 'netlify-extension',
          widgetNamespace: WidgetNamespace.EXTENSION,
          settings: {
            netlifyBuildHook: 'http://hook',
          },
          problem: true,
        },
        {
          widgetId: 'custom-publish-button',
          widgetNamespace: WidgetNamespace.EXTENSION,
          name: 'Custom Publish button',
        },
      ]);
    });

    it('should exclude disabled items from item state', () => {
      const allDisabled = EntryConfiguration.map((widget) => ({
        widgetId: widget.widgetId,
        widgetNamespace: widget.widgetNamespace,
        disabled: true,
      }));
      const state = convertConfigurationToInternalState(allDisabled, [], EntryConfiguration);
      expect(state).toEqual({
        configurableWidget: null,
        items: [],
        availableItems: [],
      });
    });

    it('available should contain all available custom widgets', () => {
      const configuration = [
        {
          widgetId: PublicationWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: TasksWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: VersionsWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: UsersWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: 'netlify-extension',
          widgetNamespace: WidgetNamespace.EXTENSION,
          settings: {
            netlifyBuildHook: 'http://hook',
          },
        },
        {
          widgetId: LinksWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: ContentPreviewWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: TranslationWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
      ];

      const customWidgets = [
        {
          id: 'netlify-extension',
          namespace: WidgetNamespace.EXTENSION,
          name: 'Netlify Extension',
          parameters: [
            {
              id: 'netlifyBuildHook',
              name: 'Netlify build hook',
              required: true,
              type: 'Symbol',
            },
          ],
        },
        {
          id: 'custom-publish-button',
          namespace: WidgetNamespace.EXTENSION,
          name: 'Custom Publish button',
        },
      ];

      const state = convertConfigurationToInternalState(
        configuration,
        customWidgets,
        EntryConfiguration
      );

      expect(state).toEqual({
        configurableWidget: null,
        items: [
          PublicationWidget,
          TasksWidget,
          VersionsWidget,
          UsersWidget,
          {
            name: 'Netlify Extension',
            widgetId: 'netlify-extension',
            widgetNamespace: WidgetNamespace.EXTENSION,
            settings: {
              netlifyBuildHook: 'http://hook',
            },
            parameters: [
              {
                id: 'netlifyBuildHook',
                name: 'Netlify build hook',
                required: true,
                type: 'Symbol',
              },
            ],
          },
          LinksWidget,
          ContentPreviewWidget,
          TranslationWidget,
        ],
        availableItems: [
          {
            widgetId: 'netlify-extension',
            widgetNamespace: WidgetNamespace.EXTENSION,
            name: 'Netlify Extension',
            parameters: [
              {
                id: 'netlifyBuildHook',
                name: 'Netlify build hook',
                required: true,
                type: 'Symbol',
              },
            ],
          },
          {
            widgetId: 'custom-publish-button',
            widgetNamespace: WidgetNamespace.EXTENSION,
            name: 'Custom Publish button',
          },
        ],
      });
    });
  });
});
