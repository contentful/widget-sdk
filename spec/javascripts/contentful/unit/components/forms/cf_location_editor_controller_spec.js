'use strict';

describe('cfLocationEditor Controller', function () {
  var controller;
  var scope;
  var spinnerStartStub, spinnerStopStub, geocodeStub, geocoderStub;

  beforeEach(function () {
    spinnerStartStub = sinon.stub();
    spinnerStopStub = sinon.stub();
    module('contentful/test', function ($provide) {
      spinnerStartStub.returns(spinnerStopStub);
      $provide.value('cfSpinner', {
        start: spinnerStartStub
      });
    });
    inject(function ($rootScope, $controller, $window) {
      scope = $rootScope.$new();

      geocoderStub = sinon.stub();
      geocodeStub = sinon.stub();
      geocoderStub.returns({geocode: geocodeStub});
      $window.google = {
        maps: {
          Geocoder: geocoderStub
        }
      };

      controller = $controller('cfLocationEditorCtrl', { $scope: scope });
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('location is valid', function() {
    expect(scope.locationIsValid({
      lat: 123.456,
      lon: 789.654
    })).toBeTruthy();
  });

  it('empty location is valid', function() {
    expect(scope.locationIsValid()).toBeTruthy();
  });

  it('location is invalid without latitude', function() {
    expect(scope.locationIsValid({
      lon: 789.654
    })).toBeFalsy();
  });

  it('location is invalid without longitude', function() {
    expect(scope.locationIsValid({
      lat: 789.654
    })).toBeFalsy();
  });

  it('location is invalid with bad value type', function() {
    expect(scope.locationIsValid({
      lat: '789.654'
    })).toBeFalsy();
  });

  describe('location watcher updates locationValid flag', function() {
    it('initial state', function() {
      expect(scope.locationValid).toBeTruthy();
    });

    it('after valid update', function() {
      scope.location = {
        lat: 123.456,
        lon: 789.654
      };
      scope.$digest();
      expect(scope.locationValid).toBeTruthy();
    });

    it('after invalid update', function() {
      scope.location = {
        lon: 789.654
      };
      scope.$digest();
      expect(scope.locationValid).toBeFalsy();
    });

  });

  describe('search term watcher', function() {
    var latStub, lonStub;
    describe('when search term is updated', function() {
      beforeEach(function() {
        latStub = sinon.stub();
        latStub.returns('0.123456789');
        lonStub = sinon.stub();
        lonStub.returns('0.123456789');
        geocodeStub.callsArgWithAsync(1, [
          {
            geometry: {
              location: {
                lat: latStub,
                lng: lonStub
              },
              viewport: 'viewportdata',
            },
            formatted_address: 'address'
          }
        ]);

        scope.searchTerm = 'somewhere';
        scope.$digest();
      });

      it('spinner is started', function () {
        expect(spinnerStartStub.called).toBeTruthy();
      });

      it('geocoder is created', function() {
        expect(geocoderStub.called).toBeTruthy();
      });

      it('geocoder method is called', function() {
        expect(geocodeStub.called).toBeTruthy();
      });

      it('address is sent to geocoder', function(done) {
        scope.$watch('results', function () {
          expect(geocodeStub.args[0][0].address).toBe('somewhere');
          done();
        });
      });

      it('stores and converts results', function (done) {
        scope.$watch('results', function () {
          expect(scope.results).toEqual([{
            location: {
              lat: '0.123456789',
              lon: '0.123456789'
            },
            strippedLocation: {
              lat: '0.123456',
              lon: '0.123456'
            },
            viewport: 'viewportdata',
            address: 'address'
          }]);
          done();
        });
      });

      it('stops spinner', function(done) {
        scope.$watch('results', function () {
          expect(spinnerStopStub.called).toBeTruthy();
          done();
        });
      });
    });

    describe('when search term is cleared', function() {
      beforeEach(function() {
        scope.resetMapLocation = sinon.stub();
        scope.searchTerm = 'somewhere';
        scope.$digest();
        scope.searchTerm = '';
        scope.$digest();
      });

      it('results are empty', function () {
        expect(scope.results).toEqual([]);
      });

      it('selected result is unset', function() {
        expect(scope.selectedResult).toBeNull();
      });

      it('map location is reset', function() {
        expect(scope.resetMapLocation.called).toBeTruthy();
      });
    });
  });

  describe('results watcher', function() {
    it('sets selected result', function() {
      var result = {first: true};
      scope.results = [result];
      scope.$digest();
      expect(scope.selectedResult).toBe(result);
    });

    it('clears selected result if results are not defined', function() {
      scope.results = undefined;
      scope.$digest();
      expect(scope.selectedResult).toBeNull();
    });

    it('clears selected result if results are empty', function() {
      scope.results = [];
      scope.$digest();
      expect(scope.selectedResult).toBeNull();
    });
  });

  it('sets selected result on autocomplete event', inject(function($rootScope) {
    var result = {result: true};
    $rootScope.$broadcast('autocompleteResultSelected', 0, result);
    expect(scope.selectedResult).toBe(result);
  }));

  describe('picks result on autocomplete event', function () {
    var result;
    beforeEach(inject(function($rootScope) {
      result = {result: true};
      scope.pickResult = sinon.stub();
      $rootScope.$broadcast('autocompleteResultPicked', 0, result);
    }));

    it('selects result', function () {
      expect(scope.selectedResult).toBe(result);
    });

    it('calls result picker', function() {
      expect(scope.pickResult.called).toBeTruthy();
    });
  });

});
