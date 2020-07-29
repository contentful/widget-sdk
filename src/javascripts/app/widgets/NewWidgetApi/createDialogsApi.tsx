import React from 'react';
import { Modal } from '@contentful/forma-36-react-components';

import * as entitySelector from 'search/EntitySelector/entitySelector';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { WidgetRenderer, WidgetLocation, WidgetNamespace } from 'features/widget-renderer';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import {
  DialogsAPI,
  OpenCustomWidgetOptions,
  DialogExtensionSDK,
} from 'contentful-ui-extensions-sdk';

export function createDialogsApi(apis: DialogExtensionSDK): DialogsAPI {
  return {
    openAlert: ExtensionDialogs.openAlert,
    openConfirm: ExtensionDialogs.openConfirm,
    openPrompt: ExtensionDialogs.openPrompt,
    selectSingleEntry: (opts) => {
      return entitySelector.openFromExtensionSingle({
        ...opts,
        entityType: 'Entry',
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
      return entitySelector.openFromExtensionSingle({
        ...opts,
        entityType: 'Asset',
      });
    },
    selectMultipleAssets: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Asset',
        multiple: true,
      });
    },
    openCurrent: function (opts) {
      if (apis.ids.app) {
        return this.openCurrentApp(opts);
      } else {
        return this.openExtension({
          ...opts,
          id: apis.ids.extension,
        });
      }
    },
    openCurrentApp: (opts) => {
      const options = { ...opts, id: apis.ids.app };
      return openCustomDialog(WidgetNamespace.APP, options, apis);
    },
    openExtension: (opts) => {
      return openCustomDialog(WidgetNamespace.EXTENSION, opts, apis);
    },
  };
}

async function findWidget(widgetNamespace: WidgetNamespace, widgetId: string) {
  const loader = await getCustomWidgetLoader();
  const widget = await loader.getOne({ widgetNamespace, widgetId });

  // If a widget was found, meaning that an app or an extension
  // are already installed, just return it.
  if (widget) {
    return widget;
  }

  // TODO:
  //   Handle this piece of logic whenever we use WidgetRenderer in the AppConfig screen.
  //   Please note: presence of appDefinition below just means it's during the installation flow
  //   hence outside of said flow, that will be undefined.
  // If there is no widget found but we may be in the installation
  // process, create an artificial widget out of AppDefinition.
  // const { appDefinition } = dependencies;
  // if (widgetNamespace === WidgetNamespace.APP && appDefinition) {
  //   return buildAppDefinitionWidget(appDefinition, getMarketplaceDataProvider());
  // }

  throw new Error(`No widget with ID "${widgetId}" found in "${widgetNamespace}" namespace.`);
}

async function openCustomDialog(
  namespace: WidgetNamespace,
  options: OpenCustomWidgetOptions,
  apis: DialogExtensionSDK
) {
  if (!options.id) {
    throw new Error('No ID provided.');
  }

  const widget = await findWidget(namespace, options.id);

  const parameters = {
    values: {
      // No instance parameters for dialogs.
      instance: {},
      // Parameters passed directly to the dialog.
      invocation: options.parameters || {},
    },
  };

  trackExtensionRender(WidgetLocation.DIALOG, toLegacyWidget(widget));

  const dialogKey = Date.now().toString();

  return ModalLauncher.open(({ isShown, onClose }) => {
    const size =
      typeof options.width === 'number' && Number.isInteger(options.width)
        ? `${options.width}px`
        : (options.width as string | undefined);

    // Pass onClose in order to allow child modal to close
    const childApis = { ...apis, close: onClose };

    return (
      <Modal
        key={dialogKey}
        shouldCloseOnOverlayClick={options.shouldCloseOnOverlayClick || false}
        shouldCloseOnEscapePress={options.shouldCloseOnEscapePress || false}
        allowHeightOverflow={options.allowHeightOverflow || false}
        position={options.position || 'center'}
        isShown={isShown}
        onClose={() => onClose()}
        size={size || '700px'}>
        {() => (
          <>
            {options.title && <Modal.Header title={options.title} onClose={() => onClose()} />}
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
