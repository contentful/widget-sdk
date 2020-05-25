import React from 'react';
import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from 'redux/reducer';
import routes from 'redux/routes';

import { SpaceSettingsConnected } from './SpaceSettings';

const activeOrgId = 'testOrgId';
describe('SpaceSettings', () => {
  let store;

  beforeEach(() => {
    store = createStore(reducer);
    store.dispatch({
      type: 'LOCATION_CHANGED',
      payload: {
        location: {
          pathname: routes.organization.build({ orgId: activeOrgId }),
        },
      },
    });
    store.dispatch({
      type: 'USER_UPDATE_FROM_TOKEN',
      payload: {
        user: {
          organizationMemberships: [
            {
              organization: {
                sys: {
                  id: activeOrgId,
                },
              },
              role: 'owner',
            },
          ],
        },
      },
    });
  });

  const renderComponent = (props) => {
    return render(
      <Provider store={store}>
        <SpaceSettingsConnected
          spaceName="test-name"
          spaceId="test-id"
          onRemoveClick={noop}
          save={noop}
          onChangeSpace={noop}
          plan={{ name: 'testPlanName', price: 10 }}
          {...props}
        />
      </Provider>
    );
  };

  it('does not display space-plan-card if it is v1 pricing', () => {
    renderComponent({ plan: null });

    expect(screen.queryByTestId('upgrade-space-plan-card')).not.toBeInTheDocument();
  });

  it('displays plan and plan information for v2 pricing', () => {
    renderComponent();

    expect(screen.getByTestId('space-settings-page.plan-price')).toHaveTextContent(
      'testPlanName - $10 /month'
    );
  });

  it('calls onChangeSpace when upgrade space button is clicked', () => {
    const onChangeSpace = jest.fn();

    renderComponent({ onChangeSpace });

    userEvent.click(screen.getByTestId('upgrade-space-button'));

    expect(onChangeSpace).toBeCalled();
  });

  it('correct space data is present in the form', () => {
    const { getByTestId } = renderComponent();
    const $idInput = getByTestId('space-id-text-input').querySelector('input');
    const $nameInput = getByTestId('space-name-text-input').querySelector('input');
    expect($idInput.value).toBe('test-id');
    expect($nameInput.value).toBe('test-name');
  });

  it('save button is disabled by default', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('update-space')).toBeDisabled();
  });

  it('save button is enabled if name was changed, but disabled when it is empty', () => {
    const { getByTestId } = renderComponent();

    const $nameInput = getByTestId('space-name-text-input').querySelector('input');

    fireEvent.change($nameInput, { target: { value: 'new-value' } });

    expect(getByTestId('update-space')).not.toBeDisabled();

    fireEvent.change($nameInput, { target: { value: '' } });

    expect(getByTestId('update-space')).toBeDisabled();
  });

  it('save is called when user clicks on save and double click is handled', () => {
    const saveStub = jest.fn().mockResolvedValue();
    const { getByTestId } = renderComponent({
      save: saveStub,
    });
    fireEvent.change(getByTestId('space-name-text-input').querySelector('input'), {
      target: { value: 'new-value' },
    });
    fireEvent.click(getByTestId('update-space'));
    // try double click
    fireEvent.click(getByTestId('update-space'));
    expect(saveStub).toHaveBeenCalledTimes(1);
    expect(saveStub).toHaveBeenCalledWith('new-value');
  });

  it('save is not called when user clicks on disable button', () => {
    const saveStub = jest.fn().mockResolvedValue();
    const { getByTestId } = renderComponent({
      save: saveStub,
    });
    fireEvent.change(getByTestId('space-name-text-input').querySelector('input'), {
      target: { value: '' },
    });
    fireEvent.click(getByTestId('update-space'));
    expect(saveStub).not.toHaveBeenCalled();
  });
});
