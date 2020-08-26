import React from 'react';
import { Modal } from '@contentful/forma-36-react-components';
import {
  DialogExtensionSDK,
  DialogsAPI,
  OpenCustomWidgetOptions,
  FieldExtensionSDK,
} from 'contentful-ui-extensions-sdk';
import { omit } from 'lodash';

import { entitySelector } from 'features/entity-search';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { WidgetRenderer, WidgetLocation, WidgetNamespace } from 'features/widget-renderer';
import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import trackExtensionRender from 'widgets/TrackExtensionRender';
import { toLegacyWidget } from 'widgets/WidgetCompat';
import { getCustomWidgetLoader } from 'widgets/CustomWidgetLoaderInstance';
import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';
import { Widget } from 'features/widget-renderer';
import { applyDefaultValues } from 'widgets/WidgetParametersUtils';

type FieldSDKWithoutDialogs = Omit<FieldExtensionSDK, 'dialogs'>;

const denyDialog = () => {
  throw makeReadOnlyApiError(ReadOnlyApi.Dialog);
};

export function createReadOnlyDialogsApi() {
  return {
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
}

export function createDialogsApi(sdk: FieldSDKWithoutDialogs): DialogsAPI {
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
      if (sdk.ids.app) {
        return this.openCurrentApp(opts);
      } else {
        return this.openExtension({
          ...opts,
          id: sdk.ids.extension,
        });
      }
    },
    openCurrentApp: (opts) => {
      const options = { ...opts, id: sdk.ids.app };
      return openCustomDialog(WidgetNamespace.APP, options, sdk);
    },
    openExtension: (opts) => {
      return openCustomDialog(WidgetNamespace.EXTENSION, opts, sdk);
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

function createDialogSDK(
  sdk: FieldSDKWithoutDialogs,
  widget: Widget,
  onClose: (data?: any) => void,
  invocationParameters: Record<string, any>
): DialogExtensionSDK {
  // Use installation parameters as they are.
  let installationParameters = widget.parameters.values.installation;
  // Extensions can declare defaults for parameters, we need to apply them.
  if (widget.namespace === WidgetNamespace.EXTENSION) {
    // TODO: eventually move `applyDefaultValues` to the renderer library
    // and integrate with the loader class so defaults are auto-applied.
    installationParameters = applyDefaultValues(
      widget.parameters.definitions.installation,
      installationParameters
    );
  }

  return {
    ...sdk,
    dialogs: createDialogsApi(sdk),
    location: {
      is: (location: string) => location === WidgetLocation.DIALOG,
    },
    parameters: {
      installation: installationParameters,
      // No instance parameters for dialogs.
      instance: {},
      // Parameters passed directly to the dialog.
      invocation: invocationParameters,
    },
    ids: {
      // Do not leak entry- or field-specific IDs nor widget ID.
      ...omit(sdk.ids, ['field', 'entry', 'contentType', 'app', 'extension']),
      // Expose widget ID (can be the same when doing `openCurrent`).
      [widget.namespace]: widget.id,
    },
    // Pass onClose in order to allow child modal to close.
    close: onClose,
  };
}

async function openCustomDialog(
  namespace: WidgetNamespace,
  options: OpenCustomWidgetOptions,
  sdk: FieldSDKWithoutDialogs
) {
  if (!options.id) {
    throw new Error('No ID provided.');
  }

  const widget = await findWidget(namespace, options.id);

  return ModalLauncher.open(({ isShown, onClose }) => {
    const size =
      typeof options.width === 'number' && Number.isInteger(options.width)
        ? `${options.width}px`
        : (options.width as string | undefined);
    const minHeightStyle = { minHeight: options.minHeight || 'auto' };

    const dialogSdk = createDialogSDK(sdk, widget, onClose, options.parameters || {});

    return (
      <Modal
        key={`${Date.now()}`}
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
            <div style={minHeightStyle}>
              <WidgetRenderer
                location={WidgetLocation.DIALOG}
                sdk={dialogSdk}
                widget={widget}
                onRender={(widget, location) =>
                  trackExtensionRender(location, toLegacyWidget(widget), sdk.ids.environment)
                }
              />
            </div>
          </>
        )}
      </Modal>
    );
  });
}
