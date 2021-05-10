import React from 'react';
import { render, screen } from '@testing-library/react';

import KnowledgeBase from './KnowledgeBase';

describe('<KnowledgeBase />', () => {
  it('renders IconButton with link to the dev knowledge base', () => {
    const props = { target: 'entry', asIcon: true };
    renderLink(props);

    expect(screen.getByTestId('knowledge-base-icon')).toBeInTheDocument();
  });

  it('renders TextLink to the dev knowledge base', () => {
    const props = { target: 'entry', text: 'Sample text', asIcon: false };
    renderLink(props);

    expect(screen.getByTestId('knowledge-base-link')).toHaveTextContent(props.text);
  });
});

function renderLink(props) {
  return render(<KnowledgeBase {...props} />);
}
