import { EditorInterface, SharedEditorSDK } from '@contentful/app-sdk';
import { Proxy, WatchFunction, ObjectOrArrayKey } from 'core/services/proxy';
import { Locale } from './createLocalesApi';

type Callback = (value: any) => any;
type UnsubscribeFn = () => void;
type ValueGetterFn = <T>(arg: T) => any;

export interface LocaleData {
  activeLocales?: Locale[];
  isSingleLocaleModeOn?: boolean;
  focusedLocale?: Locale;
}

export interface Preferences {
  showDisabledFields?: boolean;
  hasInitialFocus?: boolean;
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
      getLocaleDataSettings
    ),
    onShowDisabledFieldsChanged: makeHandler<Preferences>(
      getPreferences(),
      ['showDisabledFields'],
      getPreferencesSettings
    ),
  };

  function makeHandler<T>(
    initialTarget: Proxy<T>,
    keys: ObjectOrArrayKey<T>[],
    getCallbackValue: ValueGetterFn
  ) {
    const handlers: Callback[] = [];
    let unsubscribe: UnsubscribeFn | null = null;

    const subscribeOrUnsubscribe = () => {
      if (!unsubscribe && handlers.length > 0) {
        const callHandlers = (target) => {
          handlers.forEach((cb) => cb(getCallbackValue<T>(target)));
        };
        const watchFunction: WatchFunction<T> = ({ target }) => {
          callHandlers(target);
        };
        callHandlers(initialTarget);
        unsubscribe = initialTarget._proxy?.watch(keys, watchFunction);
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

  function getLocaleDataSettings(localeData) {
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

  function getPreferencesSettings(preferences) {
    return !!preferences.showDisabledFields;
  }
}
