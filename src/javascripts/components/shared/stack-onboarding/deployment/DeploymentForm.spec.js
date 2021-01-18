import React from 'react';
import _ from 'lodash';
import * as K from '__mocks__/kefirMock';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as TokenStore from 'services/TokenStore';

import DeploymentForm from './DeploymentForm';

jest.mock('services/TokenStore');

const type = (wrapper, text) => {
  userEvent.type(wrapper.queryByTestId('cfnext-form__input'), text);
};

describe('in DeploymentForm', () => {
  beforeEach(async function () {
    TokenStore.user$ = K.createMockProperty({ sys: { id: 1 } });
  });

  it('button is disabled by default', () => {
    const wrapper = render(<DeploymentForm onComplete={jest.fn()} />);

    const button = wrapper.queryByTestId('onboarding-view-next-steps-cta');
    expect(button).toBeDisabled();
  });

  it('we see error message in case we enter incorrect url', async () => {
    const wrapper = render(<DeploymentForm onComplete={jest.fn()} />);
    type(wrapper, 'aaa');

    await waitFor(() =>
      expect(wrapper.queryByTestId('cfnext-form__field-error')?.innerHTML).toBe(
        'Please provide the Netlify or Heroku URL of your deployed application.'
      )
    );
  });

  it('button is enabled if url is correct', () => {
    const wrapper = render(<DeploymentForm onComplete={jest.fn()} />);
    type(wrapper, 'some.netlify.com');
    const button = wrapper.queryByTestId('onboarding-view-next-steps-cta');

    expect(button).not.toBeDisabled();
  });

  it('button is not clickable without correct url', () => {
    const onComplete = jest.fn();
    const wrapper = render(<DeploymentForm onComplete={onComplete} />);

    wrapper.queryByTestId('onboarding-view-next-steps-cta').click();

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('button calls onComplete if URL is correct', () => {
    const onComplete = jest.fn();
    const wrapper = render(<DeploymentForm onComplete={onComplete} />);
    type(wrapper, 'correct-url.herokuapp.com');

    wrapper.queryByTestId('onboarding-view-next-steps-cta').click();

    expect(onComplete).toHaveBeenCalled();
  });
});
