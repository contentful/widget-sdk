let willSucceed = false;

export default function makeExtensionAccessHandlers() {
  return function checkAccess(_entity, _action) {
    return willSucceed;
  };
}

makeExtensionAccessHandlers.__setSuccess = function (newValue) {
  willSucceed = newValue;
};
