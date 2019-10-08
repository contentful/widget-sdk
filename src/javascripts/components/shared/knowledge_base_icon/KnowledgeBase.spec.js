import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import KnowledgeBase from './KnowledgeBase.es6';

describe('<KnowledgeBase />', () => {
  afterEach(cleanup);

  it('renders an anchor to the dev knowledge base', () => {
    const props = { target: 'entry', text: 'Sample text' };

    const { getByTestId } = renderLink(props);

    expect(getByTestId('knowledge-base-link')).toHaveTextContent(props.text);
    expect(getByTestId('icon')).toBeInTheDocument();
  });

  it('renders no icon if requested', () => {
    const props = { target: 'entry', text: 'Sample text', icon: false };

    const { queryAllByTestId } = renderLink(props);

    expect(queryAllByTestId('icon')).toHaveLength(0);
  });
});

function renderLink(props) {
  return render(<KnowledgeBase {...props} />);
}
