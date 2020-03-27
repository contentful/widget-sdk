import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import UninstallModal from './UninstallModal';

describe('UninstallModal', () => {
  const actionList = [
    { info: 'first thing is does' },
    { info: 'second thing is does negative', negative: true },
    undefined, // should be able to pass undefined and have it filtered out in the component
  ];

  it('should render a list of things it will uninstall in the correct order', () => {
    const { getByTestId, getAllByTestId } = render(
      <UninstallModal isShown actionList={actionList} onConfirm={() => {}} onClose={() => {}} />
    );

    const items = getAllByTestId('action-list-item');
    actionList
      // filtering out undefined values here; the test will rightfully fail if the component doesn't handle this case
      .filter((x) => x)
      .forEach((action, i) => {
        expect(items[i].textContent.trim()).toEqual(action.info);
      });

    expect(getByTestId('action-list').children).toHaveLength(2);
  });

  it('should not pass reasons if none were checked', () => {
    const onConfirm = jest.fn();

    const { getByTestId } = render(
      <UninstallModal isShown actionList={actionList} onConfirm={onConfirm} onClose={() => {}} />
    );

    getByTestId('uninstall-button').click();

    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it('should pass reasons for uninstalling if some were checked', () => {
    const onConfirm = jest.fn();

    const { getByTestId } = render(
      <UninstallModal isShown actionList={actionList} onConfirm={onConfirm} onClose={() => {}} />
    );

    // access the checkboxes and click two
    fireEvent.click(getByTestId('reason-0').children[0]);
    fireEvent.click(getByTestId('reason-2').children[0]);

    getByTestId('uninstall-button').click();

    expect(onConfirm).toHaveBeenCalledWith([
      'Does not do what I expected',
      'App is not performing well',
    ]);
  });

  it('should pass reasons and a custom reason if filled in', () => {
    const onConfirm = jest.fn();

    const { getByTestId } = render(
      <UninstallModal isShown actionList={actionList} onConfirm={onConfirm} onClose={() => {}} />
    );

    const customReasonText = 'some custom reason';

    // access the checkboxes and click two
    fireEvent.click(getByTestId('reason-0').children[0]);
    fireEvent.click(getByTestId('reason-5').children[0]);
    fireEvent.change(getByTestId('reason-custom'), { target: { value: customReasonText } });

    getByTestId('uninstall-button').click();

    expect(onConfirm).toHaveBeenCalledWith([
      'Does not do what I expected',
      { custom: customReasonText },
    ]);
  });

  it('should allow for deselecting reasons', () => {
    const onConfirm = jest.fn();

    const { getByTestId } = render(
      <UninstallModal isShown actionList={actionList} onConfirm={onConfirm} onClose={() => {}} />
    );

    // check the checkbox, then uncheck it
    fireEvent.click(getByTestId('reason-0').children[0]);
    fireEvent.click(getByTestId('reason-0').children[0]);

    // check another reason
    fireEvent.click(getByTestId('reason-1').children[0]);

    getByTestId('uninstall-button').click();

    expect(onConfirm).toHaveBeenCalledWith(['Not needed anymore']);
  });

  it('should call the onClose method when canceling', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    const { getByTestId } = render(
      <UninstallModal isShown actionList={actionList} onConfirm={onConfirm} onClose={onClose} />
    );

    getByTestId('cancel-button').click();

    expect(onConfirm).toHaveBeenCalledTimes(0);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
