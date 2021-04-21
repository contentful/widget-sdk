import React from 'react';
import { render } from '@testing-library/react';
import { LevelHelpText } from './LevelHelpText';
import { LEVEL } from '../constants';

describe('when level is DISABLED', () => {
  it('renders a loading section', async () => {
    const { container } = render(<LevelHelpText level={LEVEL.DISABLED} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('when level is MIGRATING', () => {
  it('renders a loading section', async () => {
    const { container } = render(<LevelHelpText level={LEVEL.MIGRATING} />);
    expect(container).toHaveTextContent(
      'returned from the CDA, CMA, and CPA will point to the normal assets CDN and will be publicly accessible'
    );
    expect(container).toHaveTextContent('You can generate signing keys');
  });
});

describe('when level is UNPUBLISHED', () => {
  it('renders a loading section', async () => {
    const { container } = render(<LevelHelpText level={LEVEL.UNPUBLISHED} />);
    expect(container).toHaveTextContent(
      'returned from the CMA and CPA will point to the secure assets CDN'
    );
  });
});

describe('when level is ALL', () => {
  it('renders a loading section', async () => {
    const { container } = render(<LevelHelpText level={LEVEL.ALL} />);
    expect(container).toHaveTextContent(
      'returned from the CDA, CMA, and CPA will point to the secure assets CDN'
    );
  });
});