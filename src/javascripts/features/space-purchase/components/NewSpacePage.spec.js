import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as FakeFactory from 'test/helpers/fakeFactory';
import { NewSpacePage } from './NewSpacePage';

const mockOrganization = FakeFactory.Organization();

describe('NewSpacePage', () => {
  it('should render SPACE_SELECTION page as a default', () => {
    build();

    expect(screen.getByTestId('space-selection-section')).toBeVisible();
  });

  it('should render SPACE_DETAILS when a plan has been selected', () => {
    build();

    userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

    waitFor(() => {
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();
    });
  });

  describe('handler functionality', () => {
    it('should update space name when onChangeSpaceName is used', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);

      const input = screen.getByTestId('space-name').getElementsByTagName('input')[0];

      userEvent.type(input, 'test');

      expect(input.value).toEqual('test');
    });
  });

  describe('back button', () => {
    it('should go back a step when clicked', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      userEvent.click(screen.getByTestId('navigate-back'));

      expect(screen.getByTestId('space-selection-section')).toBeVisible();
    });

    it('should go back a step when browser back is clicked', () => {
      build();

      userEvent.click(screen.getAllByTestId('select-space-cta')[0]);
      expect(screen.getByTestId('new-space-details-section')).toBeVisible();

      window.history.back();

      waitFor(() => {
        expect(screen.getByTestId('space-selection-section')).toBeVisible();
      });
    });
  });
});

function build(customProps) {
  const props = {
    organizationId: mockOrganization.sys.id,
    templatesList: [],
    ...customProps,
  };

  render(<NewSpacePage {...props} />);
}
