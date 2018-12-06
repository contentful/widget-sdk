'use strict';

import _ from 'lodash';
import $ from 'jquery';

describe('DateTime Editor', () => {
  let moment;
  let element, scope;

  beforeEach(module('contentful/test'));

  beforeEach(inject(($compile, $rootScope, _moment_) => {
    moment = _moment_;
    scope = $rootScope;
    scope.widget = {
      settings: {
        format: 'timeZ',
        ampm: '24'
      }
    };
    scope.fieldData = { value: null };
    element = $compile('<div cf-datetime-editor ng-model="fieldData.value"></div>')(scope);
    scope.$apply();
  }));

  afterEach(() => {
    scope.$destroy();
    element = scope = moment = null;
  });

  function enter(date, time, zone, ampm) {
    /* jshint eqnull:true */
    if (date != null) {
      element
        .find('.date')
        .val(date)
        .trigger('input')
        .trigger('change')
        .trigger('blur');
    }
    if (time != null) {
      element
        .find('.time')
        .val(time)
        .trigger('input')
        .trigger('change');
    }
    if (ampm != null) {
      element
        .find('.ampm')
        .val(ampm)
        .trigger('change');
    }
    if (zone != null) {
      selectValue(element.find('.zone'), 'UTC' + zone);
    }
  }

  function selectValue($select, label) {
    const option = $select.find('option').filter(function() {
      return $(this).text() === label;
    });
    const value = option.attr('value');
    $select.val(value).trigger('change');
  }

  function expectScope(date, time, zone, ampm) {
    if (date) expect(scope.localDate).toBe(date);
    if (time) expect(scope.localTime).toBe(time);
    if (zone) expect(scope.tzOffset).toBe(zone);
    if (ampm) expect(scope.ampm).toBe(ampm);
  }

  function expectFields(date, time, zone, ampm) {
    if (date) expect(element.find('.date').val()).toBe(date);
    if (time) expect(element.find('.time').val()).toBe(time);
    if (zone) {
      const selected = element
        .find('.zone')
        .val()
        .substr('string:'.length);
      expect(selected).toBe(zone);
    }
    if (ampm) expect(element.find('.ampm').val()).toBe(ampm);
  }

  it('should put the available timezones on the scope', () => {
    expect(_.isArray(scope.timezones)).toBe(true);
  });

  it('should respond in the DOM to changes in tzOffset', () => {
    scope.localDate = '2013-12-24';
    scope.localTime = '05:23';
    scope.tzOffset = '+07:00';
    scope.$apply();
    expectFields(scope.localDate, scope.localTime, scope.tzOffset);
  });

  it('should recognize in the scope changes in the DOM', () => {
    enter('2013-12-24', '5:23', '+03:00');
    expectScope('2013-12-24', '05:23', '+03:00');
  });

  it('should preserve timezones during parsing', () => {
    scope.fieldData.value = '2013-12-24T05:23:00+03:00';
    scope.$apply();
    expectScope('2013-12-24', '05:23:00', '+03:00');
  });

  it('should preserve entered timezones in the iso string', () => {
    enter('2013-12-24', '5:23', '+03:00');
    expect(scope.fieldData.value).toBe('2013-12-24T05:23+03:00');
  });

  it('should parse only dates', () => {
    scope.setFromISO('2012-12-12');
    expectScope('2012-12-12');
  });

  it('should parse seconds and milliseconds', () => {
    scope.setFromISO('2012-12-12T12:34:56');
    expectScope('2012-12-12', '12:34:56');
    scope.setFromISO('2012-12-12T12:34:56.789');
    expectScope('2012-12-12', '12:34:56.789');
  });

  it('should not parse from invalid ISOs', () => {
    // Moment shows a deprectaion warning when parsing an invalid date.
    // See https://github.com/moment/moment/issues/1407 for more info
    // TODO we can remove this when we upgrade to moment@^3.0
    moment.suppressDeprecationWarnings = true;
    scope.setFromISO('Invalid Date');
    moment.suppressDeprecationWarnings = false;
    scope.$apply();
    expect(scope.localDate).toBe(null);
    expect(scope.localTime).toBe(undefined);
  });

  it('should assume local time when no timezone given in ISO', () => {
    const iso = '2013-12-24T05:23:00';
    scope.setFromISO(iso);
    scope.$apply();
    expectScope('2013-12-24', '05:23:00', null);
  });

  it('should accepts different inputs', () => {
    const localZone = moment().format('Z');
    // No time
    enter('2013-12-24');
    expect(scope.fieldData.value).toBe('2013-12-24');
    // Time formats
    enter('2013-12-24', '1:23');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23' + localZone);
    enter('2013-12-24', '01:23', '');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23');
    enter('2013-12-24', '1:23:45');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45');
    enter('2013-12-24', '01:23:45');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45');
    enter('2013-12-24', '   01:23:45   ');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45');
    // Milliseconds
    enter('2013-12-24', '1:23:45.678');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45.678');
    enter('2013-12-24', '01:23:45.678');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45.678');
    enter('2013-12-24', '01:23:45.678', '+04:00');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23:45.678+04:00');
    // Timezones
    enter('2013-12-24', '01:23', '+05:00');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23+05:00');
    enter('2013-12-24', '01:23', '-03:00');
    expect(scope.fieldData.value).toBe('2013-12-24T01:23-03:00');
  });

  it('sets field value to undefined if date is invalid', () => {
    enter('', '13:00', '+03:00');
    expect(scope.fieldData.value).toBeUndefined();
    enter('201', '13:00', '+03:00');
    expect(scope.fieldData.value).toBeUndefined();
    enter('2013', '13:00', '+03:00');
    expect(scope.fieldData.value).toBeUndefined();
    enter('2013-11-11', '13:00', '+03:00');
    expect(scope.fieldData.value).toBe('2013-11-11T13:00+03:00');
  });

  it('should return null for Invalid Date strings', () => {
    const dateController = element.find('.date').controller('ngModel');
    dateController.$setViewValue('');
    scope.$apply();
    expect(scope.fieldData.value).toBe(null);
    expect(scope.fieldData.value).not.toBe('Invalid Date');
  });

  it('sets only dates if time is invalid', () => {
    enter('2013-12-24', 'c1:23');
    expect(scope.fieldData.value).toBe('2013-12-24');
    enter('2013-12-24', '13', '-03:30');
    expect(scope.fieldData.value).toBe('2013-12-24');
    enter('2013-12-24', '-21:23', '+08:00');
    expect(scope.fieldData.value).toBe('2013-12-24');

    enter('2013-11-11', '13:0', '+03:00');
    expect(scope.fieldData.value).toBe('2013-11-11');
    enter('2013-11-11', '13:0');
    expect(scope.fieldData.value).toBe('2013-11-11');
    enter('2013-11-11', '13:00:3');
    expect(scope.fieldData.value).toBe('2013-11-11');
    enter('2013-11-11', '13:00:33.12');
    expect(scope.fieldData.value).toBe('2013-11-11');
    enter('2013-11-11', '13:00:33.12');
    expect(scope.fieldData.value).toBe('2013-11-11');
  });

  it('should warn about missing dates', () => {
    enter(null, '3:00');
    expect(scope.dateInvalid).toBe(true);
  });

  it('should warn about malformed time', () => {
    enter('2011-01-01', '3:0');
    expect(scope.timeInvalid).toBe(true);
  });

  describe('AM/PM mode', () => {
    beforeEach(() => {
      scope.widget.settings.ampm = '12';
      scope.widget.settings.format = 'time';
    });

    it('should not allow invalid times', () => {
      enter('2013-11-11', '13:00', null, 'am');
      expect(scope.timeInvalid).toBe(true);
      enter('2013-11-11', '00:00', null, 'am');
      expect(scope.timeInvalid).toBe(true);
    });

    it('should convert outgoing times', () => {
      enter('2013-11-11', '12:00', null, 'am');
      expect(scope.fieldData.value).toBe('2013-11-11T00:00');
      enter('2013-11-11', '12:00', null, 'pm');
      expect(scope.fieldData.value).toBe('2013-11-11T12:00');
      enter('2013-11-11', '2:00', null, 'pm');
      expect(scope.fieldData.value).toBe('2013-11-11T14:00');
    });

    it('should convert incoming times', () => {
      scope.setFromISO('2013-12-24T05:23:00');
      expectScope('2013-12-24', '05:23:00', null, 'am');
      scope.setFromISO('2013-12-24T17:23:00');
      expectScope('2013-12-24', '05:23:00', null, 'pm');
      scope.setFromISO('2013-12-24T00:00');
      expectScope('2013-12-24', '12:00', null, 'am');
      scope.setFromISO('2013-12-24T12:00');
      expectScope('2013-12-24', '12:00', null, 'pm');
    });
  });
});
