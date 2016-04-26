'use strict';

describe('Datetime Editor', function () {
  beforeEach(function () {
    module('contentful/test');

    this.fieldApi = {
      onValueChanged: sinon.stub().returns(_.noop).yields(null),
      onDisabledStatusChanged: sinon.stub().returns(_.noop),
      removeValue: sinon.stub(),
      setValue: sinon.stub()
    };

    this.compile = function (settings) {
      settings = _.assign({
        format: 'timeZ'
      }, settings);
      return this.$compile('<cf-entry-datetime-editor>', {}, {
        cfWidgetApi: {field: this.fieldApi, settings: settings}
      });
    };
  });

  describe('rendering', function () {
    it('leaves date and time field empty without value', function () {
      var el = this.compile();
      expect(getInputValue(el, 'datetime.date')).toEqual('');

      this.fieldApi.onValueChanged.yield(null);
      this.$apply();
      expect(getInputValue(el, 'datetime.date')).toEqual('');
      expect(getInputValue(el, 'datetime.time')).toEqual('');
    });

    it('selects AM without value', function () {
      var el = this.compile({format: 'time', ampm: '12'});

      this.fieldApi.onValueChanged.yield(null);
      this.$apply();
      expect(getInputValue(el, 'datetime.ampm')).toEqual('AM');
    });

    it('selects local timezone without value', function () {
      var moment = this.$inject('moment');
      var currentOffset = moment().format('Z');
      var el = this.compile({format: 'timeZ'});
      this.fieldApi.onValueChanged.yield(null);
      this.$apply();
      expect(getInputValue(el, 'datetime.timezone')).toEqual('string:' + currentOffset);
    });

    it('displays date', function () {
      var el = this.compile({format: 'dateonly'});
      expect(getInputValue(el, 'datetime.date')).toEqual('');

      this.fieldApi.onValueChanged.yield('2000-01-01T12:00');
      this.$apply();
      expect(getInputValue(el, 'datetime.date'))
      .toEqual('Saturday, January 1st 2000');
    });

    it('displays 24h time', function () {
      var el = this.compile();
      expect(getInputValue(el, 'datetime.time')).toEqual('');

      this.fieldApi.onValueChanged.yield('2000-01-01T12:34');
      this.$apply();
      expect(getInputValue(el, 'datetime.time')).toEqual('12:34');
    });

    it('displays 12h time', function () {
      var el = this.compile({ampm: '12'});
      expect(getInputValue(el, 'datetime.time')).toEqual('');

      this.fieldApi.onValueChanged.yield('2000-01-01T15:00');
      this.$apply();
      expect(getInputValue(el, 'datetime.time')).toEqual('03:00');
      expect(getInputValue(el, 'datetime.ampm')).toEqual('PM');
    });

    it('displays timezone time', function () {
      var el = this.compile();
      this.fieldApi.onValueChanged.yield('2000-01-01T15:00+0500');
      this.$apply();
      expect(getInputValue(el, 'datetime.timezone')).toEqual('string:+05:00');
      expect(getInputValue(el, 'datetime.time')).toEqual('15:00');

      this.fieldApi.onValueChanged.yield('2000-01-01T15:00Z');
      this.$apply();
      expect(getInputValue(el, 'datetime.timezone')).toEqual('string:+00:00');
      expect(getInputValue(el, 'datetime.time')).toEqual('15:00');
    });
  });

  describe('date input', function () {
    beforeEach(function () {
      this.el = this.compile({format: 'dateonly'});
    });

    it('updates value with "dateonly" format', function () {
      setInputValue(this.el, 'datetime.date', '2001-01-02');
      this.$apply();
      sinon.assert.calledWith(this.fieldApi.setValue, '2001-01-02');
    });

    it('updates value with "timeZ" format', function () {
      var el = this.compile({format: 'timeZ'});
      this.fieldApi.onValueChanged.yield('2001-01-01T12:00+00:00');
      this.$apply();
      setInputValue(el, 'datetime.date', '2001-01-02');
      this.$apply();
      sinon.assert.calledWith(this.fieldApi.setValue, '2001-01-02T12:00+00:00');
    });

    it('updates parses and format input', function () {
      setInputValue(this.el, 'datetime.date', '02.03.2015');
      this.$apply();
      expect(getInputValue(this.el, 'datetime.date'))
      .toEqual('Monday, March 2nd 2015');
      sinon.assert.calledWith(this.fieldApi.setValue, '2015-03-02');
    });

    it('does not update when value can not be parsed', function () {
      setInputValue(this.el, 'datetime.date', 'say what');
      this.$apply();
      expect(getInputValue(this.el, 'datetime.date')).toEqual('say what');
      sinon.assert.notCalled(this.fieldApi.setValue);
    });

    it('shows error when value cannot be barsed', function () {
      expect(hasStatus(this.el, 'datetime.date-parse-error')).toBe(false);
      setInputValue(this.el, 'datetime.date', 'say what');
      this.$apply();
      expect(hasStatus(this.el, 'datetime.date-parse-error')).toBe(true);
    });

    it('removes field value when emptied', function () {
      this.fieldApi.onValueChanged.yield('2000-01-01T15:00Z');
      this.$apply();
      expect(getInputValue(this.el, 'datetime.time')).not.toEqual('');

      this.fieldApi.removeValue.reset();
      setInputValue(this.el, 'datetime.date', '');
      this.$apply();

      expect(getInputValue(this.el, 'datetime.time')).toEqual('');
      sinon.assert.called(this.fieldApi.removeValue);
    });
  });

  describe('time input', function () {
    beforeEach(function () {
      this.fieldApi.onValueChanged.yields('2000-01-01T09:00');
      this.el = this.compile({format: 'time'});
    });

    it('updates value', function () {
      setInputValue(this.el, 'datetime.time', '13:00');
      this.$apply();
      sinon.assert.calledWith(this.fieldApi.setValue, '2000-01-01T13:00');
    });

    it('sets value to 00:00 if input is invalid', function () {
      setInputValue(this.el, 'datetime.time', '13:');
      this.$apply();
      sinon.assert.calledWith(this.fieldApi.setValue, '2000-01-01T00:00');
    });

    it('shows error when value cannot be parsed', function () {
      expect(hasStatus(this.el, 'datetime.time-parse-error')).toBe(false);
      setInputValue(this.el, 'datetime.time', 'say what');
      this.$apply();
      expect(hasStatus(this.el, 'datetime.time-parse-error')).toBe(true);
    });

    describe('with 12h clock', function () {
      beforeEach(function () {
        this.fieldApi.onValueChanged.yields('2000-01-01T09:00');
        this.el = this.compile({format: 'time', ampm: '12'});
      });

      it('converts to PM time', function () {
        setInputValue(this.el, 'datetime.time', '1:00');
        setInputValue(this.el, 'datetime.ampm', 'PM');
        this.$apply();
        sinon.assert.calledWith(this.fieldApi.setValue, '2000-01-01T13:00');
      });

      it('rejects inputs larger then 12:59', function () {
        expect(hasStatus(this.el, 'datetime.time-parse-error')).toBe(false);
        setInputValue(this.el, 'datetime.time', '13:00');
        this.$apply();
        expect(hasStatus(this.el, 'datetime.time-parse-error')).toBe(true);
      });

      it('rejects inputs smaller then 01:00', function () {
        expect(hasStatus(this.el, 'datetime.time-parse-error')).toBe(false);
        setInputValue(this.el, 'datetime.time', '00:59');
        this.$apply();
        expect(hasStatus(this.el, 'datetime.time-parse-error')).toBe(true);
      });
    });
  });

  describe('timezone input', function () {
    it('updates the field value', function () {
      this.fieldApi.onValueChanged.yields('2000-01-01T00:00Z');
      var el = this.compile();
      setInputValue(el, 'datetime.timezone', 'string:+10:00');
      this.$apply();
      sinon.assert.calledWith(this.fieldApi.setValue, '2000-01-01T00:00+10:00');
    });
  });

  function getInputValue (container, name) {
    return findOne(container,
      'input[name="' + name + '"],' +
      'select[name="' + name + '"]'
    ).val();
  }

  function setInputValue (container, name, value) {
    return findOne(container,
      'input[name="' + name + '"],' +
      'select[name="' + name + '"]'
    ).val(value).trigger('change');
  }

  function findOne ($container, selector) {
    var $el = $container.find(selector);

    if ($el.length === 0) {
      throw new Error('Cannot find element for selector: ' + selector);
    }

    if ($el.length > 1) {
      throw new Error('Found multiple elements for selector: ' + selector);
    }

    return $el;
  }

  function hasStatus ($container, statusCode) {
    var selector =
      '[role=status]' +
      '[data-status-code="' + statusCode + '"]';

    var $el = $container.find(selector);

    if ($el.length > 1) {
      throw new Error('Found multiple elements for selector: ' + selector);
    }

    return $el.length === 1;
  }
});
