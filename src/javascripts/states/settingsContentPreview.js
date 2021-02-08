import * as React from 'react';
import createUnsavedChangesDialogOpener from 'app/common/UnsavedChangesDialog';
import {
  ContentPreviewListRoute,
  ContentPreviewNewRoute,
  ContentPreviewEditRoute,
} from 'features/content-preview';
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

    return <Component {...props} setDirty={setDirty} registerSaveAction={registerSaveAction} />;
  };
}

export const contentPreviewState = {
  name: 'content_preview',
  url: '/content_preview',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: ContentPreviewListRoute,
    },
    {
      name: 'new',
      url: '/new',
      component: withUnsavedChangesDialog(ContentPreviewNewRoute),
    },
    {
      name: 'detail',
      url: '/:contentPreviewId',
      component: withUnsavedChangesDialog(ContentPreviewEditRoute),
    },
  ],
};
