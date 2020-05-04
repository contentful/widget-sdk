import React from 'react';

import { render } from '@testing-library/react';
import { AdminOnly } from './AdminOnly';

import * as spaceContextMocked from 'ng/spaceContext';
import * as $stateMocked from 'ng/$state';

describe('AdminOnly', () => {
  beforeEach(() => {
    $stateMocked.go.mockClear();
    spaceContextMocked.getData.mockReset();
  });

  const setAdmin = (isAdmin) => {
    spaceContextMocked.getData.mockReturnValue(isAdmin);
  };

  describe('if isAdmin is true', () => {
    it('should render children', () => {
      expect.assertions(1);
      setAdmin(true);
      const { container } = render(
        <AdminOnly>
          <div data-test-id="visible-only-for-admin">This is visible only for admins</div>
        </AdminOnly>
      );
      expect(container).toHaveTextContent('This is visible only for admins');
    });
  });

  describe('if isAdmin is false', () => {
    it('should render StateRedirect', () => {
      expect.assertions(2);
      setAdmin(false);
      const { container } = render(
        <AdminOnly>
          <div>This is visible only for admins</div>
        </AdminOnly>
      );
      expect(container).not.toHaveTextContent('This is visible only for admins');
      expect($stateMocked.go).toHaveBeenCalledWith(
        'spaces.detail.entries.list',
        undefined,
        undefined
      );
    });

    it('should render StateRedirect with custom "to" if "redirect" is passed', () => {
      expect.assertions(2);
      setAdmin(false);
      const { container } = render(
        <AdminOnly redirect="^.home">
          <div>This is visible only for admins</div>
        </AdminOnly>
      );
      expect(container).not.toHaveTextContent('This is visible only for admins');
      expect($stateMocked.go).toHaveBeenCalledWith('^.home', undefined, undefined);
    });

    it('can use conditional rendering for more complex scenarios', () => {
      expect.assertions(3);
      setAdmin(false);
      const { container } = render(
        <AdminOnly render={() => <div>You have no access to see this page</div>}>
          <div>This is visible only for admins</div>
        </AdminOnly>
      );
      expect(container).not.toHaveTextContent('This is visible only for admins');
      expect(container).toHaveTextContent('You have no access to see this page');
      expect($stateMocked.go).not.toHaveBeenCalled();
    });
  });
});