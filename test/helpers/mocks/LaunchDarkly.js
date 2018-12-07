export default function createLaunchDarklyMock($q) {
  const flags = {};

  return {
    init: sinon.spy(),

    getCurrentVariation(flag) {
      // We need to use `$q` because otherwise the tests do not execute
      // correctly.
      return $q.resolve(flags[flag]);
    },

    // TODO implement when needed
    onFeatureFlag: sinon.spy(),
    onABTest: sinon.spy(),

    // This does not exist on the actual client it is there for the
    // tests to control the client behavior.
    _setFlag(flag, value) {
      flags[flag] = value;
    }
  };
}
