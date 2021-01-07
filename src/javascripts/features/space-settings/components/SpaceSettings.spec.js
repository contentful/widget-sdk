import React from 'react';
import { screen, render, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';
import { noop } from 'lodash';

import { SpaceSettings } from './SpaceSettings';
import { User } from 'test/helpers/fakeFactory';

jest.mock('account/pricing/PricingDataProvider', () => ({
  isEnterprisePlan: jest.fn(),
}));

const mockUser = User();

describe('SpaceSettings', () => {
  const renderComponent = (props) => {
    return render(
      <SpaceSettings
        spaceName="test-name"
        spaceId="test-id"
        onRemoveClick={noop}
        save={noop}
        onChangeSpace={noop}
        plan={{ name: 'testPlanName', price: 10 }}
        showDeleteButton={false}
        showChangeButton={true}
        createdAt="2020-01-01"
        createdBy={mockUser}
        {...props}
      />
    );
  };

  beforeEach(() => {
    isEnterprisePlan.mockReturnValue(false);
  });

  it('does not display space-plan-card if it is v1 pricing', () => {
    renderComponent({ plan: null });

    expect(screen.queryByTestId('upgrade-space-plan-card')).not.toBeInTheDocument();
  });

  it('displays plan and plan information for v2 pricing', () => {
    renderComponent();

    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      'testPlanName - $10/month'
    );
  });

  it('does not display plan price for v2 enterprise orgs', () => {
    isEnterprisePlan.mockReturnValue(true);
    renderComponent();

    expect(screen.queryByTestId('space-settings-page.plan-price')).toBeNull();
  });

  it('displays plan name for enterprise orgs', () => {
    isEnterprisePlan.mockReturnValue(true);
    renderComponent();

    expect(screen.getByTestId('space-settings-page.plan')).toHaveTextContent('testPlanName');
  });

  it('displays space createdAt and createdBy info', () => {
    renderComponent();

    expect(screen.getByTestId('space-created-at-by')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('space-created-at-by')).toHaveTextContent('01/01/2020');
  });

  it('calls onChangeSpace when upgrade space button is clicked', () => {
    const onChangeSpace = jest.fn();

    renderComponent({ onChangeSpace });

    userEvent.click(screen.getByTestId('upgrade-space-button'));

    expect(onChangeSpace).toBeCalled();
  });

  it('should not display the upgrade button', () => {
    renderComponent({
      showChangeButton: false,
    });

    const upgradeButton = screen.queryByTestId('upgrade-space-button');

    expect(upgradeButton).not.toBeInTheDocument();
  });

  it('correct space data is present in the form', () => {
    renderComponent();

    const $idInput = within(screen.getByTestId('space-id-text-input')).getByTestId(
      'cf-ui-text-input'
    );
    const $nameInput = screen.getByTestId('space-name-text-input').querySelector('input');
    expect($idInput.value).toBe('test-id');
    expect($nameInput.value).toBe('test-name');
  });

  it('save button is disabled by default', () => {
    renderComponent();
    expect(screen.getByTestId('update-space')).toBeDisabled();
  });

  it('save button is enabled if name was changed, but disabled when it is empty', () => {
    renderComponent();

    const $nameInput = screen.getByTestId('space-name-text-input').querySelector('input');

    fireEvent.change($nameInput, { target: { value: 'new-value' } });

    expect(screen.getByTestId('update-space')).not.toBeDisabled();

    fireEvent.change($nameInput, { target: { value: '' } });

    expect(screen.getByTestId('update-space')).toBeDisabled();
  });

  it('save is called when user clicks on save and double click is handled', () => {
    const saveStub = jest.fn().mockResolvedValue();
    renderComponent({
      save: saveStub,
    });

    fireEvent.change(screen.getByTestId('space-name-text-input').querySelector('input'), {
      target: { value: 'new-value' },
    });
    userEvent.click(screen.getByTestId('update-space'));
    // try double click
    userEvent.click(screen.getByTestId('update-space'));

    expect(saveStub).toHaveBeenCalledTimes(1);
    expect(saveStub).toHaveBeenCalledWith('new-value');
  });

  it('save is not called when user clicks on disable button', () => {
    const saveStub = jest.fn().mockResolvedValue();
    renderComponent({
      save: saveStub,
    });

    fireEvent.change(screen.getByTestId('space-name-text-input').querySelector('input'), {
      target: { value: '' },
    });
    userEvent.click(screen.getByTestId('update-space'));

    expect(saveStub).not.toHaveBeenCalled();
  });

  it('should not display the delete card section when it should not show the delete button', () => {
    renderComponent();

    expect(screen.queryByTestId('danger-zone-section-card')).not.toBeInTheDocument();
  });

  it('should call onRemoveClick when the delete button is shown and then clicked', () => {
    const onRemoveClick = jest.fn();
    renderComponent({ showDeleteButton: true, onRemoveClick });

    userEvent.click(screen.getByTestId('delete-space'));

    expect(onRemoveClick).toHaveBeenCalled();
  });
});
