var UserInterface = {
  worf: require('worf'),
  validation: require('validation'),
  client: require('contentful-client')
};

module.exports = UserInterface;

if (angular) {
  angular.module('contentful/user_interface', []).
    constant('contentfulClient', UserInterface.client).
    constant('validation', UserInterface.validation).
    constant('worf', UserInterface.worf);
}

