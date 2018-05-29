const moduleName = 'ms-content-creator-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    return require('app/home/welcome/OnboardingWithTea').default;
  }]);

export const name = module;
