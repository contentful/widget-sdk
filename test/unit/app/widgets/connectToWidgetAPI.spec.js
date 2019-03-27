import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'test/helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('connectToWidgetAPI', () => {
  beforeEach(async function() {
    module('contentful/test');
    this.system = createIsolatedSystem();
    this.system.set('search/EntitySelector/Config.es6', {});
    this.system.set('app/widgets/WidgetApi/BatchingApiClient/index.es6', {
      getBatchingApiClient: v => v
    });

    const getModuleStub = sinon.stub();
    getModuleStub
      .withArgs('spaceContext')
      .returns({
        cma: {}
      })
      .withArgs('$rootScope')
      .returns({
        $on: sinon.stub()
      })
      .withArgs('$location')
      .returns({
        absUrl: () => 'abs-url'
      })
      .withArgs('access_control/AccessChecker')
      .returns({
        getSectionVisibility: () => ({
          entry: true,
          asset: true
        })
      });

    this.system.set('NgRegistry.es6', {
      getModule: getModuleStub
    });

    this.widgetApi = this.$inject('mocks/widgetApi').create();

    this.props = {
      widgetApi: this.widgetApi
    };
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    const { default: connectToWidgetAPI } = await this.system.import(
      'app/widgets/WidgetApi/index.es6'
    );

    this.Component = sinon.spy(() => null);

    this.mount = options => {
      const WithWidgetAPI = connectToWidgetAPI(this.Component, options);
      mount(<WithWidgetAPI {...this.props} />);
    };
  });

  it('updates the rendered component prop.value when field value changes', function() {
    this.mount();
    const newValue = 'hello world';
    this.widgetApi.fieldProperties.value$.set(newValue);
    expect(this.Component.lastCall.args[0].value).toEqual(newValue);
  });

  describe('change incoming via field.onValueChanged() on enabled field', function() {
    const VALUE_1 = 'hello world 1';
    const VALUE_2 = 'hello world 2';

    function setup(widgetApi) {
      widgetApi.fieldProperties.value$.set(VALUE_1);
      widgetApi.fieldProperties.isDisabled$.set(false);
      widgetApi.fieldProperties.value$.set(VALUE_2);
    }

    it('is not ignored', function() {
      this.mount();
      setup(this.widgetApi);
      expect(this.Component.lastCall.args[0].value).toEqual(VALUE_2);
    });

    it('is ignored with updateValueWhileEnabled = true', function() {
      this.mount({ updateValueWhileEnabled: false });
      setup(this.widgetApi);
      expect(this.Component.lastCall.args[0].value).toEqual(VALUE_1);
    });
  });

  it('updates the rendered component prop.isDisabled when field disabled state changes', function() {
    this.mount();
    expect(this.Component.lastCall.args[0].isDisabled).toEqual(true);
  });
});
