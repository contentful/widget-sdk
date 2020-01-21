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
import { NAMESPACE_EXTENSION, NAMESPACE_APP } from '../WidgetNamespaces';
import * as entitySelector from 'search/EntitySelector/entitySelector';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { buildAppDefinitionWidget } from 'widgets/WidgetTypes';

import createDialogExtensionBridge from './createDialogExtensionBridge';

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt
};

export default function makeExtensionDialogsHandlers(dependencies) {
  return openDialog;

  async function openDialog(type, options = {}) {
    if (Object.keys(SIMPLE_DIALOG_TYPE_TO_OPENER).includes(type)) {
      const open = SIMPLE_DIALOG_TYPE_TO_OPENER[type];
      return open(options);
    }

    if (type === 'entitySelector') {
      return entitySelector.openFromExtension(options);
    }

    if ([NAMESPACE_EXTENSION, NAMESPACE_APP].includes(type)) {
      return openCustomDialog(type, options);
    }

    throw new Error('Unknown dialog type.');
  }

  async function findWidget(namespace, id) {
    const key = [namespace, id];
    const [descriptor] = await getCustomWidgetLoader().getByKeys([key]);

    // If a descriptor was found, meaning that an app or an extension
    // are already installed, just return it.
    if (descriptor) {
      return descriptor;
    }

    // If there is no descriptor but we're in the installation
    // process, create a descriptor out of AppDefinition.
    const { appDefinition } = dependencies;
    if (namespace === NAMESPACE_APP && appDefinition) {
      return buildAppDefinitionWidget(appDefinition);
    }

    throw new Error(`No widget with ID "${id}" found in "${namespace}" namespace.`);
  }

  async function openCustomDialog(namespace, options) {
    if (!options.id) {
      throw new Error('No ID provided.');
    }

    const descriptor = await findWidget(namespace, options.id);

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
