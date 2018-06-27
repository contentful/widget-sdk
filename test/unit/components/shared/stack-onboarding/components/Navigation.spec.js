import React from 'react';
import _ from 'lodash';
import sinon from 'npm:sinon';
import * as K from 'helpers/mocks/kefir';

import { mount } from 'enzyme';

describe('Navigation', () => {
  let Navigation, goStub;

  beforeEach(function () {
    goStub = sinon.spy();
    module('contentful/test', $provide => {
      $provide.value('$state', {
        go: goStub
      });
      $provide.value('createModernOnboarding', {
        track: () => {},
        getStoragePrefix: sinon.stub().returns('prefix'),
        isOnboardingComplete: sinon.stub().returns(false)
      });
      $provide.value('services/TokenStore', {
        user$: K.createMockProperty({sys: {id: 1}})
      });
    });

    Navigation = this.$inject('stack-onboarding-navigation');
  });

  afterEach(function () {
    Navigation = goStub = null;
  });

  it('should have two active circles if active is 2', () => {
    const wrapper = mount(<Navigation active={2} />);

    const activeElements = wrapper.find('.modern-stack-onboarding--navigation-circle__active');
    expect(activeElements.length).toEqual(2);
  });


  it('should call $state.go after clicking on the link', () => {
    const wrapper = mount(<Navigation active={2} />);
    wrapper.find('.modern-stack-onboarding--navigation-circle__active').first().simulate('click');

    expect(goStub.calledOnce).toBe(true);
  });

  it('should not call $state.go after click on the next step', () => {
    const wrapper = mount(<Navigation active={2} />);
    wrapper.find('.modern-stack-onboarding--navigation-circle').last().simulate('click');
    expect(goStub.notCalled).toBe(true);
  });
});
