import { KnownSDK, FieldExtensionSDK, DialogExtensionSDK } from 'contentful-ui-extensions-sdk';

import { PostMessageChannel } from '../PostMessageChannel';
import { ChannelMethod } from '../channelTypes';
import { WidgetLocation } from '../interfaces';

import { makeCallSpaceMethodHandler } from './CallSpaceMethodHandler';
import { makeNotifyHandler } from './NotifyHandler';
import { makeOpenDialogHandler } from './DialogHandler';
import {
  makeNavigateToBulkEditorHandler,
  makeNavigateToContentEntityHandler,
  makeNavigateToPageHandler,
} from './NavigateToHandler';
import { makeSetValueHandler, makeRemoveValueHandler, makeSetInvalidHandler } from './FieldHandler';
import { isFieldEditingLocation } from '../utils';

export function setupHandlers(
  channel: PostMessageChannel,
  sdk: KnownSDK,
  location: WidgetLocation
) {
  // Shared handlers for all locations.
  channel.registerHandler(ChannelMethod.CallSpaceMethod, makeCallSpaceMethodHandler(sdk.space));
  channel.registerHandler(ChannelMethod.Notify, makeNotifyHandler(sdk.notifier));
  channel.registerHandler(ChannelMethod.OpenDialog, makeOpenDialogHandler(sdk.dialogs));
  channel.registerHandler(ChannelMethod.CheckAccess, sdk.access.can);

  channel.registerHandler(
    ChannelMethod.NavigateToBulkEditor,
    makeNavigateToBulkEditorHandler(sdk.navigator)
  );

  channel.registerHandler(
    ChannelMethod.NavigateToContentEntity,
    makeNavigateToContentEntityHandler(sdk.navigator)
  );

  // This is not a mistake. `NavigateToPage` and `NavigateToPageExtension` have
  // the same handler which understands internally what to do.
  const handlePageNavigation = makeNavigateToPageHandler(sdk.navigator);
  channel.registerHandler(ChannelMethod.NavigateToPage, handlePageNavigation);
  channel.registerHandler(ChannelMethod.NavigateToPageExtension, handlePageNavigation);

  // Handlers specific to field editing.
  if (isFieldEditingLocation(location)) {
    const { field } = sdk as FieldExtensionSDK;
    channel.registerHandler(ChannelMethod.SetValue, makeSetValueHandler(field));
    channel.registerHandler(ChannelMethod.RemoveValue, makeRemoveValueHandler(field));
    channel.registerHandler(ChannelMethod.SetInvalid, makeSetInvalidHandler(field));
  }

  // Handlers specific to dialogs.
  if (location === WidgetLocation.DIALOG) {
    const { close } = sdk as DialogExtensionSDK;
    channel.registerHandler(ChannelMethod.CloseDialog, (data?: any) => close(data));
  }
}
