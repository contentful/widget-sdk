import React, { useEffect } from 'react';
import { ModalLauncher } from '@contentful/forma-36-react-components';

import { getModule } from 'core/NgRegistry';
import { go } from 'states/Navigator';

import { ConfirmNavigateModal } from '../components/ConfirmNavigateModal';

function useNavigationWarn(selectedTemplate, pending) {
  useEffect(() => {
    let offStateChangeStart;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // We want to ensure that users don't click away if their space is not yet created
    // or if the template is actively being created
    if (pending) {
      const $rootScope = getModule('$rootScope');

      // Angular $on functions return a callback that is the event listener
      // remover, rather than $rootScope.$off.
      offStateChangeStart = $rootScope.$on(
        '$stateChangeStart',
        async (event, toState, toParams) => {
          event.preventDefault();

          const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
            <ConfirmNavigateModal
              isShown={isShown}
              onClose={onClose}
              withTemplate={!!selectedTemplate}
            />
          ));

          if (confirmed) {
            offStateChangeStart();

            go({
              path: toState,
              params: toParams,
            });
          }
        }
      );

      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      offStateChangeStart && offStateChangeStart();
    };
  }, [selectedTemplate, pending]);
}

export { useNavigationWarn };
