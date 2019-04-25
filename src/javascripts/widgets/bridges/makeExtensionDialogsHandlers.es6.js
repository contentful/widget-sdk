import React from 'react';
import { get } from 'lodash';

import { Modal } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import { getExtensionsById } from '../ExtensionLoader.es6';
import ExtensionIFrameRenderer from '../ExtensionIFrameRenderer.es6';
import * as Dialogs from '../ExtensionDialogs.es6';
import { applyDefaultValues } from '../WidgetParametersUtils.es6';

import createDialogExtensionBridge from './createDialogExtensionBridge.es6';

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt
};

export default function makeExtensionDialogsHandlers(dependencies) {
  const { entitySelector, spaceContext } = dependencies;

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

    const [extension] = await getExtensionsById(
      spaceContext.getId(),
      spaceContext.getEnvironmentId(),
      [options.id]
    );

    if (!extension) {
      throw new Error('no extension found');
    }

    const descriptor = {
      id: options.id,
      ...extension.extension
    };

    return ModalLauncher.open(({ isShown, onClose }) => {
      // We're passing `openDialog` (function above) down
      // to the bridge so it doesn't circularly imports
      // this module. You can open dialogs from dialogs
      // (INCEPTION HORN).
      const bridge = createDialogExtensionBridge(dependencies, openDialog, onClose);

      const parameters = {
        // No instance parameters for dialogs.
        instance: {},
        // Regular installation parameters.
        installation: applyDefaultValues(
          get(extension, ['extension', 'parameters', 'installation'], []),
          extension.parameters || {}
        ),
        // Parameters passed directly to the dialog.
        invocation: options.parameters || {}
      };

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
            <React.Fragment>
              {options.title && <Modal.Header title={options.title} onClose={() => onClose()} />}
              <ExtensionIFrameRenderer
                bridge={bridge}
                descriptor={descriptor}
                parameters={parameters}
              />
            </React.Fragment>
          )}
        </Modal>
      );
    });
  }
}
