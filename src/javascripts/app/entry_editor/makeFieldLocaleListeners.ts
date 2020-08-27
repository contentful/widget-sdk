import * as K from 'core/utils/kefir';
import { set, isEqual } from 'lodash';

interface FieldLocaleListener {
  fieldId: string;
  localeCode: string;
  onDisabledChanged: (cb: (val: any) => void) => unknown;
  onSchemaErrorsChanged: (cb: (val: any) => void) => unknown;
}

export type FieldLocaleLookup = Record<string, Record<string, FieldLocaleListener>>;

export const makeFieldLocaleListeners = (controls: any[], $scope: any, $controller: any) => {
  const lookup: FieldLocaleLookup = {};
  const flat: FieldLocaleListener[] = [];

  controls.forEach((widget: any) => {
    const locales = widget.field.localized
      ? $scope.localeData.privateLocales
      : [$scope.localeData.defaultLocale];

    locales.forEach((locale: any) => {
      const fieldLocaleScope = $scope.$new(false);
      fieldLocaleScope.widget = widget;
      fieldLocaleScope.locale = locale;

      const fieldId = widget.fieldId;
      const localeCode = locale.code;
      const { access$, errors$ } = $controller('FieldLocaleController', {
        $scope: fieldLocaleScope,
      });

      const fieldLocale: FieldLocaleListener = {
        fieldId,
        localeCode,
        onDisabledChanged: (cb) =>
          K.onValueScope($scope, access$, (access: any) => cb(!!access.disabled)),
        onSchemaErrorsChanged: (cb) =>
          K.onValueScope($scope, errors$.skipDuplicates(isEqual), (errors = []) => cb(errors)),
      };

      set(lookup, [fieldId, localeCode], fieldLocale);
      flat.push(fieldLocale);
    });
  });

  return { lookup, flat };
};
