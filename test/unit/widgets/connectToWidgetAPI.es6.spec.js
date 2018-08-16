import React from 'react';
import { mount } from 'enzyme';

import * as sinon from 'helpers/sinon';
import { createIsolatedSystem } from 'test/helpers/system-js';

describe('connectToWidgetAPI', () => {
  beforeEach(async function () {
    module('contentful/test');
    this.system = createIsolatedSystem();
    this.system.set('entitySelector', {});
    this.system.set('states/EntityNavigationHelpers', {
      goToSlideInEntity: sinon.stub()
    });
    this.system.set('spaceContext', {
      cma: {
        getEntry: sinon.stub().resolves()
      }
    });

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.props = {
      field: this.widgetApi.field
    };
    const { default: connectToWidgetAPI } = await this.system.import(
      'app/widgets/connectToWidgetAPI'
    );

    this.Component = sinon.spy(() => null);
    const WithWidgetAPI = connectToWidgetAPI(this.Component);

    mount(<WithWidgetAPI {...this.props} />);
  });

  it('updates the rendered component prop.value when field value changes', function () {
    const newValue = 'hello world';
    this.props.field.setValue(newValue);
    expect(this.Component.lastCall.args[0].value).toEqual(newValue);
  });

  it('updates the rendered component prop.isDisabled when field disabled state changes', function () {
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    expect(this.Component.lastCall.args[0].isDisabled).toEqual(true);
  });
});
