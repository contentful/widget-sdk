/* eslint rulesdir/restrict-inline-styles: "warn" */
import React from 'react';
import isNumber from 'lodash/isNumber';
import { Modal } from '@contentful/forma-36-react-components';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { ExtensionIFrameRendererWithLocalHostWarning } from 'widgets/ExtensionIFrameRenderer';
import * as Dialogs from '../ExtensionDialogs';
import { applyDefaultValues } from '../WidgetParametersUtils';
import trackExtensionRender from '../TrackExtensionRender';
import * as entitySelector from 'search/EntitySelector/entitySelector';
import {
  getCustomWidgetLoader,
  getMarketplaceDataProvider,
} from 'widgets/CustomWidgetLoaderInstance';

import createDialogExtensionBridge from './createDialogExtensionBridge';
import {
  WidgetNamespace,
  isCustomWidget,
  buildAppDefinitionWidget,
  WidgetLocation,
} from 'features/widget-renderer';
import { toLegacyWidget } from 'widgets/WidgetCompat';

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt,
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

    if (isCustomWidget(type)) {
      return openCustomDialog(type, options);
    }

    throw new Error('Unknown dialog type.');
  }

  async function findWidget(widgetNamespace, widgetId) {
    const loader = await getCustomWidgetLoader();
    const widget = await loader.getOne({ widgetNamespace, widgetId });

    // If a widget was found, meaning that an app or an extension
    // are already installed, just return it.
    if (widget) {
      return widget;
    }

    // If there is no widget found but we may be in the installation
    // process, create an artificial widget out of AppDefinition.
    const { appDefinition } = dependencies;
    if (widgetNamespace === WidgetNamespace.APP && appDefinition) {
      return buildAppDefinitionWidget(appDefinition, getMarketplaceDataProvider());
    }

    throw new Error(`No widget with ID "${widgetId}" found in "${widgetNamespace}" namespace.`);
  }

  async function openCustomDialog(namespace, options) {
    if (!options.id) {
      throw new Error('No ID provided.');
    }

    const widget = await findWidget(namespace, options.id);

    const parameters = {
      // No instance parameters for dialogs.
      instance: {},
      // Regular installation parameters.
      installation: applyDefaultValues(
        widget.parameters.installation.definitions,
        widget.parameters.installation.values
      ),
      // Parameters passed directly to the dialog.
      invocation: options.parameters || {},
    };

    trackExtensionRender(WidgetLocation.DIALOG, toLegacyWidget(widget));

    const dialogKey = Date.now().toString();

    return ModalLauncher.open(({ isShown, onClose }) => {
      // We're passing `openDialog` (function above) down
      // to the bridge so it doesn't circularly imports
      // this module. You can open dialogs from dialogs
      // (INCEPTION HORN).
      const bridge = createDialogExtensionBridge(
        { ...dependencies, currentWidgetId: options.id, currentWidgetNamespace: namespace },
        openDialog,
        onClose
      );

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
              {/* eslint-disable-next-line rulesdir/restrict-inline-styles */}
              <div style={{ minHeight: options.minHeight || 'auto' }}>
                <ExtensionIFrameRendererWithLocalHostWarning
                  bridge={bridge}
                  widget={widget}
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
