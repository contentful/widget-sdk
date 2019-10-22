import * as logger from 'services/logger.es6';
import openHyperlinkDialog from 'app/widgets/WidgetApi/dialogs/openHyperlinkDialog.es6';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient/index.es6';
import { getModule } from 'NgRegistry.es6';
import { goToSlideInEntity } from 'navigation/SlideInNavigator/index.es6';
import { getSectionVisibility } from 'access_control/AccessChecker';
import * as entitySelector from 'search/EntitySelector/entitySelector.es6';
import * as JobsService from 'app/jobs/DataManagement/JobsService.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

/**
 * @deprecated  Use and extend the new `app/widgets/NewWidgetApi/createNewWidgetApi.es6.js` instead.
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
export default function buildWidgetApi({ field, entry, currentUrl, settings }) {
  const spaceContext = getModule('spaceContext');

  const { entry: canAccessEntries, asset: canAccessAssets } = getSectionVisibility();

  const widgetAPI = {
    field,
    entry,
    space: getBatchingApiClient(spaceContext.cma),
    jobs: {
      getPendingJobs: async () => {
        let jobs = [];
        try {
          const spaceEndpoint = createSpaceEndpoint(
            spaceContext.space.data.sys.id,
            spaceContext.space.environment.sys.id
          );
          const jobsCollection = await JobsService.getJobs(spaceEndpoint, {
            order: 'sys.scheduledAt',
            'sys.status': 'pending'
          });
          jobs = jobsCollection;
        } catch (err) {
          logger.logError('Failed to fetch pending jobs for reference card', {
            err
          });
          return [];
        }

        return jobs.items;
      }
    },
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
