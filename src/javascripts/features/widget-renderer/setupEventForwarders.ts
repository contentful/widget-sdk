import { EditorExtensionSDK, KnownSDK, FieldExtensionSDK } from 'contentful-ui-extensions-sdk';
import { PostMessageChannel } from './PostMessageChannel';
import { WidgetLocation } from './interfaces';
import { ChannelEvent } from './channelTypes';
import { isEntryEditingLocation, isFieldEditingLocation } from './utils';

export function setupEventForwarders(
  channel: PostMessageChannel,
  sdk: KnownSDK,
  location: WidgetLocation
) {
  const cleanupTasks: Function[] = [];

  if (isEntryEditingLocation(location)) {
    const specificSdk = sdk as EditorExtensionSDK;

    const off1 = sdk.entry.onSysChanged((sys) => {
      channel.send(ChannelEvent.SysChanged, [sys]);
    });

    const off2 = specificSdk.editor.onLocaleSettingsChanged((settings) => {
      channel.send(ChannelEvent.LocaleSettingsChanged, [settings]);
    });

    const off3 = specificSdk.editor.onShowDisabledFieldsChanged((showDisabledFields) => {
      channel.send(ChannelEvent.ShowDisabledFieldsChanged, [showDisabledFields]);
    });

    const off4 = specificSdk.navigator.onSlideInNavigation((slide) => {
      channel.send(ChannelEvent.OnSlideInNavigation, [slide]);
    });

    cleanupTasks.push(off1, off2, off3, off4);
  }

  if (isFieldEditingLocation(location)) {
    const specificSdk = sdk as FieldExtensionSDK;

    Object.values(specificSdk.entry.fields).forEach((field) => {
      field.locales.forEach((localeCode: string) => {
        const fieldLocale = field.getForLocale(localeCode);
        const makeParams = (value: any) => [field.id, localeCode, value];

        // Value changes
        const off1 = fieldLocale.onValueChanged((fieldValue) => {
          channel.send(ChannelEvent.ValueChanged, makeParams(fieldValue));
        });

        // Disabled state changes
        const off2 = fieldLocale.onIsDisabledChanged((isDisabled: boolean) => {
          channel.send(ChannelEvent.IsDisabledChangedForFieldLocale, makeParams(isDisabled));
        });

        // Error changes
        const off3 = fieldLocale.onSchemaErrorsChanged((errors: any) => {
          channel.send(ChannelEvent.SchemaErrorsChangedForFieldLocale, makeParams(errors));
        });

        cleanupTasks.push(off1, off2, off3);
      });

      // Legacy events, scoped to the current field. New versions of the SDK
      // don't listen to them, they use field-locale information included
      // in events broadcasted above.
      const off1 = specificSdk.field.onIsDisabledChanged((isDisabled: boolean) => {
        channel.send(ChannelEvent.LegacyIsDisabledChanged, [isDisabled]);
      });

      const off2 = specificSdk.field.onSchemaErrorsChanged((errors: any) => {
        channel.send(ChannelEvent.LegacySchemaErrorsChanged, [errors]);
      });

      cleanupTasks.push(off1, off2);
    });
  }

  return () => cleanupTasks.forEach((off) => off());
}
