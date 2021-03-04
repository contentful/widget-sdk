import React from 'react';
import { render, screen } from '@testing-library/react';

import { AddOnPurchaseError } from '../hooks/usePurchaseAddOn';
import { SpaceCreationError } from '../hooks/useSpaceCreation';
import { SpaceChangeError } from '../hooks/useSpaceUpgrade';
import { TemplateCreationError } from '../hooks/useTemplateCreation';
import { ReceiptTitle } from './ReceiptTitle';

describe('ReceiptTitle', () => {
  describe('Success title', () => {
    it('renders title for when user creates/changes a space', () => {
      build();

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain('Nice one!');
    });

    it('renders title for when user creates a space and template creation fails', () => {
      build({ error: new TemplateCreationError() });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain('Nice one!');
    });

    it('renders title for when user creates a space and the screen is loading', () => {
      build({ pending: true });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain('Hang on, your order is on its way');
    });

    it('renders title for when user changes a space and the screen is loading', () => {
      build({ pending: true, isSpaceUpgrade: true });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain('Hang on, we’re changing your space');
    });
  });

  describe('Error title', () => {
    it('renders title for when user creates a space - space creation fails', () => {
      build({ error: new SpaceCreationError() });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain(
        'Oh dear, we had some trouble processing your order'
      );
    });

    it('renders title for when user creates a space and purchase add on - add on purchase fails', () => {
      build({ error: new AddOnPurchaseError() });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain(
        'Oh dear, we had some trouble processing your purchase of Compose + Launch'
      );
    });

    it('renders title for when user changes a space - space change fails', () => {
      build({ isSpaceUpgrade: true, error: new SpaceChangeError() });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain(
        'Oh dear, we had some trouble processing your space upgrade'
      );
    });

    it('renders title for when user changes a space and purchases add on - add on purchase fails', () => {
      build({ isSpaceUpgrade: true, error: new AddOnPurchaseError() });

      const receiptText = screen.getByTestId('receipt-section-heading');
      expect(receiptText.textContent).toContain(
        'Oh dear, we had some trouble processing your order'
      );
    });
  });
});

function build(customProps) {
  const props = {
    pending: false,
    ...customProps,
  };

  render(<ReceiptTitle {...props} />);
}
