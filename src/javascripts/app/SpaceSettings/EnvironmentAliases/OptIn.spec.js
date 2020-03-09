import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import OptIn from './OptIn';

import { STEPS } from './Utils';

const setStep = jest.fn();

jest.mock('moment', () => ({
  __esModule: true,
  default: () => ({ fromNow: () => 'a few seconds ago', format: () => 'formatted' })
}));

const getComponent = (props = {}) => {
  return <OptIn setStep={setStep} spaceId="123456" {...props}></OptIn>;
};

describe('OptIn', () => {
  it('shows the first step and guides you to the second step', () => {
    const component = getComponent({ step: STEPS.FIRST_ALIAS });
    const { getByTestId } = render(component);
    getByTestId('button.to-second-step').click();
    expect(setStep).toHaveBeenCalledWith(STEPS.SECOND_RENAMING);
  });

  it('guides you to the third step', async () => {
    const component = getComponent({ step: STEPS.SECOND_RENAMING });
    const { getByTestId } = render(component);
    const btn = getByTestId('button.to-third-step');
    expect(btn).toBeDisabled();
    fireEvent.change(getByTestId('input'), { target: { value: 'master' } });
    expect(btn).toBeDisabled();
    fireEvent.change(getByTestId('input'), { target: { value: 'new environmentid' } });
    expect(btn).toBeDisabled();
    fireEvent.change(getByTestId('input'), { target: { value: 'newenvironmentid' } });
    btn.click();
    await wait(() => expect(setStep).toHaveBeenLastCalledWith(STEPS.THIRD_CHANGE_ENV));
  });
});
