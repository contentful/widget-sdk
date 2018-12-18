'use strict';
import _ from 'lodash';
import $ from 'jquery';

describe('LocationEditor integration', () => {
  beforeEach(function() {
    this.googleMaps = createGoogleMapsStub();
    module('contentful/test', $provide => {
      $provide.value('LazyLoader', {
        get: sinon.stub().resolves(this.googleMaps)
      });
      $provide.value('throttle', _.identity);
    });

    this.fieldApi = {
      onValueChanged: sinon.stub().yields(),
      onIsDisabledChanged: sinon.stub().yields(),
      removeValue: sinon.stub(),
      setValue: sinon.stub()
    };

    this.compile = function() {
      const el = this.$compile(
        '<cf-location-editor>',
        {},
        {
          cfWidgetApi: { field: this.fieldApi }
        }
      );
      // Enable visibility checks. If not attached to body all elemnts
      // are always hidden.
      el.appendTo('body');
      this.$apply();
      return extendWithUiMethods(el, this);
    };
  });

  describe('input method selection', () => {
    beforeEach(function() {
      this.el = this.compile();
    });

    it('shows address initially', function() {
      expect(this.el.find('input[name=address]').is(':visible')).toEqual(true);
      expect(this.el.find('input[name=lat]').is(':visible')).toEqual(false);
      expect(this.el.find('input[name=lon]').is(':visible')).toEqual(false);
    });

    it('shows coordinates when selected', function() {
      this.el
        .find('input[name="inputMethod"][ng-value=COORDINATES]')
        .prop('checked', true)
        .click();
      this.$apply();

      expect(this.el.find('input[name=lat]').is(':visible')).toEqual(true);
      expect(this.el.find('input[name=lon]').is(':visible')).toEqual(true);
    });

    it('shows address when selected', function() {
      this.el
        .find('input[name="inputMethod"][ng-value=COORDINATES]')
        .prop('checked', true)
        .click();
      this.$apply();
      expect(this.el.find('input[name=address]').is(':visible')).toEqual(false);

      this.el
        .find('input[name="inputMethod"][ng-value=ADDRESS]')
        .prop('checked', true)
        .click();
      this.$apply();
      expect(this.el.find('input[name=address]').is(':visible')).toEqual(true);
    });
  });

  describe('address search', () => {
    beforeEach(function() {
      this.fieldApi.onValueChanged.yields({ lat: 1, lon: 2 });
      this.el = this.compile();
      this.geocode = this.googleMaps.geocoder.geocode;
    });

    it('populates address search from initial location', function() {
      sinon.assert.calledWith(this.geocode, { location: { lat: 1, lng: 2 } });
      this.geocode.callArgWith(1, [makeSearchResult('ADDRESS')]);
      this.$apply();
      expect(this.el.getInputValue('address')).toEqual('ADDRESS');
    });

    it('requests search results', function() {
      this.el.setInputValue('address', 'something');
      sinon.assert.calledWith(this.geocode, { address: 'something' });
    });

    it('populates result completion', function() {
      this.el.setInputValue('address', 'something');

      const results = ['A 1', 'A 2', 'A 3'];
      this.geocode.callArgWith(1, results.map(makeSearchResult));

      this.$apply();
      const resultItems = this.el
        .find('[data-test-id=search-results] li')
        .map(function() {
          return $(this).text();
        })
        .get();
      expect(resultItems).toEqual(results);
    });

    it('hides results when search input is emptied', function() {
      this.el.setInputValue('address', 'something');

      this.geocode.callArgWith(1, [makeSearchResult('ADDRESS')]);
      this.$apply();
      const resultElement = this.el.find('[data-test-id=search-results]');
      expect(resultElement.is(':visible')).toBe(true);

      this.el.setInputValue('address', '');
      this.$apply();
      expect(resultElement.is(':visible')).toBe(false);
    });

    describe('selecting address', () => {
      beforeEach(function() {
        this.el.setInputValue('address', 'something');
        this.geocode.callArgWith(1, [
          makeSearchResult('A 1', 0, 0),
          makeSearchResult('A 2', -1, -2)
        ]);
        this.$apply();

        this.el.find('[data-test-id=search-results] li:contains(A 2)').click();
        this.$apply();
      });

      it('updates location input', function() {
        this.el.getInputValue('lat', -1);
        this.el.getInputValue('lon', -2);
      });

      it('updates location data', function() {
        sinon.assert.calledWithExactly(this.fieldApi.setValue, { lat: -1, lon: -2 });
      });

      it('sets the search address', function() {
        this.el.getInputValue('address', 'A 2');
      });
    });

    it('shows error message when there are no results', function() {
      this.el.setInputValue('address', 'something');
      this.geocode.callArgWith(1, []);
      this.$apply();
      expect(this.el.findStatus('address-not-found').length).toBe(1);
    });

    it('shows error message when map APIs errors', function() {
      this.el.setInputValue('address', 'something');
      this.geocode.callArgWith(2, new Error('ERROR'));
      this.$apply();
      expect(this.el.findStatus('address-search-failed').length).toBe(1);
    });
  });

  describe('coordinate input', () => {
    beforeEach(function() {
      this.fieldApi.onValueChanged.yields({ lat: 1, lon: 2 });
      this.el = this.compile();
    });

    it('updated when value changes', function() {
      this.fieldApi.onValueChanged.yield({ lat: -1, lon: -2 });
      this.$apply();
      expect(this.el.getInputValue('lat')).toEqual('-1');
      expect(this.el.getInputValue('lon')).toEqual('-2');
    });

    it('updates field data', function() {
      this.el.setInputValue('lat', '-1');
      sinon.assert.calledWithExactly(this.fieldApi.setValue, { lat: -1, lon: 2 });
    });

    it('updates map', function() {
      const marker = this.googleMaps.marker;
      const map = this.googleMaps.map;

      this.el.setInputValue('lon', '-1');
      sinon.assert.calledWithExactly(marker.setPosition, { lat: 1, lng: -1 });
      sinon.assert.calledWithExactly(map.panTo, { lat: 1, lng: -1 });
    });

    it('removes map marker when value is empty', function() {
      const marker = this.googleMaps.marker;
      marker.setVisible.reset();

      this.el.setInputValue('lat', '');
      sinon.assert.calledWithExactly(marker.setVisible, false);
    });

    it('removes location data when value is empty', function() {
      sinon.assert.notCalled(this.fieldApi.removeValue);
      this.el.setInputValue('lat', '');
      sinon.assert.calledOnce(this.fieldApi.removeValue);
    });

    it('looks up and sets address', function() {
      const geocode = this.googleMaps.geocoder.geocode;
      geocode.reset();

      this.el.setInputValue('lat', '-1');
      sinon.assert.calledWith(geocode, { location: { lat: -1, lng: 2 } });

      geocode.callArgWith(1, [{ formatted_address: 'ADDRESS' }]);
      this.$apply();
      expect(this.el.getInputValue('address')).toEqual('ADDRESS');
    });
  });

  describe('map', () => {
    it('selects location when marker is dragged', function() {
      this.compile();
      this.googleMaps.event.addListener.withArgs(sinon.match.any, 'dragend').yield({
        latLng: createLatLng(1, 2)
      });
      sinon.assert.calledWithExactly(this.fieldApi.setValue, { lat: 1, lon: 2 });
    });

    it('selects location when marker placed', function() {
      this.compile();
      this.googleMaps.event.addListener.withArgs(sinon.match.any, 'click').yield({
        latLng: createLatLng(1, 2)
      });
      sinon.assert.calledWithExactly(this.fieldApi.setValue, { lat: 1, lon: 2 });
    });

    it('shows loading box while loading', function() {
      const LazyLoader = this.$inject('LazyLoader');
      LazyLoader.get.defers();
      const el = this.compile();

      expect(el.findStatus('loading').length).toEqual(1);

      LazyLoader.get.resolve(createGoogleMapsStub());
      this.$apply();
      expect(el.findStatus('loading').length).toEqual(0);
    });

    it('shows initialization error when loading fails', function() {
      const LazyLoader = this.$inject('LazyLoader');
      LazyLoader.get.defers();
      const el = this.compile();
      const alertSelector = '[role=alert]' + '[data-error-code=field-editor-initialization]';

      expect(el.find(alertSelector).length).toEqual(0);

      LazyLoader.get.reject(new Error());
      this.$apply();
      expect(el.find(alertSelector).length).toEqual(1);
    });
  });

  function extendWithUiMethods(el, context) {
    el.setInputValue = (name, value) => {
      el.find('[name=' + name + ']')
        .val(value)
        .trigger('change');
      context.$apply();
    };

    el.getInputValue = name => {
      context.$apply();
      return el.find('[name=' + name + ']').val();
    };

    el.findStatus = code => el.find('[role=status]' + '[data-status-code=' + code + ']');

    return el;
  }

  function createGoogleMapsStub() {
    const map = {
      getCenter: sinon.stub(),
      panTo: sinon.stub(),
      fitBounds: sinon.stub()
    };

    const marker = {
      setDraggable: sinon.stub(),
      setPosition: sinon.stub(),
      setVisible: sinon.stub()
    };

    const geocoder = {
      geocode: sinon.stub()
    };

    return {
      map: map,
      Map: sinon.stub().returns(map),

      marker: marker,
      Marker: sinon.stub().returns(marker),

      geocoder: geocoder,
      Geocoder: sinon.stub().returns(geocoder),

      MapTypeId: {
        ROADMAP: 'roadmap'
      },
      event: {
        addListener: sinon.stub(),
        clearInstanceListeners: sinon.stub()
      }
    };
  }

  function makeSearchResult(address, lat, lng) {
    return {
      formatted_address: address,
      geometry: {
        location: {
          lat: sinon.stub().returns(lat || 1),
          lng: sinon.stub().returns(lng || 2)
        }
      }
    };
  }

  function createLatLng(lat, lng) {
    return {
      lat: sinon.stub().returns(lat),
      lng: sinon.stub().returns(lng)
    };
  }
});
