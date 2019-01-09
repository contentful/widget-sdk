import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'test/helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('connectToWidgetAPI', () => {
  beforeEach(async function() {
    module('contentful/test');
    this.system = createIsolatedSystem();
    this.system.set('entitySelector', {});
    this.system.set('search/EntitySelector/Config.es6', {});
    this.system.set('AngularComponent', {});
    this.system.set('modalDialog', { open: sinon.stub() });
    this.system.set('navigation/SlideInNavigator', {
      goToSlideInEntity: sinon.stub()
    });
    this.system = createIsolatedSystem();

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
      });

    this.system.set('NgRegistry.es6', {
      getModule: getModuleStub
    });

    this.widgetApi = this.$inject('mocks/widgetApi').create();

    this.props = {
      field: this.widgetApi.field
    };
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    const { default: connectToWidgetAPI } = await this.system.import(
      'app/widgets/WidgetApi/index.es6'
    );

    this.Component = sinon.spy(() => null);
    const WithWidgetAPI = connectToWidgetAPI(this.Component);

    mount(<WithWidgetAPI {...this.props} />);
  });

  it('updates the rendered component prop.value when field value changes', function() {
    const newValue = 'hello world';
    this.widgetApi.fieldProperties.value$.set(newValue);
    expect(this.Component.lastCall.args[0].value).toEqual(newValue);
  });

  it('ignores incoming changes when isDisabled = false', function() {
    const value1 = 'hello world';
    const value2 = 'hello world!';
    this.widgetApi.fieldProperties.value$.set(value1);
    this.widgetApi.fieldProperties.isDisabled$.set(false);
    this.widgetApi.fieldProperties.value$.set(value2);
    expect(this.Component.lastCall.args[0].value).toEqual(value1);
  });

  it('updates the rendered component prop.isDisabled when field disabled state changes', function() {
    expect(this.Component.lastCall.args[0].isDisabled).toEqual(true);
  });
});
