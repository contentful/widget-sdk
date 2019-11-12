import { isValidResourceId, RESOURCE_ID_PATTERN } from 'data/utils';

const TYPES = { ASSET: 'Asset', ENTRY: 'Entry', BULK_EDITOR: 'BulkEditor' };

const slideHelper = {
  /**
   * Tries to deserialize state params as a slide.
   *
   * @param {Object} stateParams $state.params
   * @returns {Slide|null}
   */
  newFromStateParams: newFactoryStrategyInvoker('newFromStateParams'),
  /**
   * Tries to deserialize string as a slide.
   *
   * @param {string} string
   * @returns {Slide|null}
   */
  newFromQS: newFactoryStrategyInvoker('newFromQS'),
  /**
   * Serializes a given slide as state params for `$state.go(path, params)`
   *
   * @param {Slide} slide
   * @returns {Object}
   */
  toStateParams: newStrategyForSlideInvoker('toStateParams'),
  /**
   * Serializes a given slide as a set of arguments ready for `$state.go(...args)`
   *
   * @param {Slide} slide
   * @param {Object} params? Custom params.
   * @returns {*[]}
   */
  toStateGoArgs: (slide, params = {}) => [
    getSlideStrategyFor(slide).STATE_PATH,
    { ...params, ...slideHelper.toStateParams(slide) }
  ],
  /**
   * Serializes a given slide as a string.
   *
   * @param {Slide} slide
   * @returns {string}
   */
  toString: newStrategyForSlideInvoker('toString')
};
export default slideHelper;

const slideStrategies = [
  {
    TYPE: TYPES.BULK_EDITOR,
    STATE_PATH: '^.^.entries.detail',
    shareStateWithPreviousEntry: true,
    newFromStateParams: ({ entryId, bulkEditor = '' }) =>
      getSlideStrategyFor({ type: TYPES.BULK_EDITOR }).newFromQS(`${entryId}:${bulkEditor}`),
    newFromQS: string => {
      const ID = RESOURCE_ID_PATTERN;
      const BULK_EDITOR_ID_REGEXP = new RegExp(`^(${ID}):(${ID}):(${ID}):(-?\\d+)$`);
      const match = string.match(BULK_EDITOR_ID_REGEXP);
      if (match) {
        const [_, entryId, fieldId, localeCode, focusedEntityIndex] = match;
        return {
          type: TYPES.BULK_EDITOR,
          path: [entryId, fieldId, localeCode, Number(focusedEntityIndex)]
        };
      }
      return null;
    },
    toStateParams: ({ path: [entryId, ...entryBulkPath] }) => ({
      entryId,
      bulkEditor: entryBulkPath.join(':')
    }),
    toString: ({ path }) => path.join(':')
  },
  {
    TYPE: TYPES.ENTRY,
    STATE_PATH: '^.^.entries.detail',
    newFromStateParams: ({ entryId: id }) => (id ? { id, type: TYPES.ENTRY } : null),
    newFromQS: string => (isValidResourceId(string) ? { id: string, type: TYPES.ENTRY } : null),
    toStateParams: ({ id: entryId }) => ({ entryId, bulkEditor: null }),
    toString: ({ id }) => id
  },
  {
    TYPE: TYPES.ASSET,
    STATE_PATH: '^.^.assets.detail',
    newFromStateParams: ({ assetId: id }) => (id ? { id, type: TYPES.ASSET } : null),
    newFromQS: _string => null, // Assets can't be in query string.
    toStateParams: ({ id: assetId }) => ({ assetId }),
    toString: ({ id }) => `${TYPES.ASSET}^${id}`
  }
];

function getSlideStrategyFor({ type }) {
  const strategy = slideStrategies.find(({ TYPE }) => TYPE === type);
  if (strategy) {
    return strategy;
  }
  throw new Error(`Unsupported slide type "${type}"`);
}

function newStrategyForSlideInvoker(fnName) {
  return slide => getSlideStrategyFor(slide)[fnName](slide);
}

function newFactoryStrategyInvoker(fnName) {
  return (...args) => {
    for (const slideStrategy of slideStrategies) {
      const result = slideStrategy[fnName](...args);
      if (result) {
        return result;
      }
    }
    return null;
  };
}
