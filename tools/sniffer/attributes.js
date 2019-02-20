const _ = require('lodash');

const all = () => true;

const js = node => node.extension === '.js';

const jade = node => node.extension === '.jade';

const stylus = node => node.extension === '.styl';

const test = node => js(node) && node.path.indexOf('spec.js') !== -1;

const jest = node => test(node) && node.path.indexOf('src/javascripts') !== -1;

const karma = node => test(node) && node.path.indexOf('src/javascripts') === -1;

const angular = node => {
  const modules = node.modules;
  if (!js(node)) {
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
    '$injector',
    '$timeout',
    '$q',
    'NgRegistry',
    '$interval',
    'ReloadNotification',
    'modalDialog',
    'logger',
    'notification',
    'command',
    'spaceContext',
    'PolicyBuilder',
    'PolicyBuilder/CONFIG',
    'states/Navigator',
    'cf-context-menu-trigger',
    'cf-context-menu',
    'cf-ui-sticky-container',
    'navigation/confirmLeaveEditor',
    'analytics/Analytics.es6'
  ];
  const intersection = _.intersectionWith(modules, attributes, _.isEqual);
  return intersection.length > 0 ? intersection : false;
};

const hyperscript = node => {
  const modules = node.modules;
  if (!js(node)) {
    return false;
  }
  if (test(node)) {
    return false;
  }
  const attributes = [
    'utils/hyperscript',
    'ui/Framework/index',
    'ui/Framework',
    'utils/legacy-html-hyperscript',
    'utils/legacy-html-hyperscript/index'
  ];
  const intersection = _.intersectionWith(modules, attributes, _.isEqual);
  return intersection.length > 0 ? intersection : false;
};

const react = node => {
  const modules = node.modules;
  if (!js(node)) {
    return false;
  }
  if (test(node)) {
    return false;
  }
  const attributes = [
    'react',
    'prop-types',
    'redux',
    'redux-thunk',
    'create-react-class',
    'create-react-context',
    'react-dom',
    'react-redux',
    'react-router-dom',
    'app/WorkbenchReact',
    'react-codemirror',
    'react-animate-height',
    'react-tippy',
    'redux/store',
    'downshift',
    'slate-react',
    '<react-component>'
  ];
  const intersection = _.intersectionWith(modules, attributes, _.isEqual);
  if (intersection.length > 0) {
    return intersection;
  }

  // mark all redux files as `react`
  if (node.path.indexOf('redux') !== -1) {
    return true;
  }
  return false;
};

const needsRefactoring = node => {
  const modules = node.modules;

  if (test(node)) {
    return false;
  }

  const isAngular = angular(node);
  const isHyperscript = hyperscript(node);

  const attributes = [
    'create-react-class',
    'jquery',
    'ui/Framework/CfComponentBridgeDirective',
    'ui/Framework/Store'
  ];
  let intersection = _.intersectionWith(modules, attributes, _.isEqual);

  if (isAngular) {
    intersection = intersection.concat(isAngular);
  }
  if (isHyperscript) {
    intersection = intersection.concat(isHyperscript);
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
  stylus: stylus,
  jest: jest,
  karma: karma,
  angular: angular,
  hyperscript: hyperscript,
  react: react,
  needsRefactoring: needsRefactoring
};
