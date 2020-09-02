import { getEntityLink } from 'app/common/EntityStateLink';
import { openRichTextDialog } from '@contentful/field-editor-rich-text';

/**
 * @param {Object} sdk
 * @param {boolean} isMasterEnvironment
 * @returns {Object}
 */
export function rtSdkDecorator(sdk, isMasterEnvironment) {
  const rtSdk = {
    ...sdk,
    parameters: {
      ...sdk.parameters,
      instance: {
        ...sdk.parameters.instance,
        getEntryUrl: (entryId) =>
          getEntityLink({ id: entryId, type: 'Entry', isMasterEnvironment }).href,
        getAssetUrl: (assetId) =>
          getEntityLink({ id: assetId, type: 'Asset', isMasterEnvironment }).href,
      },
    },
  };

  rtSdk.dialogs.openCurrent = openRichTextDialog(rtSdk);

  return rtSdk;
}
