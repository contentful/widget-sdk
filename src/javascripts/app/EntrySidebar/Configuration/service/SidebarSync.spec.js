import {
  convertInternalStateToConfiguration,
  convertConfigurationToInternalState,
} from './SidebarSync';
import { flatten, uniq } from 'lodash';
import { SidebarType } from '../constants';
import {
  EntryConfiguration,
  Publication as PublicationWidget,
  Tasks as TasksWidget,
  Versions as VersionsWidget,
  ContentPreview as ContentPreviewWidget,
  Links as LinksWidget,
  Translation as TranslationWidget,
  Users as UsersWidget,
  Schedule as ScheduleWidget,
  Releases as ReleasesWidget,
} from '../defaults';
import { WidgetNamespace } from 'features/widget-renderer';

function getAllKeys(arr) {
  return uniq(flatten(arr.map((item) => Object.keys(item))));
}

describe('EntrySidebar/Configuration/SidebarSync', () => {
  describe('convertInternalStateToConfiguration', () => {
    it('should be nullable if default config is selected', () => {
      expect(
        convertInternalStateToConfiguration(
          {
            sidebarType: SidebarType.default,
            items: EntryConfiguration,
          },
          EntryConfiguration
        )
      ).toBeUndefined();
    });

    it('should return valid configuration with disabled defaults and ignore problem items', () => {
      const items = [
        PublicationWidget,
        VersionsWidget,
        {
          widgetId: 'some-custom-extension',
          widgetNamespace: WidgetNamespace.EXTENSION,
        },
        {
          widgetId: 'some-problem-extension-that-was-deleted',
          widgetNamespace: WidgetNamespace.EXTENSION,
          problem: true,
        },
      ];
      const state = {
        sidebarType: SidebarType.custom,
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
    it('should return default state is configuration is not array', () => {
      const defaultState = {
        sidebarType: SidebarType.default,
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

    it('should split configuration to items and availableItems', () => {
      const allDisabled = EntryConfiguration.map((widget) => ({
        widgetId: widget.widgetId,
        widgetNamespace: widget.widgetNamespace,
        disabled: true,
      }));
      const state = convertConfigurationToInternalState(allDisabled, [], EntryConfiguration);
      expect(state).toEqual({
        sidebarType: SidebarType.custom,
        configurableWidget: null,
        items: [],
        availableItems: EntryConfiguration,
      });
      expect(getAllKeys(state.availableItems)).toEqual([
        'widgetId',
        'widgetNamespace',
        'name',
        'description',
      ]);
    });

    it('should mark as problem non-existent builtin items and all extensions that are not installed in space', () => {
      const configuration = [
        {
          widgetId: PublicationWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: ScheduleWidget.widgetId,
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
          widgetId: 'some-extension-that-is-not-installed',
          widgetNamespace: WidgetNamespace.EXTENSION,
        },
        {
          widgetId: UsersWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
          disabled: true,
        },
        {
          widgetId: 'looks-like-in-invalid-built-in',
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
      ];

      const state = convertConfigurationToInternalState(configuration, [], EntryConfiguration);

      expect(state).toEqual({
        sidebarType: SidebarType.custom,
        configurableWidget: null,
        items: [
          PublicationWidget,
          ScheduleWidget,
          TasksWidget,
          VersionsWidget,
          {
            widgetId: 'some-extension-that-is-not-installed',
            widgetNamespace: WidgetNamespace.EXTENSION,
            problem: true,
          },
          {
            widgetId: 'looks-like-in-invalid-built-in',
            widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
            problem: true,
          },
        ],
        availableItems: [
          ReleasesWidget,
          ContentPreviewWidget,
          LinksWidget,
          TranslationWidget,
          UsersWidget,
        ],
      });
    });

    it('should push to available only those extension that are not installed', () => {
      const configuration = [
        {
          widgetId: PublicationWidget.widgetId,
          widgetNamespace: WidgetNamespace.SIDEBAR_BUILTIN,
        },
        {
          widgetId: ScheduleWidget.widgetId,
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

      const state = convertConfigurationToInternalState(
        configuration,
        [
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
        ],
        EntryConfiguration
      );

      expect(state).toEqual({
        sidebarType: SidebarType.custom,
        configurableWidget: null,
        items: [
          PublicationWidget,
          ScheduleWidget,
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
          ReleasesWidget,
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
