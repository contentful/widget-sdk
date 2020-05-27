import { getEntityLink } from 'app/common/EntityStateLink';
import { openRichTextDialog } from '@contentful/field-editor-rich-text';

/**
 * @param {Object} sdk
 * @returns {Object}
 */
export function rtSdkDecorator(sdk) {
  const rtSdk = {
    ...sdk,
    parameters: {
      ...sdk.parameters,
      instance: {
        ...sdk.parameters.instance,
        getEntryUrl: (entryId) => getEntityLink({ id: entryId, type: 'Entry' }).href,
        getAssetUrl: (assetId) => getEntityLink({ id: assetId, type: 'Asset' }).href,
      },
    },
  };

  rtSdk.dialogs.openCurrent = openRichTextDialog(rtSdk);

  return rtSdk;
}
