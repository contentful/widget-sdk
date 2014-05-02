/*global moment*/
'use strict';

describe('DateTime Editor', function () {
  var element, scope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope){
    scope = $rootScope;
    scope.otChangeValue = function (value, callback) {
      scope.$evalAsync(function () {
        callback();
      });
    };
    scope.otPath = [];
    scope.fieldData = {value: null};
    element = $compile('<div class="cf-datetime-editor" ng-model="fieldData.value"></div>')(scope);
    scope.$apply();
  }));

  afterEach(inject(function ($log) {
    element.find('.date').datepicker('destroy');
    element.remove();
    $log.assertEmpty();
  }));

  function enter(date, time, zone) {
    if (date !== null && date !== undefined) element.find('.date').val(date).
        trigger('input').
        trigger('change').
        trigger('blur');
    if (time !== null && time !== undefined) element.find('.time').val(time).
        trigger('input').
        trigger('change');
    if (zone !== null && zone !== undefined) {
      var zoneIndex = _.indexOf(scope.timezones, zone);
      var $zone = element.find('.zone');
      $zone.val(zoneIndex);
      $zone.trigger('change');
    }
  }

  function expectScope(date, time, zone) {
    if (date) expect(scope.localDate).toBe(date);
    if (time) expect(scope.localTime).toBe(time);
    if (zone) expect(scope.tzOffset).toBe(zone);
  }

  function expectFields(date, time, zone) {
    if (date) expect(element.find('.date').val()).toBe(date);
    if (time) expect(element.find('.time').val()).toBe(time);
    if (zone) expect(scope.timezones[element.find('.zone').val()]).toBe(zone);
  }

  var localzone = moment().format('Z');

  it('should put the available timezones on the scope', function () {
    expect(_.isArray(scope.timezones)).toBe(true);
  });

  it('should respond in the DOM to changes in tzOffset', function () {
    scope.localDate = '2013-12-24';
    scope.localTime = '05:23';
    scope.tzOffset = '+07:00';
    scope.$apply();
    expectFields(scope.localDate, scope.localTime, scope.tzOffset);
  });

  it('should recognize in the scope changes in the DOM', function () {
    enter('2013-12-24', '5:23', '+03:00');
    expectScope('2013-12-24', '5:23', '+03:00');
  });

  it('should preserve timezones during parsing', function () {
    scope.fieldData.value = '2013-12-24T05:23:00+03:00';
    scope.$apply();
    expectScope('2013-12-24', '05:23', '+03:00');
  });

  it('should preserve entered timezones in the iso string', function () {
    enter('2013-12-24', '5:23', '+03:00');
    expect(scope.fieldData.value).toBe('2013-12-24T05:23:00+03:00');
  });

  it('should not parse from invalid ISOs', function () {
    scope.setFromISO('Invalid Date');
    scope.$apply();
    expect(scope.localDate).toBe(null);
    expect(scope.localTime).toBe(null);
  });

  it('should assume local time when no timezone given in ISO', function () {
    var iso = '2013-12-24T05:23:00';
    var autozone = moment(iso).format('Z');
    scope.setFromISO(iso);
    scope.$apply();
    expectScope('2013-12-24', '05:23', autozone);
  });

  it('should accepts different inputs', function () {
    // No time
    enter('2013-12-24');
    expect(scope.fieldData.value).toBe('2013-12-24T00:00:00'+localzone);
    // Time formats
    enter('2013-12-24', '1:23');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:00'+localzone);
    enter('2013-12-24', '01:23');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:00'+localzone);
    enter('2013-12-24', '1:23:45');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45'+localzone);
    enter('2013-12-24', '01:23:45');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45'+localzone);
    enter('2013-12-24', '   01:23:45   ');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45'+localzone);
    // Timezones
    enter('2013-12-24', '01:23', '+05:00');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:00+05:00');
    enter('2013-12-24', '01:23', '-03:00');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:00-03:00');
  });

  it('should assume null for invalid dates', function () {
    enter('', '13:00', '+03:00');
    expect(scope.fieldData.value).toBe(null);
    enter('201', '13:00', '+03:00');
    expect(scope.fieldData.value).toBe(null);
    enter('2013', '13:00', '+03:00');
    expect(scope.fieldData.value).toBe(null);
    enter('2013-11-11', '13:00', '+03:00');
    expect(scope.fieldData.value).toBe('2013-11-11T13:00:00+03:00');
  });

  it('should return null for Invalid Date strings', function () {
    var dateController = element.find('.date').controller('ngModel');
    dateController.$setViewValue('');
    scope.$apply();
    expect(scope.fieldData.value).toBe(null);
    expect(scope.fieldData.value).not.toBe('Invalid Date');
  });

  it('should assume null for invalid times', function () {
    enter('2013-12-24', 'c1:23');
    expect(scope.fieldData.value).toBe('2013-12-24T00:00:00'+localzone);
    enter('2013-12-24', '13', '-03:30');
    expect(scope.fieldData.value).toBe('2013-12-24T00:00:00-03:30');
    enter('2013-12-24', '-21:23', '+08:00');
    expect(scope.fieldData.value).toBe('2013-12-24T00:00:00+08:00');
  });

  it('should warn about missing dates', function () {
    enter(null, '3:00');
    expect(scope.dateInvalid).toBe(true);
  });

  it('should warn about malformed time', function () {
    enter('2011-01-01', '3:0');
    expect(scope.timeInvalid).toBe(true);
  });

  //it('should warn about malformed times')
});
