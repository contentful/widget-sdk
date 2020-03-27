import * as ExtensionDialogs from 'widgets/ExtensionDialogs';
import * as entitySelector from 'search/EntitySelector/entitySelector';

/**
 * @typedef { import("contentful-ui-extensions-sdk").DialogsAPI } DialogsAPI
 */

/**
 * @return {DialogsAPI}
 */
export function createDialogsApi() {
  return {
    openAlert: ExtensionDialogs.openAlert,
    openConfirm: ExtensionDialogs.openConfirm,
    openPrompt: ExtensionDialogs.openPrompt,
    selectSingleEntry: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Entry',
        multiple: false,
      });
    },
    selectMultipleEntries: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Entry',
        multiple: true,
      });
    },
    selectSingleAsset: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Asset',
        multiple: false,
      });
    },
    selectMultipleAssets: (opts) => {
      return entitySelector.openFromExtension({
        ...opts,
        entityType: 'Asset',
        multiple: true,
      });
    },
    openExtension: () => {
      throw new Error('Not implemented yet');
    },
  };
}
