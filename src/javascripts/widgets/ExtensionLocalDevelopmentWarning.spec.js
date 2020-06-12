import React from 'react';
import { Heading } from '@contentful/forma-36-react-components';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ExtensionLocalDevelopmentWarning from './ExtensionLocalDevelopmentWarning';

const childText = 'Hello world!';

const ChildComponent = () => (
  <div>
    <Heading>{childText}</Heading>
  </div>
);

describe('Extension Development Mode', () => {
  describe('When developmentMode is true', () => {
    it('renders the development mode warning and children', () => {
      render(
        <ExtensionLocalDevelopmentWarning developmentMode={true}>
          <ChildComponent />
        </ExtensionLocalDevelopmentWarning>
      );

      screen.getByRole('heading', { name: childText });
      screen.getByRole('button', { name: /Ok, hide it/ });
    });

    it('clears the warning when it is clicked', async () => {
      render(
        <ExtensionLocalDevelopmentWarning developmentMode={true}>
          <ChildComponent />
        </ExtensionLocalDevelopmentWarning>
      );

      const clearButton = screen.getByRole('button', { name: /Ok, hide it/ });
      await userEvent.click(clearButton);
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('When developmentMode is false', () => {
    it('renders children with no development mode warning', () => {
      render(
        <ExtensionLocalDevelopmentWarning developmentMode={false}>
          <ChildComponent />
        </ExtensionLocalDevelopmentWarning>
      );

      screen.getByRole('heading', { name: childText });
      expect(screen.queryByRole('button', { name: /Ok, hide it/ })).not.toBeInTheDocument();
    });
  });
});
