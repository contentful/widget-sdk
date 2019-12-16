/* eslint-disable rulesdir/restrict-inline-styles */

import React from 'react';

import isNumber from 'lodash/isNumber';
import { Modal } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher';

import ExtensionIFrameRenderer from '../ExtensionIFrameRenderer';
import * as Dialogs from '../ExtensionDialogs';
import { applyDefaultValues } from '../WidgetParametersUtils';
import trackExtensionRender from '../TrackExtensionRender';
import { LOCATION_DIALOG } from '../WidgetLocations';
import * as entitySelector from 'search/EntitySelector/entitySelector';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';

import createDialogExtensionBridge from './createDialogExtensionBridge';

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt
};

export default function makeExtensionDialogsHandlers(dependencies) {
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

    const [descriptor] = await getCustomWidgetLoader().getByIds([options.id]);
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

    const dialogKey = Date.now().toString();

    return ModalLauncher.open(({ isShown, onClose }) => {
      // We're passing `openDialog` (function above) down
      // to the bridge so it doesn't circularly imports
      // this module. You can open dialogs from dialogs
      // (INCEPTION HORN).
      const bridge = createDialogExtensionBridge(dependencies, openDialog, onClose);

      const onCloseHandler = () => onClose();

      const size = isNumber(options.width) ? `${options.width}px` : options.width;

      return (
        <Modal
          key={dialogKey}
          shouldCloseOnOverlayClick={options.shouldCloseOnOverlayClick || false}
          shouldCloseOnEscapePress={options.shouldCloseOnEscapePress || false}
          allowHeightOverflow={options.allowHeightOverflow || false}
          position={options.position || 'center'}
          isShown={isShown}
          onClose={onCloseHandler}
          size={size || '700px'}>
          {() => (
            <>
              {options.title && <Modal.Header title={options.title} onClose={onCloseHandler} />}
              <div style={{ minHeight: options.minHeight || 'auto' }}>
                <ExtensionIFrameRenderer
                  bridge={bridge}
                  descriptor={descriptor}
                  parameters={parameters}
                />
              </div>
            </>
          )}
        </Modal>
      );
    });
  }
}
