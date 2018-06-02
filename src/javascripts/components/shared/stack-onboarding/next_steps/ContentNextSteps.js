const moduleName = 'ms-content-creator-next-steps';

angular.module('contentful')
  .factory(moduleName, ['require', require => {
    return require('app/home/welcome/OnboardingWithTea').OnboardingWithTea;
  }]);

export const name = module;
