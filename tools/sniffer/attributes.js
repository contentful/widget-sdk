const _ = require('lodash');

const all = () => true;

const typescript = (node) => node.extension === '.ts' || node.extension === '.tsx';

const js = (node) => node.extension === '.js';

const jade = (node) => node.extension === '.html';

const test = (node) => (js(node) || typescript(node)) && node.path.indexOf('spec.') !== -1;

const jest = (node) => test(node) && node.path.indexOf('src/javascripts') !== -1;

const angular = (node) => {
  const modules = node.modules;
  if (!js(node) && !typescript(node)) {
    return false;
  }
  if (test(node)) {
    return false;
  }
  const attributes = [
    'angular.module',
    'angular.directive',
    'angular.factory',
    'angular.service',
    'angular.config',
    'angular.controller',
    'angular.constant',
    'angular.getModule',
    '$rootScope',
    '$window',
    '$location',
    '$document',
    '$parse',
    '$compile',
    '$http',
    '$controller',
    '$state',
    '$stateParams',
    '$stateProvider',
    '$injector',
    '$timeout',
    '$q',
    '$exceptionHandler',
    'core/NgRegistry',
    '$interval',
    'logger',
    'spaceContext',
  ];
  const intersection = _.intersectionWith(modules, attributes, _.isEqual);
  return intersection.length > 0 ? intersection : false;
};

const react = (node) => {
  const modules = node.modules;
  if (!js(node) && !typescript(node)) {
    return false;
  }
  if (test(node)) {
    return false;
  }
  const attributes = [
    'react',
    'prop-types',
    'react-dom',
    'react-router-dom',
    'react-animate-height',
    '<react-component>',
  ];

  const intersection = _.intersectionWith(modules, attributes, _.isEqual);
  if (intersection.length > 0) {
    return intersection;
  }

  return false;
};

const needsRefactoring = (node) => {
  const modules = node.modules;

  if (test(node)) {
    return false;
  }

  const isAngular = angular(node);

  const attributes = [
    'jquery',
    'utils/command/command',
    'enzyme',
    'sinon',
    'services/client',
    'libs/legacy_client/client',
  ];
  let intersection = _.intersectionWith(modules, attributes, _.isEqual);

  if (isAngular) {
    intersection = intersection.concat(isAngular);
  }

  intersection = _.uniq(intersection);

  if (intersection.length > 0) {
    return intersection;
  }

  return jade(node);
};

module.exports = {
  all: all,
  js: js,
  jade: jade,
  test: test,
  jest: jest,
  typescript: typescript,
  angular: angular,
  react: react,
  needsRefactoring: needsRefactoring,
};
