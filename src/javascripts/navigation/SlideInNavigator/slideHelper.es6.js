const TYPES = { ASSET: 'Asset', ENTRY: 'Entry' };

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
   * @param params
   * @returns {*[]}
   */
  toStateGoArgs: (slide, params = {}) => [
    getSlideStrageyFor(slide).STATE_PATH,
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

const slideStrategies = [{
  TYPE: TYPES.ENTRY,
  STATE_PATH: '^.^.entries.detail',
  newFromStateParams: ({ entryId: id }) => id ? { id, type: TYPES.ENTRY } : null,
  newFromQS: (string) => isId(string) ? { id: string, type: TYPES.ENTRY } : null,
  toStateParams: ({ id: entryId }) => ({ entryId }),
  toString: ({ id }) => id
}, {
  TYPE: TYPES.ASSET,
  STATE_PATH: '^.^.assets.detail',
  newFromStateParams: ({ assetId: id }) => id ? { id, type: TYPES.ASSET } : null,
  newFromQS: (_string) => null, // Assets can't be in query string.
  toStateParams: ({ id: assetId }) => ({ assetId }),
  toString: ({ id }) => id
}];

function getSlideStrageyFor (slide) {
  const helper = slideStrategies.find(({ TYPE }) => TYPE === slide.type);
  if (helper) {
    return helper;
  }
  throw new Error(`Unsupported slide type "${slide.type}`);
}

function newStrategyForSlideInvoker (fnName) {
  return (slide) => getSlideStrageyFor(slide)[fnName](slide);
}

function newFactoryStrategyInvoker (fnName) {
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

function isId (string) {
  return /[^:. ]+/.test(string);
}
