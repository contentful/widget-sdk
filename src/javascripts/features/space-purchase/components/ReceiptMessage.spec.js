import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { go } from 'states/Navigator';

import { trackEvent } from '../utils/analyticsTracking';
import { PLATFORM_CONTENT } from '../utils/platformContent';
import { AddOnPurchaseError } from '../hooks/usePurchaseAddOn';
import { SpaceCreationError } from '../hooks/useSpaceCreation';
import { SpaceChangeError } from '../hooks/useSpaceUpgrade';
import { TemplateCreationError } from '../hooks/useTemplateCreation';
import { ReceiptMessage } from './ReceiptMessage';

const mockSpacePlans = {
  community: { name: 'Community', price: 0 },
  medium: { name: 'Medium', price: 489 },
  large: { name: 'Large', price: 889 },
  none: 'None',
};

jest.mock('../utils/analyticsTracking', () => ({
  trackEvent: jest.fn(),
  EVENTS: jest.requireActual('../utils/analyticsTracking').EVENTS,
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

jest.mock('../hooks/useSessionMetadata', () => ({
  useSessionMetadata: jest.fn().mockReturnValue('sessionData'),
}));

describe('ReceiptMessage', () => {
  it('should track when the rename space button is clicked', () => {
    build({ selectedCompose: true });

    userEvent.click(screen.getByTestId('rename-space-button'));

    expect(go).toBeCalledWith({
      params: { spaceId: '123' },
      path: ['spaces', 'detail', 'settings', 'space'],
    });
    expect(trackEvent).toBeCalledWith('rename_space_clicked', 'sessionData');
  });

  describe('Success message', () => {
    it('renders a message for when user creates a space', () => {
      build();

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${mockSpacePlans.community.name} space New space.`
      );
    });

    it('renders a message for when user creates a space and template creation fails', () => {
      build({ error: new TemplateCreationError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${mockSpacePlans.community.name} space New space.`
      );
    });

    it('renders message for when user creates a space and purchases add on', () => {
      build({ planName: mockSpacePlans.medium.name, selectedCompose: true });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(2);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title} package and a new ${mockSpacePlans.medium.name} space. You can now install Compose and Launch on any Space Home.`
      );
      expect(receiptTextParagraphs[1].textContent).toContain(
        'Update the new space name anytime on the Space Settings'
      );
    });

    it('renders message for when user changes a space plan', () => {
      build({ isSpaceUpgrade: true, spaceName: undefined, newSpaceId: undefined });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).queryAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(0);
    });

    it('renders message for when user changes a space plan and purchases add on', () => {
      build({
        isSpaceUpgrade: true,
        spaceName: undefined,
        newSpaceId: undefined,
        selectedCompose: true,
      });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).queryAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title} package and changed your space to a ${mockSpacePlans.community.name} space. You can now install Compose and Launch on any Space Home.`
      );
    });

    it('renders message for when user purchases add on', () => {
      build({ spaceName: undefined, newSpaceId: undefined, selectedCompose: true });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title} package. You can now install Compose and Launch on any Space Home.`
      );
    });
  });

  describe('Error message', () => {
    it('renders message for when user creates a space - space creation fails', () => {
      build({ error: new SpaceCreationError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraph = within(receiptText).getByTestId('cf-ui-paragraph');

      expect(receiptTextParagraph.textContent).toContain(
        'Don’t worry, nothing has been added to your monthly bill yet. Please try again by clicking the button below.'
      );
    });

    it('renders message for when user creates a space and purchase add on - space creation fails', () => {
      build({ selectedCompose: true, error: new SpaceCreationError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraph = within(receiptText).getByTestId('cf-ui-paragraph');

      expect(receiptTextParagraph.textContent).toContain(
        'Don’t worry, nothing has been added to your monthly bill yet. Please try again by clicking the button below.'
      );
    });

    it('renders message for when user creates a space and purchase add on - add on purchase fails', () => {
      build({ selectedCompose: true, error: new AddOnPurchaseError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraph = within(receiptText).getByTestId('cf-ui-paragraph');

      expect(receiptTextParagraph.textContent).toContain(
        'Don’t worry, only the new space has been added to your monthly bill. Please click the button below to retry purchasing Compose + Launch.'
      );
    });

    it('renders message for when user changes a space - space change fails', () => {
      build({ isSpaceUpgrade: true, error: new SpaceChangeError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraph = within(receiptText).getByTestId('cf-ui-paragraph');

      expect(receiptTextParagraph.textContent).toContain(
        'Don’t worry, nothing has been added to your monthly bill yet. Please try again by clicking the button below.'
      );
    });

    it('renders message for when user changes a space and purchases add on - space change fails', () => {
      build({ isSpaceUpgrade: true, selectedCompose: true, error: new SpaceChangeError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraph = within(receiptText).getByTestId('cf-ui-paragraph');

      expect(receiptTextParagraph.textContent).toContain(
        'Don’t worry, only Compose + Launch has been added to your monthly bill. Please click the button below to retry changing your space size.'
      );
    });

    it('renders message for when user changes a space and purchases add on - add on purchase fails', () => {
      build({ isSpaceUpgrade: true, selectedCompose: true, error: new AddOnPurchaseError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraph = within(receiptText).getByTestId('cf-ui-paragraph');

      expect(receiptTextParagraph.textContent).toContain(
        'Don’t worry, nothing has been added to your monthly bill yet. Please try again by clicking the button below.'
      );
    });
  });
});

function build(customProps) {
  const props = {
    pending: false,
    planName: mockSpacePlans.community.name,
    spaceName: 'New space',
    newSpaceId: '123',
    ...customProps,
  };

  render(<ReceiptMessage {...props} />);
}
