import * as React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import { go } from 'states/Navigator';
import { getModule } from 'core/NgRegistry';

export type UnsavedChangesModalProps = ReturnType<typeof useUnsavedChangesModal>;

export function withUnsavedChangesDialog<T = {}>(WrappedComponent: React.ComponentType<T>) {
  return function WithUnsavedChangesDialog(props: Omit<T, 'setDirty' | 'registerSaveAction'>) {
    const { registerSaveAction, setDirty } = useUnsavedChangesModal();
    return (
      <WrappedComponent
        {...(props as T)}
        setDirty={setDirty}
        registerSaveAction={registerSaveAction}
      />
    );
  };
}

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

  function registerSaveAction(save: (...args: any[]) => Promise<void>, modal = true) {
    requestLeaveConfirmation.current = modal ? createUnsavedChangesDialogOpener(save) : save;
  }

  function setDirty(value: boolean) {
    isDirty.current = value;
  }

  return { registerSaveAction, setDirty };
}
