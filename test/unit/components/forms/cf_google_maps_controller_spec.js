'use strict';

describe('GoogleMaps Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    var $q = this.$inject('$q'),
        controller,
        stubs = {};

    stubs.geocode = sinon.stub();
    stubs.geocoder = sinon.stub().returns({ geocode: stubs.geocode });

    this.$inject('googleMapsLoader').load = function () {
      var stubbedGMap = {
        Geocoder: stubs.geocoder
      };
      return $q.when(stubbedGMap);
    };

    this.stubs = stubs;
    this.scope = this.$inject('$rootScope').$new();
    controller = this.$inject('$controller')('GoogleMapsController', { $scope: this.scope });
    this.$apply();
  });

  describe('search term watcher', function() {
    var latStub, lonStub;
    describe('when search term is updated', function() {
      beforeEach(function() {
        latStub = sinon.stub();
        latStub.returns('0.123456789');
        lonStub = sinon.stub();
        lonStub.returns('0.123456789');
        this.stubs.geocode.callsArgWithAsync(1, [
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

        this.scope.searchTerm = 'somewhere';
        this.scope.$digest();
      });

      it('geocoder is created', function() {
        expect(this.stubs.geocoder).toBeCalled();
      });

      it('geocoder method is called', function() {
        expect(this.stubs.geocode).toBeCalled();
      });

      it('address is sent to geocoder', function(done) {
        var geocode = this.stubs.geocode;
        this.scope.$watch('results', function () {
          expect(geocode.args[0][0].address).toBe('somewhere');
          done();
        });
      });

      it('stores and converts results', function (done) {
        var scope = this.scope;
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
    });

    describe('when search term is cleared', function() {
      beforeEach(function() {
        this.scope.resetMapLocation = sinon.stub();
        this.scope.searchTerm = 'somewhere';
        this.scope.$digest();
        this.scope.searchTerm = '';
        this.scope.$digest();
      });

      it('results are empty', function () {
        expect(this.scope.results).toEqual([]);
      });

      it('selected result is unset', function() {
        expect(this.scope.selectedResult).toBeNull();
      });

      it('map location is reset', function() {
        expect(this.scope.resetMapLocation).toBeCalled();
      });
    });
  });

  describe('results watcher', function() {
    it('sets selected result', function() {
      var result = {first: true};
      this.scope.results = [result];
      this.scope.$digest();
      expect(this.scope.selectedResult).toBe(result);
    });

    it('clears selected result if results are not defined', function() {
      this.scope.results = undefined;
      this.scope.$digest();
      expect(this.scope.selectedResult).toBeNull();
    });

    it('clears selected result if results are empty', function() {
      this.scope.results = [];
      this.scope.$digest();
      expect(this.scope.selectedResult).toBeNull();
    });
  });

  it('sets selected result on autocomplete event', function() {
    var result = {result: true};
    this.$inject('$rootScope').$broadcast('autocompleteResultSelected', 0, result);
    expect(this.scope.selectedResult).toBe(result);
  });

  it('clears the searchTerm on autocomplete cancel event', function () {
    this.scope.searchTerm = 'foo';
    this.scope.$broadcast('autocompleteResultsCancel');
    expect(this.scope.searchTerm).toBe('');
  });

  it('cancels the default action on autocomplete cancel if the searchterm is already empty', function () {
    var event;
    this.scope.searchTerm = 'foo';
    event = this.scope.$broadcast('autocompleteResultsCancel');
    expect(event.defaultPrevented).toBe(false);

    this.scope.searchTerm = '';
    event = this.scope.$broadcast('autocompleteResultsCancel');
    expect(event.defaultPrevented).toBe(true);
  });

  describe('picks result on autocomplete event', function () {
    var result;
    beforeEach(function () {
      result = {result: true};
      this.scope.pickResult = sinon.stub();
      this.$inject('$rootScope').$broadcast('autocompleteResultPicked', 0, result);
    });

    it('selects result', function () {
      expect(this.scope.selectedResult).toBe(result);
    });

    it('calls result picker', function() {
      expect(this.scope.pickResult).toBeCalled();
    });
  });
});
