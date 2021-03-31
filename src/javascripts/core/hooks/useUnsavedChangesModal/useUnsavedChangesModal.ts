import * as React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { go } from 'states/Navigator';
import { getModule } from 'core/NgRegistry';

export function useUnsavedChangesModal() {
  const requestLeaveConfirmation = React.useRef<Function>();
  const isDirty = React.useRef(false);

  React.useEffect(() => {
    const $rootScope = getModule('$rootScope');

    const unsubscribe = $rootScope.$on('$stateChangeStart', (event, toState, toStateParams) => {
      if (!isDirty.current || typeof requestLeaveConfirmation.current !== 'function') return;

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

  return { registerSaveAction, setDirty };
}
