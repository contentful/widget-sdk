import React from 'react';
import { Modal } from '@contentful/forma-36-react-components';

import * as entitySelector from 'search/EntitySelector/entitySelector';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { WidgetRenderer, WidgetLocation, WidgetNamespace } from 'features/widget-renderer';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';

/**
 * @typedef { import("contentful-ui-extensions-sdk").DialogsAPI } DialogsAPI
 */

/**
 * @return {DialogsAPI}
 */
export function createDialogsApi(apis) {
  return {
    openAlert: ExtensionDialogs.openAlert,
    openConfirm: ExtensionDialogs.openConfirm,
    openPrompt: ExtensionDialogs.openPrompt,
    selectSingleEntry: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Entry',
        multiple: false,
      });
    },
    selectMultipleEntries: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Entry',
        multiple: true,
      });
    },
    selectSingleAsset: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Asset',
        multiple: false,
      });
    },
    selectMultipleAssets: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Asset',
        multiple: true,
      });
    },
    openCurrent: () => {
      throw new Error('Not implemented yet');
    },
    openCurrentApp: (opts) => {
      return openCustomDialog(WidgetNamespace.APP, opts, apis);
    },
    openExtension: (opts) => {
      return openCustomDialog(WidgetNamespace.EXTENSION, opts, apis);
    },
  };
}

async function findWidget(widgetNamespace, widgetId) {
  const loader = await getCustomWidgetLoader();
  const widget = await loader.getOne({ widgetNamespace, widgetId });

  // If a widget was found, meaning that an app or an extension
  // are already installed, just return it.
  if (widget) {
    return widget;
  }

  // TODO: how do I get the dependencies here? (worst case fetch)
  // If there is no widget found but we may be in the installation
  // process, create an artificial widget out of AppDefinition.
  // const { appDefinition } = dependencies;
  // if (widgetNamespace === WidgetNamespace.APP && appDefinition) {
  //   return buildAppDefinitionWidget(appDefinition, getMarketplaceDataProvider());
  // }

  throw new Error(`No widget with ID "${widgetId}" found in "${widgetNamespace}" namespace.`);
}

async function openCustomDialog(namespace, options, apis) {
  if (!options.id) {
    throw new Error('No ID provided.');
  }

  const widget = await findWidget(namespace, options.id);

  const parameters = {
    // No instance parameters for dialogs.
    instance: {},
    values: {
      // Regular installation parameters.
      installation: applyDefaultValues(
        widget.parameters.definitions.installation,
        widget.parameters.values.installation
      ),
    },
    // Parameters passed directly to the dialog.
    invocation: options.parameters || {},
  };

  trackExtensionRender(WidgetLocation.DIALOG, toLegacyWidget(widget));

  const dialogKey = Date.now().toString();

  return ModalLauncher.open(({ isShown, onClose }) => {
    const onCloseHandler = () => onClose();

    const size = Number.isInteger(options.width) ? `${options.width}px` : options.width;

    const childApis = { ...apis, close: onClose };

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
              <WidgetRenderer
                location={WidgetLocation.DIALOG}
                apis={childApis}
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
