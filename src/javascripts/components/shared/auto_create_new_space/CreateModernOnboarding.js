import {name as choiceScreenName} from '../stack-onboarding/ChoiceScreen';

angular.module('contentful')
.factory('createModernOnboarding', ['require', function (require) {
  const modalDialog = require('modalDialog');
  const $rootScope = require('$rootScope');

  return {
    create: ({ onDefaultChoice, org }) => {
      const scope = $rootScope.$new();
      let dialog;
      scope.props = {
        onDefaultChoice: () => {
          dialog && dialog.destroy();
          onDefaultChoice();
        },
        orgId: org.sys.id
      };

      dialog = modalDialog.open({
        title: 'Space auto creation',
        template: `<react-component name="${choiceScreenName}" props="props"></react-component`,
        backgroundClose: false,
        ignoreEsc: true,
        scope
      });
    }
  };
}]);
