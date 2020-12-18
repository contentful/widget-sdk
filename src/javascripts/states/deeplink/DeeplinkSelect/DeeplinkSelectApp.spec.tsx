import React from 'react';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';
import { getOrgApps } from 'states/deeplink/utils';
jest.mock('states/deeplink/utils', () => ({
  getOrgApps: jest.fn(),
}));

import DeeplinkSelectApp from './DeeplinkSelectApp';

describe('Deeplink Select App', () => {
  describe('When apps are resolved, an app is selected', () => {
    const apps = [
      { sys: { id: 'my_boring_app' }, name: 'snooze fest' },
      { sys: { id: 'my_nice_app' }, name: 'My nice app' },
    ];

    describe('continue is clicked', () => {
      it('calls on continue..', async () => {
        (getOrgApps as jest.Mock).mockResolvedValue(apps);

        const props = {
          redirect: { params: { orgId: 'orgid' } },
          onContinue: jest.fn(),
          onCancel: jest.fn(),
        };

        render(<DeeplinkSelectApp {...props} />);

        const selectInput = screen.getByTestId('deeplink-select-app');

        expect(selectInput).toBeDisabled();

        await waitFor(() => expect(selectInput).not.toBeDisabled());

        fireEvent.change(selectInput, {
          target: {
            value: selectInput.querySelector('option:nth-child(3)')?.getAttribute('value'),
          },
        });

        fireEvent.click(screen.getByTestId('deeplink-proceed'));

        expect(props.onContinue).toHaveBeenCalledWith(apps[1].sys.id);
      });
    });

    describe('cancel is clicked', () => {
      it('calls onCancel', async () => {
        (getOrgApps as jest.Mock).mockResolvedValue(apps);

        const props = {
          redirect: { params: { orgId: 'orgid' } },
          onContinue: jest.fn(),
          onCancel: jest.fn(),
        };

        render(<DeeplinkSelectApp {...props} />);

        const selectInput = screen.getByTestId('deeplink-select-app');

        expect(selectInput).toBeDisabled();

        await waitFor(() => expect(selectInput).not.toBeDisabled());

        fireEvent.change(selectInput, {
          target: {
            value: selectInput.querySelector('option:nth-child(3)')?.getAttribute('value'),
          },
        });

        fireEvent.click(screen.getByText(/Cancel/));

        expect(props.onCancel).toHaveBeenCalled();
      });
    });
  });
});
