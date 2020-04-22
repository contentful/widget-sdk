import React from 'react';
import { render } from '@testing-library/react';
import KnowledgeMenuNotification from './KnowledgeMenuNotification';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const localStorage = getBrowserStorage('local');

describe('<KnowledgeMenuNotification />', () => {
  afterEach(() => {
    localStorage.remove('hasSeenHelpMenu');
  });

  it('should be visible', () => {
    const { queryByTestId } = render(<KnowledgeMenuNotification isMenuOpen={false} />);

    const badge = queryByTestId('help-menu-notification');

    expect(badge).toBeVisible();
  });

  it('should not be visible if it was already seen', () => {
    localStorage.set('hasSeenHelpMenu', 'yes');

    const { queryByTestId } = render(<KnowledgeMenuNotification isMenuOpen={false} />);

    const badge = queryByTestId('help-menu-notification');

    expect(badge).toBeNull();
  });

  it('should not be visible if the menu was opened', () => {
    const { queryByTestId } = render(<KnowledgeMenuNotification isMenuOpen={true} />);

    const badge = queryByTestId('help-menu-notification');

    expect(badge).toBeNull();
  });
});
