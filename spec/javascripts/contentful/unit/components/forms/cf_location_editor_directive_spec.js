'use strict';

describe('cfLocationEditor Directive', function () {
  var element, scope;
  var compileElement;
  var stubs;

  function ControllerMock() {
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'getCenter', 'panTo', 'setDraggable', 'setPosition', 'setVisible',
        'fitBounds', 'map', 'latLng', 'marker', 'addListener',
        'locationIsValid', 'serverError'
      ]);

      $provide.value('notification', {
        serverError: stubs.serverError
      });
    });
    inject(function ($compile, $rootScope, $window, cfLocationEditorDirective) {
      cfLocationEditorDirective[0].controller = ControllerMock;
      scope = $rootScope.$new();

      scope.locationIsValid = stubs.locationIsValid;

      scope.fieldData = { value: {}};

      stubs.map.returns({
        getCenter: stubs.getCenter,
        panTo: stubs.panTo,
        fitBounds: stubs.fitBounds
      });

      stubs.marker.returns({
        setDraggable: stubs.setDraggable,
        setPosition: stubs.setPosition,
        setVisible: stubs.setVisible
      });

      $window.google = {
        maps: {
          Map: stubs.map,
          LatLng: stubs.latLng,
          Marker: stubs.marker,
          MapTypeId: {
            ROADMAP: 'roadmap'
          },
          event: {
            addListener: stubs.addListener
          }
        }
      };

      compileElement = function () {
        element = $compile('<div class="cf-location-editor" ng-model="fieldData.value"></div>')(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('watches for location change and location validity', function() {
    it('when location exists and is valid', function() {
      scope.location = {};
      scope.locationValid = true;
      compileElement();
      expect(stubs.setVisible.args[0][0]).toBeTruthy();
    });

    it('when location exists but not valid', function() {
      scope.location = {};
      scope.locationValid = false;
      compileElement();
      expect(stubs.setVisible.args[0][0]).toBeFalsy();
    });

    it('when location does not exist and is valid its still true because of other watchers', function() {
      scope.location = null;
      scope.locationValid = true;
      compileElement();
      expect(stubs.setVisible.args[0][0]).toBeTruthy();
    });
  });

  describe('watches for otEditable status', function() {
    it('makes marker draggable', function () {
      scope.otEditable = true;
      compileElement();
      expect(stubs.setDraggable.args[0][0]).toBeTruthy();
    });

    it('makes marker not draggable', function () {
      scope.otEditable = false;
      compileElement();
      expect(stubs.setDraggable.args[0][0]).toBeFalsy();
    });
  });

  it('$render method updates location', function() {
    compileElement();
    element.controller('ngModel').$viewValue = {lat: 123, lon: 456};
    element.controller('ngModel').$render();
    expect(scope.location).toEqual({
      lat: 123, lon: 456
    });
  });

  describe('updateLocation method', function() {
    var viewValueStub, location, oldLocation;
    beforeEach(function() {
      compileElement();
      location = {lat: 123, lon: 456};
      oldLocation = {lat: 789, lon: 321};
      viewValueStub = sinon.stub();
      element.controller('ngModel').$setViewValue = viewValueStub;
      element.controller('ngModel').$modelValue = oldLocation;
      scope.otChangeValue = sinon.stub();
    });

    describe('updates successfully', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, null);
        scope.updateLocation(location);
      });

      it('sets location on scope', function() {
        expect(scope.location).toEqual(location);
      });

      it('calls ot change value with location', function() {
        expect(scope.otChangeValue.calledWith(location)).toBeTruthy();
      });

      it('calls $setViewValue with location', function() {
        expect(viewValueStub.calledWith(location)).toBeTruthy();
      });
    });

    describe('fails to update', function() {
      beforeEach(function() {
        scope.otChangeValue.callsArgWith(1, {error: true});
        scope.updateLocation(location);
      });

      it('calls ot change value with location', function() {
        expect(scope.otChangeValue.calledWith(location)).toBeTruthy();
      });

      it('shows error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });

      it('sets location back to ngModel value', function() {
        expect(scope.location).toEqual(oldLocation);
      });
    });
  });

  it('removes the location', function() {
    compileElement();
    scope.updateLocation = sinon.stub();
    scope.removeLocation();
    expect(scope.updateLocation.calledWith(null)).toBeTruthy();
  });

  describe('watches for location validity', function() {
    beforeEach(function() {
      compileElement();
    });

    describe('sets alerts for both', function() {
      beforeEach(function() {
        scope.location = {lat: '', lon: ''};
        scope.$digest();
      });

      it('alert for latitude', function() {
        expect(scope.latAlert).toBeDefined();
      });

      it('alert for longitude', function() {
        expect(scope.lonAlert).toBeDefined();
      });
    });

    describe('sets alerts for none', function() {
      beforeEach(function() {
        scope.location = {lat: 123, lon: 456};
        scope.$digest();
      });

      it('alert for latitude', function() {
        expect(scope.latAlert).toBeNull();
      });

      it('alert for longitude', function() {
        expect(scope.lonAlert).toBeNull();
      });
    });

    describe('sets alerts for latitude', function() {
      beforeEach(function() {
        scope.location = {lat: '', lon: 456};
        scope.$digest();
      });

      it('alert for latitude', function() {
        expect(scope.latAlert).toBeDefined();
      });

      it('alert for longitude', function() {
        expect(scope.lonAlert).toBeNull();
      });
    });

    describe('sets alerts for longitude', function() {
      beforeEach(function() {
        scope.location = {lat: 123, lon: ''};
        scope.$digest();
      });

      it('alert for latitude', function() {
        expect(scope.latAlert).toBeNull();
      });

      it('alert for longitude', function() {
        expect(scope.lonAlert).toBeTruthy();
      });
    });

  });

  describe('selected result watcher', function() {
    var result;
    beforeEach(function() {
      result = {viewport: 'viewport'};
      compileElement();
      scope.selectedResult = result;
      scope.$digest();
    });

    it('sends viewport to fitBounds method', function() {
      expect(stubs.fitBounds.calledWith('viewport')).toBeTruthy();
    });
  });

  describe('pick result method', function() {
    var result;
    beforeEach(function() {
      result = {location: 'location', viewport: 'viewport'};
      compileElement();
      scope.updateLocation = sinon.stub();
      scope.pickResult(result);
    });

    it('updates location', function() {
      expect(scope.updateLocation.calledWith('location')).toBeTruthy();
    });

    it('sets fit bounds', function() {
      expect(stubs.fitBounds.calledWith('viewport')).toBeTruthy();
    });

    it('searchTerm is empty', function() {
      expect(scope.searchTerm).toBe('');
    });
  });

  it('resets map location', function() {
    compileElement();
    var locationController = element.find('.gmaps-container').controller('ngModel');
    locationController.$viewValue = new stubs.latLng();
    scope.resetMapLocation();
    expect(stubs.panTo).toBeCalled();
  });

  it('shows corrupt location warning', function () {
    compileElement();
    scope.locationValid = false;
    scope.$digest();
    expect(element.find('.invalid-location-warning')).not.toBeNgHidden();
  });

  it('does not show corrupt location warning', function () {
    compileElement();
    scope.locationValid = true;
    scope.$digest();
    expect(element.find('.invalid-location-warning')).toBeNgHidden();
  });

  describe('if otEditable is not initiated', function() {
    beforeEach(function() {
      compileElement();
      scope.otEditable = false;
      scope.$digest();
    });

    it('search is not shown', function () {
      expect(element.find('.search')).toBeNgHidden();
    });

    it('latitude input is disabled', function () {
      expect(element.find('input.lat').attr('disabled')).toBeTruthy();
    });

    it('latitude input is disabled', function () {
      expect(element.find('input.lon').attr('disabled')).toBeTruthy();
    });


    it('remove button is not shown', function () {
      expect(element.find('.remove-location')).toBeNgHidden();
    });
  });

  describe('if otEditable is initiated', function() {
    beforeEach(function() {
      compileElement();
      scope.otEditable = true;
      scope.$digest();
    });

    it('search is shown', function () {
      expect(element.find('.search')).not.toBeNgHidden();
    });

    it('latitude input is enabled', function () {
      expect(element.find('input.lat').attr('disabled')).toBeFalsy();
    });

    it('latitude input is enabled', function () {
      expect(element.find('input.lon').attr('disabled')).toBeFalsy();
    });

    it('remove button is shown', function () {
      expect(element.find('.remove-location')).not.toBeNgHidden();
    });
  });

  describe('rendering results', function() {
    beforeEach(function() {
      compileElement();
      scope.otEditable = true;
      scope.selectedResult = {address: 'address', strippedLocation: {lat: 123, lon: 456}};
      scope.results = [
        scope.selectedResult,
        {address: 'address2', strippedLocation: {lat: 789, lon: 321}}
      ];
      scope.$digest();
    });

    it('results has 2 elements', function() {
      expect(element.find('.results li').length).toBe(2);
    });

    it('first element is selected', function() {
      expect(element.find('.results li').eq(0)).toHaveClass('selected');
    });

    it('second element is not selected', function() {
      expect(element.find('.results li').eq(1)).not.toHaveClass('selected');
    });
  });

});
