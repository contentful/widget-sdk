import { getEntityLink } from 'app/common/EntityStateLink';
import {
  getSectionVisibility,
  canCreateAsset,
  canPerformActionOnEntryOfType,
  Action,
} from 'access_control/AccessChecker';

import { openRichTextDialog } from '@contentful/field-editor-rich-text';

/**
 * @param {Object} sdk
 * @returns {Object}
 */
export function rtSdkDecorator(sdk) {
  const { asset: canAccessAssets } = getSectionVisibility();
  const contentTypes = sdk.space.getCachedContentTypes();

  const rtSdk = {
    ...sdk,
    parameters: {
      ...sdk.parameters,
      instance: {
        ...sdk.parameters.instance,
        getEntryUrl: (entryId) => getEntityLink({ id: entryId, type: 'Entry' }).href,
        getAssetUrl: (assetId) => getEntityLink({ id: assetId, type: 'Asset' }).href,
        permissions: {
          canAccessAssets,
          canCreateAssets: canCreateAsset(),
          // TODO: Get rid of this ugly hack we're using for checking whether or not we need
          //  to update fetched entity card info.
          canCreateEntryOfContentType: (contentTypeId) => {
            const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
            if (!contentType) {
              return false;
            }
            return canPerformActionOnEntryOfType(Action.CREATE, contentType);
          },
        },
      },
    },
  };

  rtSdk.dialogs.openExtension = openRichTextDialog(rtSdk);

  return rtSdk;
}
