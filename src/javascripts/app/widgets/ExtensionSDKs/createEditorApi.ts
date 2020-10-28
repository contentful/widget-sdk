import { EditorInterface, SharedEditorSDK } from 'contentful-ui-extensions-sdk';
import { Proxy, WatchFunction } from 'core/services/proxy';
import { Locale } from './createLocalesApi';

type Callback = (value: any) => any;
type UnsubscribeFn = () => void;
type ValueGetterFn = () => any;

export interface LocaleData {
  activeLocales?: Locale[];
  isSingleLocaleModeOn?: boolean;
  focusedLocale?: Locale;
}

export interface Preferences {
  showDisabledFields?: boolean;
}

export function createEditorApi({
  editorInterface,
  getLocaleData,
  getPreferences,
}: {
  editorInterface: EditorInterface;
  getLocaleData: () => Proxy<LocaleData>;
  getPreferences: () => Proxy<Preferences>;
}): SharedEditorSDK['editor'] {
  return {
    editorInterface,
    onLocaleSettingsChanged: makeHandler<LocaleData>(
      getLocaleData(),
      ['activeLocales', 'isSingleLocaleModeOn', 'focusedLocale'],
      getLocaleSettings
    ),
    onShowDisabledFieldsChanged: makeHandler<Preferences>(
      getPreferences(),
      ['showDisabledFields'],
      () => !!getPreferences().showDisabledFields
    ),
  };

  function makeHandler<T>(target: Proxy<T>, keys: (keyof T)[], getCallbackValue: ValueGetterFn) {
    const handlers: Callback[] = [];
    let unsubscribe: UnsubscribeFn | null = null;

    const subscribeOrUnsubscribe = () => {
      if (!unsubscribe && handlers.length > 0) {
        const watchFunction: WatchFunction<T> = ({ key }) => {
          if (keys.includes(key as keyof T)) {
            handlers.forEach((cb) => cb(getCallbackValue()));
          }
        };
        unsubscribe = target._proxy?.subscribe(watchFunction);
      }

      if (unsubscribe && handlers.length < 1) {
        unsubscribe();
        unsubscribe = null;
      }
    };

    return function (cb: Callback) {
      handlers.push(cb);
      subscribeOrUnsubscribe();

      return () => {
        handlers.splice(handlers.indexOf(cb), 1);
        subscribeOrUnsubscribe();
      };
    };
  }

  function getLocaleSettings() {
    const localeData = getLocaleData();
    const mode = localeData.isSingleLocaleModeOn ? 'single' : 'multi';

    if (mode === 'single') {
      const { focusedLocale } = localeData;
      return {
        mode,
        focused: focusedLocale ? focusedLocale.code : undefined,
      };
    }

    const activeLocales = localeData.activeLocales || [];
    return {
      mode,
      active: activeLocales.map((locale) => locale.code).filter((code) => code),
    };
  }
}
