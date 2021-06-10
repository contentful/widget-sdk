import { render } from '@testing-library/react';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import React from 'react';
import { KnowledgeMenu } from './KnowledgeMenu';

const localStorage = getBrowserStorage('local');

describe('<KnowledgeMenu />', () => {
  afterEach(() => {
    localStorage.remove('hasSeenHelpMenu');
  });

  it('should toggle the submenu when clicking on the icon', async () => {
    const { findByTestId } = render(<KnowledgeMenu />);

    const icon = await findByTestId('help-menu-button');
    icon.click();

    // one item should suffice to make sure the submenu is opened
    // also checking by the item, is more accurate to make sure the users are seeing the menu
    await expect(findByTestId('help-menu-help-center')).resolves.toBeDefined();

    icon.click();

    await expect(findByTestId('help-menu-help-center')).rejects.toBeDefined();
  });
});
