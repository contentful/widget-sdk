import React, { useState } from 'react';
import {
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import * as Config from 'Config';
import KnowledgeMenuNotification from './KnowledgeMenuNotification';

const styles = {
  button: css({
    position: 'relative',
    padding: '0 20px',
    height: '100%',
  }),
};

// we need to pass this utm parameters in the url
// to make sure that analytics know that the traffic in those pages are coming from the user_interface
const utmParams = 'utm_source=webapp&utm_medium=help-menu&utm_campaign=in-app-help';

function KnowledgeMenu() {
  const [isOpen, setIsOpen] = useState(false);

  function handleDropdownToggle() {
    setIsOpen((currValue) => !currValue);
  }

  return (
    <Dropdown
      isOpen={isOpen}
      position="bottom-right"
      aria-label="Help Menu"
      testId="help-menu"
      onClose={handleDropdownToggle}
      toggleElement={
        <button
          className={styles.button}
          type="button"
          onClick={handleDropdownToggle}
          data-test-id="help-menu-button">
          <KnowledgeMenuNotification isMenuOpen={isOpen} />
          <Icon size="small" icon="HelpCircle" color="white" />
        </button>
      }>
      <DropdownList>
        <DropdownListItem
          testId="help-menu-help-center"
          href={`${Config.helpCenterUrl}/?${utmParams}`}
          target="_blank">
          Help center
        </DropdownListItem>

        <DropdownListItem
          testId="help-menu-docs"
          href={`${Config.developerDocsUrl}/?${utmParams}`}
          target="_blank">
          Developer docs
        </DropdownListItem>

        <DropdownListItem
          testId="help-menu-traning-center"
          href={`https://public.learningcenter.contentful.com/catalog`}
          target="_blank">
          Training courses
        </DropdownListItem>
      </DropdownList>

      <DropdownList border="top">
        <DropdownListItem
          testId="help-menu-what-is-new"
          href={`${Config.developersChangelogUrl}/?${utmParams}`}
          target="_blank">
          What&apos;s new
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}

export default KnowledgeMenu;
