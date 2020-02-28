import openHyperlinkDialog from 'app/widgets/WidgetApi/dialogs/openHyperlinkDialog';
import {
  getSectionVisibility,
  canCreateAsset,
  canPerformActionOnEntryOfType,
  Action
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
 * @param {Object} spaceContext
 * @param {Object} jobs
 * @returns {Object}
 */
export default function(widgetAPI, spaceContext, jobs) {
  const { asset: canAccessAssets } = getSectionVisibility();
  const contentTypes = spaceContext ? spaceContext.publishedCTs.getAllBare() : [];

  const rtWidgetAPI = {
    ...widgetAPI,
    // TODO: Get rid of this ugly hack we're using for checking whether or not we need
    //  to update fetched entity card info.
    currentUrl: window.location,
    // TODO: Get rid of this or implement in extensions sdk in some way!
    jobs,
    permissions: {
      canAccessAssets,
      canCreateAssets: canCreateAsset(),

      canCreateEntryOfContentType: contentTypes.reduce(
        (acc, contentType) => ({
          ...acc,
          [contentType.sys.id]: canPerformActionOnEntryOfType(Action.CREATE, contentType)
        }),
        {}
      )
    },
    dialogs: {
      ...widgetAPI.dialogs,
      createHyperlink: ({ showTextInput, value }) => {
        // Important to pass `rtWidgetAPI` as `FetchedEntityCard` depends on
        // `jobs` and `currentUrl`.
        return openHyperlinkDialog({ showTextInput, value, widgetAPI: rtWidgetAPI });
      }
    }
  };
  return rtWidgetAPI;
}
