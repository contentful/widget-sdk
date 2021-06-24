import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { trackEvent } from '../utils/analyticsTracking';
import { AddOnPurchaseError } from '../hooks/usePurchaseAddOn';
import { SpaceCreationError } from '../hooks/useSpaceCreation';
import { SpaceChangeError } from '../hooks/useSpaceUpgrade';
import { TemplateCreationError } from '../hooks/useTemplateCreation';
import { ReceiptMessage } from './ReceiptMessage';
import * as Fake from 'test/helpers/fakeFactory';
import { router } from 'core/react-routing';

const mockSpace = Fake.Space();

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

jest.mock('core/react-routing', () => ({
  ...jest.requireActual('core/react-routing'),
  router: {
    navigate: jest.fn(),
  },
}));

jest.mock('../hooks/useSessionMetadata', () => ({
  useSessionMetadata: jest.fn().mockReturnValue('sessionData'),
}));

describe('ReceiptMessage', () => {
  it('should track when the rename space button is clicked', () => {
    build({ selectedCompose: true });

    userEvent.click(screen.getByTestId('rename-space-button'));

    expect(router.navigate).toBeCalledWith({ spaceId: '123', path: 'settings.space' });
    expect(trackEvent).toBeCalledWith('rename_space_clicked', 'sessionData');
  });

  describe('Success message', () => {
    it('renders a message for when user creates a space', () => {
      build();

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${mockSpacePlans.community.name} space ${mockSpace.name}.`
      );
    });

    it('renders a message for when user creates a space and template creation fails', () => {
      build({ error: new TemplateCreationError() });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully purchased the ${mockSpacePlans.community.name} space ${mockSpace.name}.`
      );
    });

    it('renders message for when user creates a space and purchases add on', () => {
      build({ planName: mockSpacePlans.medium.name, selectedCompose: true });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(2);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully added Compose + Launch and a new ${mockSpacePlans.medium.name} space to your organization. Install Compose + Launch on any space home.`
      );
      expect(receiptTextParagraphs[1].textContent).toContain(
        'Update the new space name anytime on the Space Settings'
      );
    });

    it('renders message for when user changes a space plan', () => {
      build({ isSpaceUpgrade: true, spaceName: mockSpace.name, newSpaceId: undefined });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).queryAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
    });

    it('renders message for when user changes a space plan and purchases add on', () => {
      build({
        isSpaceUpgrade: true,
        spaceName: mockSpace.name,
        newSpaceId: undefined,
        selectedCompose: true,
      });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).queryAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        `You successfully changed ${mockSpace.name} to a ${mockSpacePlans.community.name} space and added Compose + Launch to your organization. Install Compose + Launch on any space home.`
      );
    });

    it('renders message for when user purchases add on', () => {
      build({ spaceName: mockSpace.name, newSpaceId: undefined, selectedCompose: true });

      const receiptText = screen.getByTestId('receipt.subtext');
      const receiptTextParagraphs = within(receiptText).getAllByTestId('cf-ui-paragraph');

      expect(receiptTextParagraphs).toHaveLength(1);
      expect(receiptTextParagraphs[0].textContent).toContain(
        'You successfully added Compose + Launch to your organization. Install Compose + Launch on any space home.'
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
    spaceName: mockSpace.name,
    newSpaceId: '123',
    ...customProps,
  };

  render(<ReceiptMessage {...props} />);
}
