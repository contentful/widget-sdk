'use strict';

describe('cfGoogleMaps Directive', function () {
  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers('GoogleMapsController');
    });

    var $q = this.$inject('$q'),
        stubs = {};

    stubs.setVisible = sinon.stub();
    stubs.setDraggable = sinon.stub();
    stubs.fitBounds = sinon.stub();
    stubs.panTo = sinon.stub();
    stubs.LatLng = sinon.stub();

    this.$inject('googleMapsLoader').load = function () {
      var stubbedGMap = {
        Map: sinon.stub().returns({
          getCenter: sinon.stub(),
          panTo: stubs.panTo,
          fitBounds: stubs.fitBounds
        }),
        Marker: sinon.stub().returns({
          setDraggable: stubs.setDraggable,
          setPosition: sinon.stub(),
          setVisible: stubs.setVisible
        }),
        LatLng: stubs.LatLng,
        MapTypeId: {
          ROADMAP: 'roadmap',
        },
        event: {
          addListener: sinon.stub()
        }
      };
      return $q.when(stubbedGMap);
    };
    this.stubs = stubs;
    this.scope = this.$inject('$rootScope').$new();
    this.scope.locationIsValid = sinon.stub();
    this.scope.otBindInternalChangeHandler = sinon.stub();
    this.compileElement = function () {
      this.element = this.$inject('$compile')('<cf-google-maps></cf-google-maps>')(this.scope);
      this.$apply();
    };
    this.compileElement.bind(this);
  });

  describe('watches for location change and location validity', function() {
    it('has map visible when location exists and is valid', function () {
      this.scope.location = {
        lat: 20,
        lon: 20
      };
      this.scope.locationValid = true;
      this.compileElement();
      expect(this.stubs.setVisible.args[0][0]).toBeTruthy();
    });

    it('has map hidden when location exists but not valid', function () {
      this.scope.location = {
        lat: 1000,
        lon: 1000
      };
      this.scope.locationValid = false;
      this.compileElement();
      expect(this.stubs.setVisible.args[0][0]).toBeFalsy();
    });

    it('has map visible when location does not exist but is still shown as valid, because showing a map in an uninitialized location editor is nice', function() {
      this.scope.location = null;
      this.scope.locationValid = true;
      this.compileElement();
      expect(this.stubs.setVisible.args[0][0]).toBeTruthy();
    });
  });

  describe('watches for otEditable status', function() {
    it('makes marker draggable when otEditable is true', function () {
      this.scope.otEditable = true;
      this.compileElement();
      expect(this.stubs.setDraggable.args[0][0]).toBeTruthy();
    });

    it('makes marker not draggable when otEditable is false', function () {
      this.scope.otEditable = false;
      this.compileElement();
      expect(this.stubs.setDraggable.args[0][0]).toBeFalsy();
    });
  });

  describe('selected result watcher', function() {
    var result;
    beforeEach(function() {
      result = {viewport: 'viewport'};
      this.compileElement();
      this.scope.selectedResult = result;
      this.$apply();
    });

    it('sends viewport to fitBounds method', function() {
      sinon.assert.calledWith(this.stubs.fitBounds, 'viewport');
    });
  });

  describe('pick result method', function() {
    var result;
    beforeEach(function() {
      result = {location: { lat: 111, lon: 222 }, viewport: 'viewport'};
      this.compileElement();
      this.scope.pickResult(result);
    });

    it('updates location', function() {
      expect(this.scope.location).toEqual(result.location);
    });

    it('sets fit bounds', function() {
      sinon.assert.calledWith(this.stubs.fitBounds, 'viewport');
    });

    it('searchTerm is empty', function() {
      expect(this.scope.searchTerm).toBe('');
    });
  });

  it('resets map location', function() {
    this.compileElement();
    var locationController = this.element.find('.google-map').controller('ngModel'),
        latLng = new this.stubs.LatLng();
    locationController.$viewValue = latLng;
    this.scope.resetMapLocation();
    sinon.assert.calledWith(this.stubs.panTo, latLng);
  });

  it('shows invalid location warning when location exists but is invalid', function () {
    this.compileElement();
    this.scope.location = { lat: 0, lon: 0 };
    this.scope.locationValid = false;
    this.scope.$digest();
    expect(this.element.find('.invalid-location-warning')).not.toBeNgHidden();
  });

  it('does not show invalid location warning when the location is nonexistent but still marked valid', function () {
    this.compileElement();
    this.scope.locationValid = true;
    this.scope.$digest();
    expect(this.element.find('.invalid-location-warning')).toBeNgHidden();
  });

  it('search is not shown if otEditable is not initiated ', function () {
    this.compileElement();
    this.scope.otEditable = false;
    this.scope.$digest();
    expect(this.element.find('.search')).toBeNgHidden();
  });

  it('search is shown if otEditable is not initiated ', function () {
    this.compileElement();
    this.scope.otEditable = true;
    this.scope.$digest();
    expect(this.element.find('.search')).not.toBeNgHidden();
  });

  describe('rendering results', function() {
    beforeEach(function() {
      this.compileElement();
      this.scope.otEditable = true;
      this.scope.selectedResult = {address: 'address', strippedLocation: {lat: 123, lon: 456}};
      this.scope.results = [
        this.scope.selectedResult,
        {address: 'address2', strippedLocation: {lat: 789, lon: 321}}
      ];
      this.scope.$digest();
    });

    it('results has 2 elements', function() {
      expect(this.element.find('.search-results li').length).toBe(2);
    });

    it('first element is selected', function() {
      expect(this.element.find('.search-results li').eq(0)).toHaveClass('selected');
    });

    it('second element is not selected', function() {
      expect(this.element.find('.search-results li').eq(1)).not.toHaveClass('selected');
    });
  });
});
