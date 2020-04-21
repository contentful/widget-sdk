import openHyperlinkDialog from './dialogs/openHyperlinkDialog';
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
 * @param {Object} widgetAPI
 * @returns {Object}
 */
export default function (widgetAPI) {
  const { asset: canAccessAssets } = getSectionVisibility();
  const contentTypes = widgetAPI.space.getCachedContentTypes();

  const rtWidgetAPI = {
    ...widgetAPI,
    parameters: {
      ...widgetAPI.parameters,
      instance: {
        ...widgetAPI.parameters.instance,
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
      ...widgetAPI.dialogs,
      createHyperlink: ({ showTextInput, value }) => {
        return openHyperlinkDialog({ showTextInput, value, widgetAPI });
      },
    },
  };
  return rtWidgetAPI;
}
