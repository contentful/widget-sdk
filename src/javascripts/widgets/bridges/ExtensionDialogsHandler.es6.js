import React from 'react';
import { Modal } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';

import { getExtensionsById } from '../ExtensionLoader.es6';
import ExtensionIFrameRenderer from '../ExtensionIFrameRenderer.es6';
import * as Dialogs from '../ExtensionDialogs.es6';
import createDialogExtensionBridge from './DialogExtensionBridge.es6';

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt
};

export default function makeExtensionDialogsHandler(dependencies) {
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

    return ModalLauncher.open(({ isShown, onClose }) => {
      // We're passing `openDialog` (function above) down
      // to the bridge so it doesn't circularly imports
      // this module. You can open dialogs from dialogs
      // (INCEPTION HORN).
      const bridge = createDialogExtensionBridge(dependencies, openDialog, onClose);

      return (
        <Modal
          key={`${Date.now()}`}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEscapePress={false}
          isShown={isShown}
          onClose={onClose}
          size={`${options.width || 700}px`}>
          <ExtensionIFrameRenderer
            bridge={bridge}
            descriptor={extension.extension}
            parameters={{
              installation: {},
              instance: {}
            }}
          />
        </Modal>
      );
    });
  }
}
