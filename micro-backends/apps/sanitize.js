'use strict';

// List of prop names that should be sanitized out from the view layer
const HIDDEN_PROP_NAMES = ['secrets'];

module.exports = function({ omit, pick }) {
  return {
    mergeHiddenFields,
    sanitizeListOfApps
  };

  // Merge hidden fields of an app object into given updated app object passed by user.
  function mergeHiddenFields(existing, updated) {
    return {
      ...pick(existing, HIDDEN_PROP_NAMES),
      ...updated
    };
  }

  // Loop through all the app ids in a given object
  // and delete the hidden ones. It should be called only before
  // rendering.
  function sanitizeListOfApps(apps) {
    return Object.keys(apps).reduce(
      (acc, appId) => ({
        ...acc,
        [appId]: omit(apps[appId], HIDDEN_PROP_NAMES)
      }),
      {}
    );
  }
};
