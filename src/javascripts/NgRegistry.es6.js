import angular from 'angular';

const initModule = angular.module('contentful/init');

// See AngularInit.js
//
// angular.module('contentful/init').register is an object that contains
// functions to define the 5 Angular modules below at runtime. These 5 functions
// below allow registration within es6 files.
const register = type => (name, def) => initModule.register[type](name, def);

export const registerController = register('controller');
export const registerDirective = register('directive');
export const registerFilter = register('filter');
export const registerFactory = register('factory');
export const registerService = register('service');
export const registerConstant = register('constant');
export const registerProvider = register('provider');

export const getModule = initModule.getModule;
export const getModules = (...modules) => modules.map(getModule);
