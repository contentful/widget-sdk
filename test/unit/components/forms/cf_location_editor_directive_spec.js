'use strict';

describe('cfLocationEditor Directive', function () {
  beforeEach(function () {
    var stubs = {};

    stubs.serverError = sinon.stub();
    stubs.otChangeValue = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.removeControllers('cfLocationEditorController');

      $provide.value('notification', {
        serverError: stubs.serverError
      });

      $provide.stubDirective('otPath', {
        controller: function ($scope, $q) {
          $scope.otChangeValue = stubs.otChangeValue.returns($q.when());
        }
      });
    });

    this.stubs = stubs;
    this.scope = this.$inject('$rootScope').$new();
    this.scope.locationIsValid = sinon.stub();
    dotty.put(this.scope, 'fieldData.value', {});
    this.compileElement = function () {
      this.element = this.$inject('$compile')('<div cf-location-editor ot-path="" ot-bind-internal="location" ng-model="fieldData.value"></div>')(this.scope);
      this.$apply();
    };
    this.compileElement.bind(this);
  });

  describe('updateLocation method', function() {
    var location, oldLocation;
    beforeEach(function() {
      this.compileElement();
      location    = {lat: 123, lon: 456};
      oldLocation = {lat: 789, lon: 321};
      this.scope.location        = location;
      this.scope.fieldData.value = oldLocation;
      //element.controller('ngModel').$setViewValue = viewValueStub = sinon.stub();
      //element.controller('ngModel').$modelValue = oldLocation;
    });

    describe('updates successfully', function() {
      beforeEach(function() {
        this.scope.updateLocation(location);
        this.scope.$apply();
      });

      it('sets location on scope', function() {
        expect(this.scope.location).toEqual(location);
      });

      it('calls ot change value with location', function() {
        sinon.assert.calledWith(this.scope.otChangeValue, location);
      });

      it('update external value', function() {
        expect(this.scope.fieldData.value).toEqual(location);
      });
    });

    describe('fails to update', function() {
      beforeEach(inject(function($q) {
        this.stubs.otChangeValue.returns($q.reject());
        this.scope.updateLocation(location);
        this.scope.$apply();
      }));

      it('sets location back to ngModel value', function() {
        expect(this.scope.location).toEqual(oldLocation);
      });

      it('calls ot change value with location', function() {
        sinon.assert.calledWith(this.scope.otChangeValue, location);
      });

      it('resets external value', function() {
        expect(this.scope.fieldData.value).toEqual(oldLocation);
      });
    });
  });

  it('removes the location', function() {
    this.compileElement();
    this.scope.updateLocation = sinon.stub();
    this.scope.removeLocation();
    sinon.assert.calledWith(this.scope.updateLocation, null);
  });

  describe('watches for location validity', function() {
    beforeEach(function() {
      this.compileElement();
    });

    describe('sets alerts for both', function() {
      beforeEach(function() {
        this.scope.location = {lat: '', lon: ''};
        this.scope.$digest();
      });

      it('alert for latitude', function() {
        expect(this.scope.latAlert).toBeDefined();
      });

      it('alert for longitude', function() {
        expect(this.scope.lonAlert).toBeDefined();
      });
    });

    describe('sets alerts for none', function() {
      beforeEach(function() {
        this.scope.location = {lat: 123, lon: 456};
        this.scope.$digest();
      });

      it('alert for latitude', function() {
        expect(this.scope.latAlert).toBeNull();
      });

      it('alert for longitude', function() {
        expect(this.scope.lonAlert).toBeNull();
      });
    });

    describe('sets alerts for latitude', function() {
      beforeEach(function() {
        this.scope.location = {lat: '', lon: 456};
        this.scope.$digest();
      });

      it('alert for latitude', function() {
        expect(this.scope.latAlert).toBeDefined();
      });

      it('alert for longitude', function() {
        expect(this.scope.lonAlert).toBeNull();
      });
    });

    describe('sets alerts for longitude', function() {
      beforeEach(function() {
        this.scope.location = {lat: 123, lon: ''};
        this.scope.$digest();
      });

      it('alert for latitude', function() {
        expect(this.scope.latAlert).toBeNull();
      });

      it('alert for longitude', function() {
        expect(this.scope.lonAlert).toBeTruthy();
      });
    });

  });

  describe('if otEditable is not initiated', function() {
    beforeEach(function() {
      this.compileElement();
      this.scope.otEditable = false;
      this.scope.$digest();
    });

    it('latitude input is disabled', function () {
      expect(this.element.find('input.lat').attr('disabled')).toBeTruthy();
    });

    it('latitude input is disabled', function () {
      expect(this.element.find('input.lon').attr('disabled')).toBeTruthy();
    });

    it('remove button is not shown', function () {
      expect(this.element.find('button:contains("Remove")')).toBeNgHidden();
    });
  });

  describe('if otEditable is initiated', function() {
    beforeEach(function() {
      this.compileElement();
      this.scope.otEditable = true;
      this.scope.$digest();
    });

    it('latitude input is enabled', function () {
      expect(this.element.find('input.lat').attr('disabled')).toBeFalsy();
    });

    it('latitude input is enabled', function () {
      expect(this.element.find('input.lon').attr('disabled')).toBeFalsy();
    });

    it('remove button is shown', function () {
      expect(this.element.find('.remove-location')).not.toBeNgHidden();
    });
  });
});
