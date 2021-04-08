import React from 'react';
import { BundleCard } from './BundleCard';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { appBundleMock } from '../__mocks__/appBundles';
import { deleteAppBundle } from '../AppEditor/appHostingApi';

jest.mock('../AppEditor/appHostingApi', () => ({
  deleteAppBundle: jest.fn().mockResolvedValue(null),
}));

const defaultProps = {
  bundle: appBundleMock.items[0],
};

const renderBundle = (props) => render(<BundleCard {...props} />);

describe('BundleCard', () => {
  describe('when removeBundle is not passed', () => {
    beforeEach(() => {
      renderBundle({ ...defaultProps });
    });
    it('does not render a delete button', async () => {
      const dropDownButton = screen.getByTestId('cf-ui-icon-button');
      fireEvent.click(dropDownButton);
      await waitFor(() => {
        expect(screen.getByTestId('cf-ui-dropdown-list')).toBeVisible();
      });
      expect(screen.queryByText('Delete bundle')).toBeNull();
    });
  });

  describe('when removeBundle is passed', () => {
    let removeBundle;
    beforeEach(() => {
      removeBundle = jest.fn();
      renderBundle({ ...defaultProps, removeBundle });
    });
    describe('when the delete bundle button is clicked', () => {
      it('calls removeBundle', async () => {
        const dropDownButton = screen.getByTestId('cf-ui-icon-button');
        fireEvent.click(dropDownButton);
        await waitFor(() => {
          expect(screen.getByTestId('cf-ui-dropdown-list')).toBeVisible();
        });

        fireEvent.click(screen.getByText('Delete bundle'));

        expect(deleteAppBundle).toHaveBeenCalledWith(
          defaultProps.bundle.sys.organization.sys.id,
          defaultProps.bundle.sys.appDefinition.sys.id,
          defaultProps.bundle.sys.id
        );
        await waitFor(() => {
          expect(removeBundle).toHaveBeenCalledWith(defaultProps.bundle);
        });
      });
    });
  });

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
