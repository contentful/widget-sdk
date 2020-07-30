import { EditorInterface, SharedEditorSDK } from 'contentful-ui-extensions-sdk';

type Callback = (value: any) => any;

export function createEditorApi({
  editorInterface,
  $scope,
}: {
  editorInterface: EditorInterface;
  $scope: any;
}): SharedEditorSDK['editor'] {
  return {
    editorInterface,
    onLocaleSettingsChanged: makeHandler(
      ['localeData.activeLocales', 'localeData.isSingleLocaleModeOn', 'localeData.focusedLocale'],
      getLocaleSettings
    ),
    onShowDisabledFieldsChanged: makeHandler(
      ['preferences.showDisabledFields'],
      () => $scope.preferences.showDisabledFields
    ),
  };

  function makeHandler(watchExpressions: string[], getCallbackValue: () => any) {
    const handlers: Callback[] = [];
    let unsubscribe: null | (() => void) = null;

    const subscribeOrUnsubscribe = () => {
      if (!unsubscribe && handlers.length > 0) {
        const unsubscribeFns = watchExpressions.map((exp) => {
          return $scope.$watch(exp, () => {
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
    const mode = $scope.localeData.isSingleLocaleModeOn ? 'single' : 'multi';
    if (mode === 'single') {
      const focusedLocale = $scope.localeData.focusedLocale;
      return {
        mode,
        focused: focusedLocale ? focusedLocale.code : undefined,
      };
    }
    const activeLocales = $scope.localeData.activeLocales || [];
    return {
      mode,
      active: activeLocales.map((locale) => locale.code).filter((code) => code),
    };
  }
}
