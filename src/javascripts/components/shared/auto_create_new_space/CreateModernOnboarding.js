import {name as choiceScreenName} from '../stack-onboarding/screens/ChoiceScreen';

export const name = 'createModernOnboarding';

angular.module('contentful')
.factory(name, ['require', function (require) {
  const modalDialog = require('modalDialog');
  const $rootScope = require('$rootScope');
  const { getStore } = require('TheStore');

  const store = getStore();

  return {
    create: ({ onDefaultChoice, org }) => {
      const scope = $rootScope.$new();
      let dialog;
      const closeModal = () => {
        dialog && dialog.destroy();
      };
      scope.props = {
        onDefaultChoice: () => {
          closeModal();
          onDefaultChoice();
        },
        closeModal,
        orgId: org.sys.id
      };

      dialog = modalDialog.open({
        title: 'Space auto creation',
        template: `<react-component name="${choiceScreenName}" props="props"></react-component`,
        backgroundClose: false,
        ignoreEsc: true,
        // we don't want to close this modal after we create new space
        // so url will be different
        persistOnNavigation: true,
        scope
      });
    },
    markSpace: (spaceId) => {
      store.set(getKey(spaceId), true);
    },
    checkSpace: (spaceId) => {
      return Boolean(store.get(getKey(spaceId)));
    }
  };

  function getKey (spaceId) {
    return `ctfl:${spaceId}:modernStackOnboarding:space`;
  }
}]);
