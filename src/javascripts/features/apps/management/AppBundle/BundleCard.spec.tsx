import React from 'react';
import { BundleCard } from './BundleCard';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { appBundleMock } from '../__mocks__/appBundles';

const defaultProps = {
  bundle: appBundleMock.items[0],
};

const renderBundle = (props) => render(<BundleCard {...props} />);

describe('BundleCard', () => {
  describe('when setNewAppBundle is not passed', () => {
    beforeEach(() => {
      renderBundle({ ...defaultProps });
    });
    it('does not render an activate  button', async () => {
      const dropDownButton = screen.getByTestId('cf-ui-icon-button');
      fireEvent.click(dropDownButton);
      await waitFor(() => {
        expect(screen.getByTestId('cf-ui-dropdown-list')).toBeVisible();
      });
      expect(screen.queryByText('Activate bundle')).toBeNull();
    });
  });

  describe('when setNewAppBundle is passed', () => {
    let setNewAppBundle;
    beforeEach(async () => {
      setNewAppBundle = jest.fn();
      renderBundle({ ...defaultProps, setNewAppBundle });
      const dropDownButton = screen.getByTestId('cf-ui-icon-button');
      fireEvent.click(dropDownButton);
      await waitFor(() => {
        expect(screen.getByTestId('cf-ui-dropdown-list')).toBeVisible();
      });
    });

    it('renders the button', async () => {
      screen.getByText('Activate bundle');
    });

    describe('when the button is clicked', () => {
      it('calls setNewAppBundle with the bundles data', () => {
        fireEvent.click(screen.getByText('Activate bundle'));
        expect(setNewAppBundle).toHaveBeenCalledWith(appBundleMock.items[0]);
      });
    });
  });
  describe('when a child is passed', () => {
    it('is rendered', () => {
      renderBundle({ ...defaultProps, children: <div>hello it is me</div> });
      screen.getByText('hello it is me');
    });
  });
});
