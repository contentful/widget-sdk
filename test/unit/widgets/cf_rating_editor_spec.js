'use strict';

describe('cfRatingEditor directive', () => {
  beforeEach(function() {
    module('cf.app', $provide => {
      // Disable cfIcon directive
      $provide.value('cfIconDirective', {});
    });
    module('contentful/test');

    this.widgetApi = this.$inject('mocks/widgetApi').create({
      settings: {
        stars: 5
      }
    });
    this.fieldApi = this.widgetApi.field;

    this.compile = function() {
      return this.$compile(
        '<cf-rating-editor />',
        {},
        {
          cfWidgetApi: this.widgetApi
        }
      );
    };
  });

  it('renders a number of stars according to the widget setting', function() {
    this.widgetApi.settings.stars = 1;
    let el = this.compile();
    let stars = el.find('cf-icon[name="star"]');
    expect(stars.length).toEqual(1);

    this.widgetApi.settings.stars = 11;
    el = this.compile();
    stars = el.find('cf-icon[name="star"]');
    expect(stars.length).toEqual(11);
  });

  it('activates no stars when value is not set', function() {
    const el = this.compile();
    this.fieldApi.onValueChanged.yield(null);
    this.$apply();
    const active = el.find('[data-active="true"]');
    expect(active.length).toEqual(0);
  });

  it('activates the number of stars that are set', function() {
    const el = this.compile();
    this.fieldApi.onValueChanged.yield(3);
    this.$apply();
    const active = el.find('[data-active="true"]');
    expect(active.length).toEqual(3);
  });

  it('sets rating value according to star clicked', function() {
    this.fieldApi.setValue = sinon.stub();
    const el = this.compile();

    el.find('[role="button"][aria-label="3"]').click();
    this.$apply();
    sinon.assert.calledOnce(this.fieldApi.setValue);
    sinon.assert.calledWithExactly(this.fieldApi.setValue, 3);
  });

  it('does not set rating when field is disabled', function() {
    this.fieldApi.setValue = sinon.stub();
    const el = this.compile();
    this.$apply();
    this.widgetApi.fieldProperties.isDisabled$.set(true);

    el.find('[role="button"][aria-label="3"]').click();
    this.$apply();
    sinon.assert.notCalled(this.fieldApi.setValue);
  });

  it('removes value when "clear" button is clicked', function() {
    this.fieldApi.removeValue = sinon.stub();
    const el = this.compile();

    // Show the button
    this.fieldApi.onValueChanged.yield(3);
    this.$apply();

    el.find('button:contains(Clear)').click();
    sinon.assert.calledOnce(this.fieldApi.removeValue);
  });
});
