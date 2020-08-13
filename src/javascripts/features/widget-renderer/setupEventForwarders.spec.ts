import { setupEventForwarders } from './setupEventForwarders';
import { PostMessageChannel } from './PostMessageChannel';
import {
  DialogExtensionSDK,
  EditorExtensionSDK,
  FieldExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import { WidgetLocation } from './interfaces';
import { ChannelEvent } from './channelTypes';

describe('setupEventForwarders', () => {
  let send: jest.Mock;
  let channel: PostMessageChannel;

  beforeEach(() => {
    send = jest.fn();
    channel = ({ send } as unknown) as PostMessageChannel;
  });

  describe('non-editing locations', () => {
    it('does not attempt to set up any forwarders', () => {
      // Passing empty SDK. Will throw if we'll try to set up any forwarder
      const sdk = {} as DialogExtensionSDK;
      const off = setupEventForwarders(channel, sdk, WidgetLocation.DIALOG);

      // Should return a function (technically a noop)
      expect(typeof off).toBe('function');
      off();
    });
  });

  describe('entry editing location', () => {
    it('sets up forwarders (4)', () => {
      let offCount = 0;
      const incrementOffCount = () => (offCount += 1);

      // Provide only methods we use
      const sdk = ({
        entry: {
          onSysChanged: jest.fn().mockReturnValue(incrementOffCount),
        },
        editor: {
          onLocaleSettingsChanged: jest.fn().mockReturnValue(incrementOffCount),
          onShowDisabledFieldsChanged: jest.fn().mockReturnValue(incrementOffCount),
        },
        navigator: {
          onSlideInNavigation: jest.fn().mockReturnValue(incrementOffCount),
        },
      } as unknown) as EditorExtensionSDK;

      const off = setupEventForwarders(channel, sdk, WidgetLocation.ENTRY_EDITOR);

      const mocks = [
        sdk.entry.onSysChanged,
        sdk.editor.onLocaleSettingsChanged,
        sdk.editor.onShowDisabledFieldsChanged,
        sdk.navigator.onSlideInNavigation,
      ] as jest.Mock[];

      const channelEvents = [
        ChannelEvent.SysChanged,
        ChannelEvent.LocaleSettingsChanged,
        ChannelEvent.ShowDisabledFieldsChanged,
        ChannelEvent.OnSlideInNavigation,
      ];

      mocks.forEach((fn, i) => {
        // Make sure handlers were registered
        expect(fn).toHaveBeenCalledTimes(1);

        // Make sure events were forwarded to the channel
        const handler = fn.mock.calls[0][0];
        send.mockClear();
        handler('data');
        expect(send).toHaveBeenCalledWith(channelEvents[i], ['data']);
      });

      // We should unsubscribe to 4 events
      off();
      expect(offCount).toBe(mocks.length);
    });
  });

  describe('field editing location', () => {
    it('sets up entry forwarders (4), legacy forwarders (2) and field-locale forwarders (number is content type specific)', () => {
      let offCount = 0;
      const incrementOffCount = () => (offCount += 1);

      const makeFieldLocaleMocks = () => ({
        onValueChanged: jest.fn().mockReturnValue(incrementOffCount),
        onIsDisabledChanged: jest.fn().mockReturnValue(incrementOffCount),
        onSchemaErrorsChanged: jest.fn().mockReturnValue(incrementOffCount),
      });

      const fieldLocales = {
        title: {
          en: makeFieldLocaleMocks(),
          pl: makeFieldLocaleMocks(),
        },
        content: {
          en: makeFieldLocaleMocks(),
        },
      };

      // Provide only methods we use
      const sdk = ({
        entry: {
          onSysChanged: jest.fn().mockReturnValue(incrementOffCount),
          fields: {
            // Two field-locales
            title: {
              id: 'title',
              locales: ['en', 'pl'],
              getForLocale: (localeCode: string) => fieldLocales.title[localeCode],
            },
            // One field-locale
            content: {
              id: 'content',
              locales: ['en'],
              getForLocale: () => fieldLocales.content.en,
            },
          },
        },
        editor: {
          onLocaleSettingsChanged: jest.fn().mockReturnValue(incrementOffCount),
          onShowDisabledFieldsChanged: jest.fn().mockReturnValue(incrementOffCount),
        },
        navigator: {
          onSlideInNavigation: jest.fn().mockReturnValue(incrementOffCount),
        },
        field: {
          onIsDisabledChanged: jest.fn().mockReturnValue(incrementOffCount),
          onSchemaErrorsChanged: jest.fn().mockReturnValue(incrementOffCount),
        },
      } as unknown) as FieldExtensionSDK;

      const off = setupEventForwarders(channel, sdk, WidgetLocation.ENTRY_FIELD);

      // Non field-locale events
      const mocks = [
        sdk.entry.onSysChanged,
        sdk.editor.onLocaleSettingsChanged,
        sdk.editor.onShowDisabledFieldsChanged,
        sdk.navigator.onSlideInNavigation,
        sdk.field.onIsDisabledChanged,
        sdk.field.onSchemaErrorsChanged,
      ] as jest.Mock[];

      const channelEvents = [
        ChannelEvent.SysChanged,
        ChannelEvent.LocaleSettingsChanged,
        ChannelEvent.ShowDisabledFieldsChanged,
        ChannelEvent.OnSlideInNavigation,
        ChannelEvent.LegacyIsDisabledChanged,
        ChannelEvent.LegacySchemaErrorsChanged,
      ];

      mocks.forEach((fn, i) => {
        // Make sure handlers were registered
        expect(fn).toHaveBeenCalledTimes(1);

        // Make sure events were forwarded to the channel
        const handler = fn.mock.calls[0][0];
        send.mockClear();
        handler('data');
        expect(send).toHaveBeenCalledWith(channelEvents[i], ['data']);
      });

      // Field-locale events
      const fieldLocaleMethods = ['onValueChanged', 'onIsDisabledChanged', 'onSchemaErrorsChanged'];

      const fieldLocaleEvents = [
        ChannelEvent.ValueChanged,
        ChannelEvent.IsDisabledChangedForFieldLocale,
        ChannelEvent.SchemaErrorsChangedForFieldLocale,
      ];

      const fieldLocaleList = [
        ['title', 'en'],
        ['title', 'pl'],
        ['content', 'en'],
      ];

      fieldLocaleList.forEach(([fieldId, localeCode]) => {
        fieldLocaleMethods.forEach((method, i) => {
          const fn = fieldLocales[fieldId][localeCode][method];

          // Make sure handlers were registered
          expect(fn).toHaveBeenCalledTimes(1);

          // Make sure events were forwarded to the channel
          const handler = fn.mock.calls[0][0];
          send.mockClear();
          handler('data');
          expect(send).toHaveBeenCalledWith(fieldLocaleEvents[i], [fieldId, localeCode, 'data']);
        });
      });

      off();
      expect(offCount).toBe(mocks.length + fieldLocaleList.length * fieldLocaleMethods.length);
    });
  });
});
