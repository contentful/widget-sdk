import React from 'react';
import _ from 'lodash';
import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import { $initialize } from 'test/utils/ng';

import { mount } from 'enzyme';

describe('Navigation', () => {
  let Navigation, goStub;

  beforeEach(async function () {
    goStub = sinon.spy();

    this.system.set('components/shared/auto_create_new_space/CreateModernOnboarding', {
      track: () => {},
      getStoragePrefix: sinon.stub().returns('prefix'),
      isOnboardingComplete: sinon.stub().returns(false),
    });

    this.system.set('services/TokenStore', {
      user$: K.createMockProperty({ sys: { id: 1 } }),
    });

    Navigation = (
      await this.system.import('components/shared/stack-onboarding/components/Navigation')
    ).default;

    await $initialize(this.system, ($provide) => {
      $provide.value('$state', {
        go: goStub,
      });
    });
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
