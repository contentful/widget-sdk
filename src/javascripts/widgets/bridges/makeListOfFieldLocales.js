import TheLocaleStore from 'services/localeStore';

const getAllFieldLocales = ($scope, $controller, contentType) => {
  return (contentType.fields ?? []).reduce((acc, field) => {
    const locales = field.localized
      ? TheLocaleStore.getPrivateLocales()
      : [TheLocaleStore.getDefaultLocale()];

    const fieldLocales = locales
      .map((locale) => {
        const fieldLocaleScope = $scope.$new(false);
        fieldLocaleScope.widget = { field };
        fieldLocaleScope.locale = locale;

        return {
          fieldId: field.apiName,
          localeCode: locale.code,
          fieldLocale: $controller('FieldLocaleController', {
            $scope: fieldLocaleScope,
          }),
        };
      })
      .filter(Boolean);

    return acc.concat(fieldLocales);
  }, []);
};

export default getAllFieldLocales;
