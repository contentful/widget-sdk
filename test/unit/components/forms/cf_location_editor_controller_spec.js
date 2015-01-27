'use strict';

describe('cfLocationEditor Controller', function () {
  beforeEach(function () {
    module('contentful/test');

    this.scope = this.$inject('$rootScope').$new();

    this.$inject('$controller')('cfLocationEditorController', { $scope: this.scope });
    this.scope.$digest();
  });

  it('location is valid', function() {
    expect(this.scope.locationIsValid({
      lat: 123.456,
      lon: 789.654
    })).toBeTruthy();
  });

  it('empty location is invalid', function() {
    expect(this.scope.locationIsValid()).toBeFalsy();
  });

  it('location is invalid without latitude', function() {
    expect(this.scope.locationIsValid({
      lon: 789.654
    })).toBeFalsy();
  });

  it('location is invalid without longitude', function() {
    expect(this.scope.locationIsValid({
      lat: 789.654
    })).toBeFalsy();
  });

  it('location is invalid with bad value type', function() {
    expect(this.scope.locationIsValid({
      lat: '789.654'
    })).toBeFalsy();
  });

  describe('location watcher updates locationValid flag', function() {
    it('initial state', function() {
      expect(this.scope.locationValid).toBeFalsy();
    });

    it('after valid update', function() {
      this.scope.location = {
        lat: 123.456,
        lon: 789.654
      };
      this.scope.$digest();
      expect(this.scope.locationValid).toBeTruthy();
    });

    it('after invalid update', function() {
      this.scope.location = {
        lon: 789.654
      };
      this.scope.$digest();
      expect(this.scope.locationValid).toBeFalsy();
    });
  });
});
