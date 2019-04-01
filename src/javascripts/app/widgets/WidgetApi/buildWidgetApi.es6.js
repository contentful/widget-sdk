import openHyperlinkDialog from 'app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient/index.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const entitySelector = getModule('entitySelector');
const { getSectionVisibility } = getModule('access_control/AccessChecker');
const slideInNavigator = getModule('navigation/SlideInNavigator');

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
 * TODO: Merge this with widgetApiDirective instead, no need to have this on top of the other.
 *
 * @param {Object} field
 * @param {Object} entry
 * @param {string} currentUrl
 * @returns {Object}
 */
export default function buildWidgetApi({ field, entry, currentUrl }) {
  const { entry: canAccessEntries, asset: canAccessAssets } = getSectionVisibility();

  const widgetAPI = {
    /**
     * @see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#field
     */
    field,

    /**
     *
     */
    entry,

    /**
     * @see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#space
     */
    space: getBatchingApiClient(spaceContext.cma),

    /**
     * @see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#dialogs
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
     * @see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#navigator
     */
    navigator: {
      openAsset: (...args) => openEntity('Asset', ...args),
      openEntry: (...args) => openEntity('Entry', ...args),
      openEntity
    },

    /**
     * TODO: Add to ui-extensions-sdk when open sourcing the RichText widget.
     */
    currentUrl,

    permissions: {
      canAccessEntries,
      canAccessAssets
    }

    // TODO: .locales
    // TODO: .user
    // TODO: .window
  };
  return widgetAPI;
}

function openEntity(type, id, { slideIn = false }) {
  if (slideIn) {
    return slideInNavigator.goToSlideInEntity({ type, id });
  }
  throw new Error('widgetApi.navigator.openEntity() without slide-in is not implemented');
}
