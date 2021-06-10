import React, { useState } from 'react';
import {
  Icon,
  Dropdown,
  DropdownList,
  DropdownListItem,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import * as Config from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  button: css({
    position: 'relative',
    padding: '0 20px',
    height: '100%',
  }),
};

// we need to pass this utm parameters in the url
// to make sure that analytics know that the traffic in those pages are coming from the user_interface
const urlWithUtm = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'help-menu',
  campaign: 'in-app-help',
});

export function KnowledgeMenu() {
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
          <Icon size="small" icon="HelpCircle" color="white" />
        </button>
      }>
      <DropdownList>
        <DropdownListItem
          testId="help-menu-help-center"
          href={urlWithUtm(Config.helpCenterUrl)}
          // @ts-expect-error missing target=_blank
          target="_blank"
          rel="noopener noreferrer">
          Help center
        </DropdownListItem>

        <DropdownListItem
          testId="help-menu-docs"
          href={urlWithUtm(Config.developerDocsUrl)}
          // @ts-expect-error missing target=_blank
          target="_blank"
          rel="noopener noreferrer">
          Developer docs
        </DropdownListItem>

        <DropdownListItem
          testId="help-menu-traning-center"
          href={`https://public.learningcenter.contentful.com/catalog`}
          // @ts-expect-error missing target=_blank
          target="_blank"
          rel="noopener noreferrer">
          Training courses
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
}
