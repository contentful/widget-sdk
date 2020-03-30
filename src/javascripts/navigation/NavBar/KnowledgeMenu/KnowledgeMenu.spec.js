import React from 'react';
import { render } from '@testing-library/react';
import { getStore } from 'browserStorage';
import KnowledgeMenu from './KnowledgeMenu';

const localStorage = getStore('local');

describe('<KnowledgeMenu />', () => {
  afterEach(() => {
    localStorage.remove('hasSeenHelpMenu');
  });

  it('should toggle the submenu when clicking on the icon', () => {
    const { queryByTestId } = render(<KnowledgeMenu />);

    const icon = queryByTestId('help-menu-button');

    icon.click();

    const helpCenterItem = queryByTestId('help-menu-help-center');

    // one item should suffice to make sure the submenu is opened
    // also checking by the item, is more accurate to make sure the users are seeing the menu
    expect(helpCenterItem).toBeInTheDocument();

    icon.click();

    expect(helpCenterItem).not.toBeInTheDocument();
  });

  it('should remove the notification badge after clicking on the menu once', async () => {
    const { queryByTestId } = render(<KnowledgeMenu />);

    const icon = queryByTestId('help-menu-button');
    const badge = queryByTestId('help-menu-notification');

    expect(badge).toBeInTheDocument();

    icon.click();

    expect(badge).not.toBeInTheDocument();
  });
});
