describe('cfSingleLineEditor directive', () => {
  let clock;

  beforeEach(function() {
    module('contentful/test');

    clock = sinon.useFakeTimers();

    this.widgetApi = this.$inject('mocks/widgetApi').create({
      settings: {
        helpText: 'wat'
      }
    });

    this.fieldApi = this.widgetApi.field;
    this.setValue = this.widgetApi.field.setValue;

    this.compileElement = function(validations, fieldType) {
      this.widgetApi.field.validations = validations;
      this.widgetApi.field.type = fieldType;

      return this.$compile(
        '<cf-single-line-editor>',
        {},
        {
          cfWidgetApi: this.widgetApi
        }
      );
    };

    this.dispatchValue = function(value) {
      this.widgetApi.field.onValueChanged.yield(value);
      this.$apply();
    };
  });

  function* waitRaf() {
    clock.restore();
    yield new Promise(resolve => {
      window.requestAnimationFrame(resolve);
    });
    clock = sinon.useFakeTimers();
  }

  afterEach(function() {
    clock.restore();
  });

  it('updates input value when document value is changed', function*() {
    const $el = this.compileElement();

    this.dispatchValue('test');
    yield waitRaf();
    expect($el.find('input').val()).toEqual('test');
  });

  it('input event on text field updates document value after some time', function*() {
    const $el = this.compileElement();

    const input = $el.find('input').get(0);
    input.value = 'NEW';
    input.dispatchEvent(new Event('input'));
    clock.tick(300);
    sinon.assert.calledOnce(this.setValue);
    sinon.assert.calledWithExactly(this.setValue, 'NEW');
  });

  it('counts characters correctly', function*() {
    const testData = [
      { input: 'Test', expected: '4 characters' },
      { input: 'A  sentence with lots of  spaces', expected: '32 characters' },
      { input: '', expected: '0 characters' },
      { input: undefined, expected: '0 characters' }
    ];

    const $el = this.compileElement();
    clock.restore();

    /* eslint prefer-const: off */
    for (let { input, expected } of testData) {
      this.dispatchValue(input);
      yield waitRaf();
      expect($el.text()).toBe(expected);
    }
  });

  it('displays validation hints', function() {
    const testData = [
      {
        validations: [{ size: { max: 20, min: 10 } }],
        hint: 'Requires between 10 and 20 characters'
      },
      {
        validations: [{ size: { max: null, min: 10 } }],
        hint: 'Requires at least 10 characters'
      },
      {
        validations: [{ size: { max: 20, min: null } }],
        hint: 'Requires less than 20 characters'
      }
    ];
    testData.forEach(function(data) {
      const $el = this.compileElement(data.validations);

      this.dispatchValue('');
      expect($el.text()).toMatch(data.hint);
    }, this);
  });

  it('changes character info status code according to validation', function*() {
    const el = this.compileElement([{ size: { min: 2, max: 3 } }]);

    this.dispatchValue('1');
    yield waitRaf();
    expect(el.find('[role="status"][data-status-code="invalid-size"]').length).toBe(1);

    this.dispatchValue('12');
    yield waitRaf();
    expect(el.find('[role="status"][data-status-code="invalid-size"]').length).toBe(0);

    this.dispatchValue('1234');
    yield waitRaf();
    expect(el.find('[role="status"][data-status-code="invalid-size"]').length).toBe(1);
  });

  it('adds max constraints for symbol fields', function() {
    const elem = this.compileElement(false, 'Symbol');

    this.dispatchValue('');
    expect(elem.text()).toMatch('Requires less than 256 characters');
  });

  it('adds max constraints to symbol fields with min validation', function() {
    const elem = this.compileElement([{ size: { min: 20, max: null } }], 'Symbol');

    this.dispatchValue('');
    expect(elem.text()).toMatch('Requires between 20 and 256 characters');
  });

  it('does not overwrite constraints for symbol fields', function() {
    const elem = this.compileElement([{ size: { min: null, max: 50 } }], 'Symbol');

    this.dispatchValue('');
    expect(elem.text()).toMatch('Requires less than 50 characters');
  });

  it('sets input to invalid when there are schema errors', function*() {
    const input = this.compileElement().find('input');

    this.widgetApi.fieldProperties.schemaErrors$.set(true);
    yield waitRaf();
    expect(input.attr('aria-invalid')).toBe(undefined);
    this.widgetApi.fieldProperties.schemaErrors$.set([{}]);
    yield waitRaf();
    expect(input.attr('aria-invalid')).toBe('true');
  });
});
