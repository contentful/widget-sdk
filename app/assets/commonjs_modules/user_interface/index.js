var UserInterface = {
  worf: require('worf'),
  validation: require('validation'),
  client: require('contentful-client')
};

module.exports = UserInterface;

if (window) {
  window.UserInterface = UserInterface;
}
