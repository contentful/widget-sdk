import React from 'react';
import { when } from 'jest-when';
import { screen, render } from '@testing-library/react';
import * as accessChecker from 'access_control/AccessChecker';
import NoEditorsWarning from './NoEditorsWarning';

jest.mock('access_control/AccessChecker', () => {
  const AccessChecker = jest.requireActual('access_control/AccessChecker');
  return {
    ...AccessChecker,
    can: jest.fn(),
  };
});

describe('NoEditorsWarning', () => {
  const props = {
    contentTypeId: 'my_content_type',
  };
  describe('When the user can update contentTypes', () => {
    beforeEach(() => {
      when(accessChecker.can as jest.Mock)
        .expectCalledWith('update', 'contentType')
        .mockReturnValue(true);

      render(<NoEditorsWarning {...props} />);
    });
    it('renders warning message', () => {
      screen.getByText(/Editing is disabled/);
    });

    it('renders change link', () => {
      screen.getByRole('link', { name: /Change/ });
    });
  });

  describe('When the user cannot update contentTypes', () => {
    beforeEach(() => {
      when(accessChecker.can as jest.Mock)
        .expectCalledWith('update', 'contentType')
        .mockReturnValue(false);
      render(<NoEditorsWarning {...props} />);
    });

    it('renders warning message', () => {
      screen.getByText(/Editing is disabled/);
    });

    it('does not render change link', () => {
      expect(screen.queryByRole('link', { name: /Change/ })).toEqual(null);
    });
  });
});
