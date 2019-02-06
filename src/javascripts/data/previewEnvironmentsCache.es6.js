let previewEnvironmentsCache;

/**
 * @returns {object} environments
 *
 * @description
 * Returns the cached environments
 */
function getAll() {
  return previewEnvironmentsCache;
}

/**
 * @param {object} environments
 * @returns {object} environments
 *
 * @description
 * Updates the cache with the environments provided
 */
function setAll(environments) {
  previewEnvironmentsCache = environments;
  return previewEnvironmentsCache;
}

/**
 * @param {object} environment
 * @returns {object} environment
 *
 * @description
 * Updates a single environment in environments cache
 */
function set(environment) {
  previewEnvironmentsCache = previewEnvironmentsCache || {};
  previewEnvironmentsCache[environment.sys.id] = environment;
  return environment;
}

/**
 * @returns undefined
 *
 * @description
 * Clear the cache
 */
function clearAll() {
  previewEnvironmentsCache = undefined;
}

export default {
  getAll,
  setAll,
  set,
  clearAll
};
