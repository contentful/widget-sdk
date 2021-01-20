import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { FAQAccordion } from './FAQAccordion';

// Mocked since this consumes a complex data structure that is difficult to mock
jest.mock('core/services/ContentfulCDA', () => ({
  ContentfulRichText: ({ document }) => {
    return <>{document}</>;
  },
}));

const mockQuestion = 'This is a test question?';
const mockAnswer = 'Yes, this is a test question';
const mockFaqs = [
  {
    fields: {
      question: mockQuestion,
      answer: mockAnswer,
    },
  },
];

describe('FAQAccordion', () => {
  it('should render a loading state when faqs are loading', () => {
    build({ entries: null });

    expect(screen.getByTestId('faq-loading')).toBeVisible();
  });

  it('should render the faqs when they have loaded', () => {
    build();

    expect(screen.getByText(mockQuestion)).toBeVisible();
  });

  it('should track when an faq is opened', () => {
    const track = jest.fn();

    build({ track });

    userEvent.click(screen.getByText(mockQuestion));

    expect(track).toBeCalled();
    expect(screen.getByText(mockAnswer)).toBeVisible();
  });
});

function build(customProps) {
  const props = {
    track: () => {},
    entries: mockFaqs,
    ...customProps,
  };

  render(<FAQAccordion {...props} />);
}