import openHyperlinkDialog from './dialogs/openHyperlinkDialog';
import { getEntityLink } from 'app/common/EntityStateLink';
import {
  getSectionVisibility,
  canCreateAsset,
  canPerformActionOnEntryOfType,
  Action,
} from 'access_control/AccessChecker';

/**
 * Takes a standard widgetAPI and returns a copy of it, decorated with
 * non-standard functions that are required to make the RichTextEditor
 * field editor extension work with it.
 *
 * TODO: Make these additions available in the standard widgetAPI and the
 *  ui-extensions-sdk in this or a similar way.
 *
 * @param {Object} sdk
 * @returns {Object}
 */
export default function (sdk) {
  const { asset: canAccessAssets } = getSectionVisibility();
  const contentTypes = sdk.space.getCachedContentTypes();

  const rtWidgetAPI = {
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
    dialogs: {
      ...sdk.dialogs,
      createHyperlink: ({ showTextInput, value }) => {
        return openHyperlinkDialog({ showTextInput, value, sdk });
      },
    },
  };
  return rtWidgetAPI;
}
