import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentationTextLink } from './DocumentationTextLink';

const expectedUrl =
  'https://www.contentful.com/developers/docs/tutorials/general/embargoed-assets-getting-started/';

it('renders a link with expected URL to documentation', async () => {
  render(<DocumentationTextLink />);

  expect(await screen.findByTestId('doc-link')).toHaveAttribute('href', expectedUrl);
});
