import TheLocaleStore from 'services/localeStore';

const getAllFieldLocales = ($scope, $controller) =>
  Object.values($scope.fields).reduce((acc, field) => {
    const widget = $scope.widgets.find((w) => w.fieldId === field.id);

    if (!widget) {
      return acc;
    }

    const fieldLocales = field.locales
      .map((localeCode) => {
        const locale = TheLocaleStore.getPrivateLocales().find((l) => l.code == localeCode);

        if (!locale) {
          return;
        }

        const fieldLocaleScope = $scope.$new(false);
        fieldLocaleScope.widget = widget;
        fieldLocaleScope.locale = locale;

        return {
          fieldId: field.id,
          localeCode,
          fieldLocale: $controller('FieldLocaleController', {
            $scope: fieldLocaleScope,
          }),
        };
      })
      .filter(Boolean);

    return acc.concat(fieldLocales);
  }, []);

export default getAllFieldLocales;
