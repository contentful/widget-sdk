import spaceContext from 'spaceContext';
import entitySelector from 'entitySelector';
import openHyperlinkDialog from 'app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6';

/**
 * Should create an object with the same interface as provided by the Contentful JS
 * ui-extensions-sdk `extension` object:
 * https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md
 *
 * Important: Some of the ui-extensions-sdk interface is not yet implemented here
 * and that some of the interface defined here is not part of the ui-extensions-sdk.
 *
 * Note: This deprecates the old `cfWidgetApi` directive.
 *
 * TODO:
 * - Feature parity with ui-extensions-sdk official API.
 * - Move additional functions from here to ui-extensions-sdk as required (e.g. on
 *   customer request or when we want to open-source a widget relying on it).
 *
 * @param {Object} field
 * @param {Object} features
 * @param {string} currentUrl
 * @returns {Object}
 */
export default function buildWidgetApi({ field, features, currentUrl }) {
  const widgetAPI = {
    /**
     * @see https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md#extensionfield
     */
    field,

    /**
     * @see https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md#extensionspace
     */
    space: spaceContext.cma,

    /**
     * @see https://github.com/contentful/ui-extensions-sdk/blob/master/docs/ui-extensions-sdk-frontend.md#extensiondialogs
     */
    dialogs: {
      /**
       * TODO: Add to ui-extensions-sdk when open sourcing the RichText widget.
       *
       * Allows to use entity selector, fully configurable as in the web-app while
       * the existing `.dialog.selectSingleEntry` and `selectSingleAsset` in the
       * ui-extensions-sdk do only allow a very limited set of options.
       */
      selectEntities: config => entitySelector.open(config),
      /**
       * TODO: Add to ui-extensions-sdk when open sourcing the RichText widget.
       *
       * @see ./createHyperlinkDialog
       */
      createHyperlink: ({ showTextInput, value }) => {
        return openHyperlinkDialog({ showTextInput, value, widgetAPI });
      }
    },

    /**
     * TODO: Add to ui-extensions-sdk when open sourcing the RichText widget.
     */
    currentUrl,

    /**
     * TODO: Add to ui-extensions-sdk when open sourcing the RichText widget.
     */
    features

    // TODO: .entry
    // TODO: .locales
    // TODO: .user
    // TODO: .window
  };
  return widgetAPI;
}
