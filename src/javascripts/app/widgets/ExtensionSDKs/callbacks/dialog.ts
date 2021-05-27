import type { DialogCallbacks } from '@contentful/experience-sdk/dist/create-widget-sdk/api/createDialogsApi';

export function createDialogCallbacks(): DialogCallbacks {
  return {
    selectSingleEntryLabels: () => {
      return {
        title: 'Add existing entry',
      };
    },
    selectMultipleEntriesLabels: () => {
      return {
        title: 'Add existing entries',
      };
    },
    selectSingleAssetLabels: () => {
      return {
        title: 'Add existing asset',
      };
    },
    selectMultipleAssetLabels: () => {
      return {
        title: 'Add existing assets',
      };
    },
  };
}
