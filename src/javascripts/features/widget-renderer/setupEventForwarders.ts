import { EditorExtensionSDK, KnownSDK, FieldExtensionSDK } from "contentful-ui-extensions-sdk";
import { PostMessageChannel } from "./PostMessageChannel";
import { WidgetLocation } from "./interfaces";

export function setupEventForwarders(channel: PostMessageChannel, sdk: KnownSDK, location: WidgetLocation) {
  const cleanupTasks: Function[] = [];

  if ([
    WidgetLocation.ENTRY_FIELD,
    WidgetLocation.ENTRY_SIDEBAR,
    WidgetLocation.ENTRY_FIELD_SIDEBAR,
    WidgetLocation.ENTRY_EDITOR
  ].includes(location)) {
    const specificSdk = sdk as EditorExtensionSDK;

    const off1 = sdk.entry.onSysChanged(sys => {
      channel.send('sysChanged', [sys])
    })

    const off2 = specificSdk.editor.onLocaleSettingsChanged(settings => {
      channel.send('localeSettingsChanged', [settings]);
    })

    const off3 = specificSdk.editor.onShowDisabledFieldsChanged(showDisabledFields => {
      channel.send('showDisabledFieldsChanged', [showDisabledFields])
    })

    const off4 = specificSdk.navigator.onSlideInNavigation(slide => {
      channel.send('onSlideInNavigation', [slide])
    })

    cleanupTasks.push(off1, off2, off3, off4);
  }

  if ([WidgetLocation.ENTRY_FIELD, WidgetLocation.ENTRY_FIELD_SIDEBAR].includes(location)) {
    const specificSdk = sdk as FieldExtensionSDK

    Object.values(specificSdk.entry.fields).forEach((field) => {
      field.locales.forEach((localeCode: string) => {
        const fieldLocale = field.getForLocale(localeCode);
        const makeParams = (value: any) => [field.id, localeCode, value];

        // Value changes
        const off1 = fieldLocale.onValueChanged(fieldValue => {
          channel.send('valueChanged', makeParams(fieldValue))
        })

        // Disabled state changes
        const off2 = fieldLocale.onIsDisabledChanged((isDisabled: boolean) => {
          channel.send('isDisabledChangedForFieldLocale', makeParams(isDisabled))
        });

        // Error changes
        const off3 = fieldLocale.onSchemaErrorsChanged((errors: any) => {
          channel.send('schemaErrorsChangedForFieldLocale', makeParams(errors))
        })

        cleanupTasks.push(off1, off2, off3)
      });
    });
  }

  return () => cleanupTasks.forEach(off => off())
}
