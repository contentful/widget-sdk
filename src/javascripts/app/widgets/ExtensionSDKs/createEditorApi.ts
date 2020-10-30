import { EditorInterface, SharedEditorSDK } from 'contentful-ui-extensions-sdk';
import { Locale } from './createLocalesApi';

type Callback = (value: any) => any;
type UnsubscribeFn = () => void;
type ValueGetterFn = () => any;

interface LocaleData {
  activeLocales?: Locale[];
  isSingleLocaleModeOn?: boolean;
  focusedLocale?: Locale;
}

interface Preferences {
  showDisabledFields?: boolean;
}

export type WatchFunction = (watchFn: ValueGetterFn, cb: Callback) => UnsubscribeFn;

export function createEditorApi({
  editorInterface,
  getLocaleData,
  getPreferences,
  watch,
}: {
  editorInterface: EditorInterface;
  getLocaleData: () => LocaleData;
  getPreferences: () => Preferences;
  watch: WatchFunction;
}): SharedEditorSDK['editor'] {
  return {
    editorInterface,
    onLocaleSettingsChanged: makeHandler(
      [
        () => getLocaleData().activeLocales,
        () => getLocaleData().isSingleLocaleModeOn,
        () => getLocaleData().focusedLocale,
      ],
      getLocaleSettings
    ),
    onShowDisabledFieldsChanged: makeHandler(
      [() => getPreferences().showDisabledFields],
      () => !!getPreferences().showDisabledFields
    ),
  };

  function makeHandler(watchFns: ValueGetterFn[], getCallbackValue: ValueGetterFn) {
    const handlers: Callback[] = [];
    let unsubscribe: UnsubscribeFn | null = null;

    const subscribeOrUnsubscribe = () => {
      if (!unsubscribe && handlers.length > 0) {
        const unsubscribeFns = watchFns.map((watchFn) => {
          return watch(watchFn, () => {
            handlers.forEach((cb) => cb(getCallbackValue()));
          });
        });
        unsubscribe = () => unsubscribeFns.forEach((off) => off());
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
