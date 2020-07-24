import TheLocaleStore from 'services/localeStore';

const getAllFieldLocales = ($scope, $controller, contentType) =>
  (contentType.fields ?? []).reduce((acc, field) => {
    const fieldLocales = field.localized
      ? TheLocaleStore.getPrivateLocales()
      : [TheLocaleStore.getDefaultLocale()]
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

export default getAllFieldLocales;
