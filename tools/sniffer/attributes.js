const _ = require('lodash');

const all = () => true;

const js = node => node.extension === '.js';

const jade = node => node.extension === '.jade';

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
    '$timeout',
    '$q',
    'NgRegistry',
    '$interval',
    'ReloadNotification',
    'modalDialog',
    'notification',
    'states/Navigator',
    'cf-context-menu-trigger',
    'cf-context-menu',
    'cf-ui-sticky-container',
    'navigation/confirmLeaveEditor'
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
    'ui/Framework',
    'ui/Framework/DOMRenderer',
    'utils/legacy-html-hyperscript'
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
    'ReduxStore/store',
    'downshift',
    'slate-react',
    'reactServiceContext',
    '<react-component>'
  ];
  const intersection = _.intersectionWith(modules, attributes, _.isEqual);
  if (intersection.length > 0) {
    return intersection;
  }

  // mark all redux files as `react`
  if (node.path.indexOf('ReduxAppActions') !== -1) {
    return true;
  }
  return false;
};

const angularImplicit = node => {
  if (!js(node)) {
    return false;
  }

  const result = node.modules.filter(item => item.includes('.implicit'));
  return result.length > 0 ? result : false;
};

const needsRefactoring = node => {
  const modules = node.modules;

  if (test(node)) {
    return false;
  }

  const isAngular = angular(node);
  const isHyperscript = hyperscript(node);
  const isAngularImplicit = angularImplicit(node);

  const attributes = ['create-react-class', 'app/Workbench', 'jquery', 'spaceContext'];
  let intersection = _.intersectionWith(modules, attributes, _.isEqual);

  if (isAngular) {
    intersection = intersection.concat(isAngular);
  }
  if (isHyperscript) {
    intersection = intersection.concat(isHyperscript);
  }
  if (isAngularImplicit) {
    intersection = intersection.concat(isAngularImplicit);
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
  karma: karma,
  angular: angular,
  angularImplicit: angularImplicit,
  hyperscript: hyperscript,
  react: react,
  needsRefactoring: needsRefactoring
};
