import openHyperlinkDialog from 'app/widgets/WidgetApi/dialogs/openHyperlinkDialog';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';
import { getModule } from 'NgRegistry';
import { goToSlideInEntity } from 'navigation/SlideInNavigator';
import { getSectionVisibility } from 'access_control/AccessChecker';
import * as entitySelector from 'search/EntitySelector/entitySelector';

/**
 * @deprecated  Use and extend the new `app/widgets/NewWidgetApi/createNewWidgetApi.js` instead.
 *
 * Important: The problem with the current implementation that it significantly deviated from an actual `ui-extensions-sdk` API.
 * Some of the ui-extensions-sdk interface is not yet implemented here
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
export default function buildWidgetApi({ field, entry, currentUrl, settings, scheduledActions }) {
  const spaceContext = getModule('spaceContext');

  const { entry: canAccessEntries, asset: canAccessAssets } = getSectionVisibility();

  const widgetAPI = {
    field,
    entry,
    space: getBatchingApiClient(spaceContext.cma),
    scheduledActions,
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
    },

    settings

    // TODO: .locales
    // TODO: .user
    // TODO: .window
  };
  return widgetAPI;
}

function openEntity(type, id, { slideIn = false }) {
  if (slideIn) {
    return goToSlideInEntity({ type, id });
  }
  throw new Error('widgetApi.navigator.openEntity() without slide-in is not implemented');
}
