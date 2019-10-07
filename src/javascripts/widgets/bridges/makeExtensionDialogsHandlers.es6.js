import React from 'react';

import { Modal } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import ExtensionIFrameRenderer from '../ExtensionIFrameRenderer.es6';
import * as Dialogs from '../ExtensionDialogs.es6';
import { applyDefaultValues } from '../WidgetParametersUtils.es6';
import trackExtensionRender from '../TrackExtensionRender.es6';
import { LOCATION_DIALOG } from '../WidgetLocations.es6';
import * as WidgetStore from '../WidgetStore.es6';
import * as entitySelector from 'search/EntitySelector/entitySelector.es6';

import createDialogExtensionBridge from './createDialogExtensionBridge.es6';
import checkDependencies from './checkDependencies.es6';

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt
};

export default function makeExtensionDialogsHandlers(dependencies) {
  const { spaceContext } = checkDependencies('ExtensionDialogsHandlers', dependencies, [
    'spaceContext'
  ]);

  return openDialog;

  async function openDialog(type, options) {
    if (Object.keys(SIMPLE_DIALOG_TYPE_TO_OPENER).includes(type)) {
      const open = SIMPLE_DIALOG_TYPE_TO_OPENER[type];
      return open(options);
    }

    if (type === 'entitySelector') {
      return entitySelector.openFromExtension(options);
    }

    if (type === 'extension') {
      return openExtensionDialog(options);
    }

    throw new Error('Unknown dialog type.');
  }

  async function openExtensionDialog(options) {
    if (!options.id) {
      throw new Error('No Extension ID provided.');
    }

    const descriptor = await WidgetStore.getForSingleExtension(
      spaceContext.extensionLoader,
      options.id
    );

    if (!descriptor) {
      throw new Error(`No Extension with ID "${options.id}" found.`);
    }

    const parameters = {
      // No instance parameters for dialogs.
      instance: {},
      // Regular installation parameters.
      installation: applyDefaultValues(
        descriptor.installationParameters.definitions,
        descriptor.installationParameters.values
      ),
      // Parameters passed directly to the dialog.
      invocation: options.parameters || {}
    };

    trackExtensionRender(LOCATION_DIALOG, descriptor);

    return ModalLauncher.open(({ isShown, onClose }) => {
      // We're passing `openDialog` (function above) down
      // to the bridge so it doesn't circularly imports
      // this module. You can open dialogs from dialogs
      // (INCEPTION HORN).
      const bridge = createDialogExtensionBridge(dependencies, openDialog, onClose);

      return (
        <Modal
          key={`${Date.now()}`}
          shouldCloseOnOverlayClick={options.shouldCloseOnOverlayClick || false}
          shouldCloseOnEscapePress={options.shouldCloseOnEscapePress || false}
          position={options.position || 'center'}
          isShown={isShown}
          onClose={onClose}
          size={`${options.width || 700}px`}>
          {() => (
            <>
              {options.title && <Modal.Header title={options.title} onClose={() => onClose()} />}
              <ExtensionIFrameRenderer
                bridge={bridge}
                descriptor={descriptor}
                parameters={parameters}
              />
            </>
          )}
        </Modal>
      );
    });
  }
}
