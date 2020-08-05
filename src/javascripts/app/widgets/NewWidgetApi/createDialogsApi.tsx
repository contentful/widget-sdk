import React from 'react';
import { Modal } from '@contentful/forma-36-react-components';

import * as entitySelector from 'search/EntitySelector/entitySelector';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { WidgetLocation, WidgetNamespace } from 'features/widget-renderer';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import {
  DialogsAPI,
  OpenCustomWidgetOptions,
  DialogExtensionSDK,
} from 'contentful-ui-extensions-sdk';

const denyDialog = () => {
  throw new Error('Cannot open dialog in Read Only mode');
};

const readOnlyDialogsApi: DialogsAPI = {
  openAlert: denyDialog,
  openConfirm: denyDialog,
  openCurrent: denyDialog,
  openCurrentApp: denyDialog,
  openExtension: denyDialog,
  openPrompt: denyDialog,
  selectMultipleAssets: denyDialog,
  selectMultipleEntries: denyDialog,
  selectSingleAsset: denyDialog,
  selectSingleEntry: denyDialog,
};

export function createDialogsApi({
  dialogExtensionSDK,
  readOnly = false,
}: {
  dialogExtensionSDK: DialogExtensionSDK;
  readOnly?: boolean;
}): DialogsAPI {
  if (readOnly) {
    return readOnlyDialogsApi;
  }

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
      if (dialogExtensionSDK.ids.app) {
        return this.openCurrentApp(opts);
      } else {
        return this.openExtension({
          ...opts,
          id: dialogExtensionSDK.ids.extension,
        });
      }
    },
    openCurrentApp: (opts) => {
      const options = { ...opts, id: dialogExtensionSDK.ids.app };
      return openCustomDialog(WidgetNamespace.APP, options, dialogExtensionSDK);
    },
    openExtension: (opts) => {
      return openCustomDialog(WidgetNamespace.EXTENSION, opts, dialogExtensionSDK);
    },
  };
}

async function findWidget(widgetNamespace: WidgetNamespace, widgetId: string) {
  const loader = await getCustomWidgetLoader();
  const widget = await loader.getOne({ widgetNamespace, widgetId });

  // If a widget was found, meaning that an app or an extension
  // is already installed, just return it.
  if (widget) {
    return widget;
  }

  // TODO: We will need to handle one more case when we'll start using SDK in the App Config view.
  // It is possible to open dialogs when installing an app, even before the app is installed.
  // Before it's installed, there is no AppInstallation entity, so the result of loader call
  // above will be empty. In this case we need to create an artificial widget instance out
  // of AppDefinition.
  //
  // Pseudocode:
  //
  // if (widgetNamespace === WidgetNamespace.APP && isInAppConfigView() {
  //   return buildArtificialAppDefinitionWidget(widgetId);
  // }

  throw new Error(`No widget with ID "${widgetId}" found in "${widgetNamespace}" namespace.`);
}

async function openCustomDialog(
  namespace: WidgetNamespace,
  options: OpenCustomWidgetOptions,
  _sdk: DialogExtensionSDK
) {
  if (!options.id) {
    throw new Error('No ID provided.');
  }

  const widget = await findWidget(namespace, options.id);

  // TODO: uncomment parameters and childApis once we've got the renderer
  // const parameters = {
  //   values: {
  //     // No instance parameters for dialogs.
  //     instance: {},
  //     // Parameters passed directly to the dialog.
  //     invocation: options.parameters || {},
  //   },
  // };

  trackExtensionRender(WidgetLocation.DIALOG, toLegacyWidget(widget));

  const dialogKey = Date.now().toString();

  return ModalLauncher.open(({ isShown, onClose }) => {
    const size =
      typeof options.width === 'number' && Number.isInteger(options.width)
        ? `${options.width}px`
        : (options.width as string | undefined);

    // Pass onClose in order to allow child modal to close
    // const childApis = { ...sdk, close: onClose };

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
              {/* TODO use WidgetRenderer <WidgetRenderer
                location={WidgetLocation.DIALOG}
                apis={childApis}
                widget={widget}
                parameters={parameters}
              /> */}
            </div>
          </>
        )}
      </Modal>
    );
  });
}
