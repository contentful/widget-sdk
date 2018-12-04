import angular from 'angular';

// See AngularInit.js
//
// angular.module('contentful/init').register is an object that contains
// functions to define the 5 Angular modules below at runtime. These 5 functions
// below allow registration within es6 files.
const register = type => (name, def) => angular.module('contentful/init').register[type](name, def);

export const registerController = register('controller');
export const registerDirective = register('directive');
export const registerFilter = register('filter');
export const registerFactory = register('factory');
export const registerService = register('service');
