import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('connectToWidgetAPI', () => {
  beforeEach(async function() {
    module('contentful/test');
    this.system = createIsolatedSystem();
    this.system.set('entitySelector', {});
    this.system.set('modalDialog', { open: sinon.stub() });
    this.system.set('navigation/SlideInNavigator', {
      goToSlideInEntity: sinon.stub()
    });
    this.system.set('spaceContext', {
      cma: {
        getEntry: sinon.stub().resolves()
      }
    });
    this.system.set('$rootScope', {
      default: {
        $on: sinon.stub()
      }
    });
    this.system.set('$location', {
      default: {
        absUrl: () => 'abs-url'
      }
    });
    this.widgetApi = this.$inject('mocks/widgetApi').create();

    this.props = {
      field: this.widgetApi.field
    };
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    const { default: connectToWidgetAPI } = await this.system.import('app/widgets/WidgetApi');

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
