import React from 'react';
import _ from 'lodash';
import sinon from 'sinon';
import * as K from 'test/utils/kefir';
import { $initialize } from 'test/utils/ng';

import { mount } from 'enzyme';

describe('in DeploymentForm', () => {
  let DeploymentForm;

  beforeEach(async function () {
    this.system.set('services/TokenStore', {
      user$: K.createMockProperty({ sys: { id: 1 } }),
    });

    DeploymentForm = (
      await this.system.import('components/shared/stack-onboarding/deployment/DeploymentForm')
    ).default;

    await $initialize(this.system);
  });

  afterEach(function () {
    DeploymentForm = null;
  });

  it('button is disabled by default', () => {
    const wrapper = mount(<DeploymentForm />);

    const button = wrapper.find('button[type="submit"]');
    expect(button.getDOMNode().disabled).toEqual(true);
  });

  it('we see error message in case we enter incorrect url', () => {
    const wrapper = mount(<DeploymentForm />);
    const ourError = 'Please provide netify or heroku';
    wrapper.setState({
      url: 'aaa',
      error: ourError,
    });

    expect(wrapper.find('.cfnext-form__field-error').text()).toBe(ourError);
  });

  it('button is enabled if url is correct', () => {
    const wrapper = mount(<DeploymentForm />);
    wrapper.setState({
      url: 'some.netlify.com',
      error: null,
    });

    const button = wrapper.find('button[type="submit"]');

    expect(button.length).toBe(1);
    expect(button.getDOMNode().disabled).toBe(false);
  });

  it('button is not clickable without correct url', () => {
    const onComplete = sinon.spy();
    const wrapper = mount(<DeploymentForm onComplete={onComplete} />);

    wrapper.find('button[type="submit"]').simulate('click');

    expect(onComplete.notCalled).toBe(true);
  });

  it('button calls onComplete if URL is correct', () => {
    const onComplete = sinon.spy();
    const wrapper = mount(<DeploymentForm onComplete={onComplete} />);

    wrapper.setState({
      url: 'correct-url.herokuapp.com',
    });

    wrapper.find('button[type="submit"]').simulate('click');

    expect(onComplete.calledOnce).toBe(true);
  });
});
