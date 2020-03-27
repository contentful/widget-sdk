import sinon from 'sinon';

import React from 'react';
import { mount } from 'enzyme';

import { $initialize, $inject } from 'test/utils/ng';

xdescribe('connectToWidgetAPI', () => {
  beforeEach(async function () {
    this.system.set('search/EntitySelector/Config', {});
    this.system.set('navigation/SlideInNavigator', {
      goToSlideInEntity: () => {},
    });
    this.system.set('utils/LazyLoader', {
      get: sinon.stub().resolves({}),
    });
    this.system.set('app/widgets/WidgetApi/BatchingApiClient', {
      getBatchingApiClient: (v) => v,
    });
    this.system.set('directives/thumbnailHelpers', {});

    const { default: connectToWidgetAPI } = await this.system.import(
      'app/widgets/WidgetApi/connectToWidgetApi'
    );

    await $initialize(this.system);

    this.widgetApi = $inject('mocks/widgetApi').create();
    this.widgetApi.fieldProperties.isDisabled$.set(true);

    this.props = {
      widgetApi: this.widgetApi,
    };

    this.Component = sinon.spy(() => null);

    this.mount = (options) => {
      const WithWidgetAPI = connectToWidgetAPI(this.Component, options);
      mount(<WithWidgetAPI {...this.props} />);
    };
  });

  it('updates the rendered component prop.value when field value changes', function () {
    this.mount();
    const newValue = 'hello world';
    this.widgetApi.fieldProperties.value$.set(newValue);
    expect(this.Component.lastCall.args[0].value).toEqual(newValue);
  });

  describe('change incoming via field.onValueChanged() on enabled field', function () {
    const VALUE_1 = 'hello world 1';
    const VALUE_2 = 'hello world 2';

    function setup(widgetApi) {
      widgetApi.fieldProperties.value$.set(VALUE_1);
      widgetApi.fieldProperties.isDisabled$.set(false);
      widgetApi.fieldProperties.value$.set(VALUE_2);
    }

    it('is not ignored', function () {
      this.mount();
      setup(this.widgetApi);
      expect(this.Component.lastCall.args[0].value).toEqual(VALUE_2);
    });

    it('is ignored with updateValueWhileEnabled = true', function () {
      this.mount({ updateValueWhileEnabled: false });
      setup(this.widgetApi);
      expect(this.Component.lastCall.args[0].value).toEqual(VALUE_1);
    });
  });

  it('updates the rendered component prop.isDisabled when field disabled state changes', function () {
    this.mount();
    expect(this.Component.lastCall.args[0].isDisabled).toEqual(true);
  });
});
