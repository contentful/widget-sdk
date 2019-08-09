import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import OptIn from './OptIn.es6';
import 'jest-dom/extend-expect';
import { STEPS } from './Utils.es6';

const setStep = jest.fn();

jest.mock('moment', () => ({
  __esModule: true,
  default: () => ({ fromNow: () => 'a few seconds ago' })
}));

const getComponent = (props = {}) => {
  return <OptIn setStep={setStep} spaceId="123456" {...props}></OptIn>;
};

describe('OptIn', () => {
  afterEach(cleanup);

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
    fireEvent.change(getByTestId('input'), { target: { value: 'new environmentid' } });
    btn.click();
    await wait(() => expect(setStep).toHaveBeenCalledWith(STEPS.THIRD_CHANGE_ENV));
  });
});
