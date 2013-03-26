var UserInterface = {
  worf: require('worf'),
  validation: require('validation'),
  client: require('contentful-client')
};

module.exports = UserInterface;

if (window) {
  window.UserInterface = UserInterface;
}

if (angular) {
  angular.module('contentful/user_interface', []).
    value('contentfulClient', UserInterface.client).
    value('validation', UserInterface.validation).
    value('worf', UserInterface.worf);
}

