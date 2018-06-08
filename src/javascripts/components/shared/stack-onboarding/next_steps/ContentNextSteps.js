export const name = 'ms-content-creator-next-steps';

angular.module('contentful')
  .factory(name, ['require', require => {
    return require('app/home/welcome/OnboardingWithTea').OnboardingWithTea;
  }]);
