import * as React from 'react';
import _ from 'lodash';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { LocalesListRoute, LocalesNewRoute, LocalesEditRoute } from 'features/locales-management';
import { getModule } from 'core/NgRegistry';
import { go } from 'states/Navigator';

function withUnsavedChangesDialog(Component) {
  return function WithUnsavedChangesDialog(props) {
    const requestLeaveConfirmation = React.useRef();
    const isDirty = React.useRef(false);

    React.useEffect(() => {
      const $rootScope = getModule('$rootScope');

      const unsubscribe = $rootScope.$on('$stateChangeStart', (event, toState, toStateParams) => {
        if (!isDirty.current || !requestLeaveConfirmation.current) return;

        event.preventDefault();
        requestLeaveConfirmation.current().then((confirmed) => {
          if (!confirmed) return;

          isDirty.current = false;
          return go({ path: toState.name, params: toStateParams });
        });
      });

      return unsubscribe;
    }, []);

    function registerSaveAction(save) {
      requestLeaveConfirmation.current = createUnsavedChangesDialogOpener(save);
    }

    function setDirty(value) {
      isDirty.current = value;
    }

    function goToList() {
      return go({ path: '^.list' });
    }

    return (
      <Component
        {...props}
        goToList={goToList}
        setDirty={setDirty}
        registerSaveAction={registerSaveAction}
      />
    );
  };
}

export const localesSettingsState = {
  name: 'locales',
  url: '/locales',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: LocalesListRoute,
    },
    {
      name: 'new',
      url: '_new',
      component: withUnsavedChangesDialog(LocalesNewRoute),
    },
    {
      name: 'detail',
      url: '/:localeId',
      component: withUnsavedChangesDialog(LocalesEditRoute),
    },
  ],
};
