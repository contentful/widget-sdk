import { addUserOrgSpace } from './Decorators.es6';

export const ClipboardCopyTransform = addUserOrgSpace((_ev, data) => {
  return {
    data: {
      action: `clipboard_copy_${data.source}`
    }
  };
});

export const BoilerplateTransform = addUserOrgSpace((_ev, data) => {
  return {
    data: {
      action: `boilerplate_${data.action}`,
      platform: data.platform
    }
  };
});
