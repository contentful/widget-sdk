'use strict';

describe('Client Controller', function () {
  var clientController, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope){
    scope = $rootScope.$new();
    clientController = $controller('ClientCtrl', {$scope: scope});
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('token lookup', function () {
    it('should update the user and the spaces');
  });

  describe('when the route has changed', function () {
    it('should do nothing when spaces have not been loaded');
    it('should set the space to the space in the route');
    it('TODO should give error message when space not found');
  });

  describe('when space or tokenlookup change', function () {
    it('should update the authorization');
  });

  describe('when changing the list of spaces', function () {
    describe('when the route requests a spaceId', function () {
      it('should switch to that space if available');
      it('should pick first and display error if not available');
    });
    describe('when the route requests no spaceId', function () {
      it('should switch to the first space for root');
      it('should do nothing for profile');
    });
    describe('if there is no space to choose', function () {
      it('should reroute to /');
    });
    describe('if the space isn\'t already selected', function () {
      it('should reroute to the space');
      it('should simply open the space if the route is already correct');
    });
  });

  describe('receiving iframeMessages', function () {
    it('TODO space update');
    it('should log out on user cancellation');
    it('TODO user update');
    it('should display flashes as notification');
    it('should should fallback to tokenLookup');
    it('should NOT do a token lookup when location was updated');
  });

  describe('client initialization', function () {
   it('should login user to analytics');
   it('should display the tutorial');
  });

  describe('Interval checks', function () {
    it('should check for new Version and update token if active');
    it('should demand reload when tokenLookup fails');
  });
});
