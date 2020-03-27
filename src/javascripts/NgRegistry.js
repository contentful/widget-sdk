import angular from 'angular';

// See AngularInit.js
//
// angular.module('contentful/init').register is an object that contains
// functions to define the Angular modules below at runtime. These functions
// below allow registration within es6 files.
const register = (type) => (name, def) =>
  angular.module('contentful/init').register[type](name, def);

export const registerController = register('controller');
export const registerDirective = register('directive');
export const registerFilter = register('filter');
export const registerFactory = register('factory');
export const registerService = register('service');
export const registerConstant = register('constant');
export const registerProvider = register('provider');
export const registerValue = register('value');

export const initReady = () => {
  try {
    return angular.module('contentful/init').loaded === true;
  } catch (e) {
    return false;
  }
};

export const awaitInitReady = async () => {
  const ready = initReady();

  if (!ready) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    return awaitInitReady();
  }

  return true;
};

export const appReady = () => {
  try {
    return angular.module('contentful/app').loaded === true;
  } catch (_) {
    return false;
  }
};

export const getModule = (name) => {
  try {
    return angular.module('contentful/init').getModule(name);
  } catch (e) {
    console.error(e); // eslint-disable-line no-console

    throw e;
  }
};
