import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as Navigator from 'states/Navigator';
import {
  DropdownList,
  DropdownListItem,
  Dropdown,
  TextLink,
  Icon,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

const styles = {
  chevronIcon: css({
    float: 'right',
    marginLeft: tokens.spacingXs,
    marginRight: -tokens.spacing2Xs,
  }),
  dropdownSpacing: css({
    marginRight: tokens.spacingM,
  }),
};

const BulkEntityEditorActionsDropdown = ({ openInEntryEditor, stateRef, unlink }) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      className={styles.dropdownSpacing}
      position="bottom-right"
      toggleElement={
        <TextLink testId="bulk-editor-actions-dropdown-trigger" onClick={() => setOpen(!isOpen)}>
          Actions <Icon className={styles.chevronIcon} icon="ChevronDown" />
        </TextLink>
      }>
      <DropdownList testId="bulk-editor-actions-dropdown-menu">
        <DropdownListItem
          onClick={openInEntryEditor}
          href={Navigator.href(stateRef)}
          target="_blank"
          rel="noopener noreferrer">
          Edit entry in new tab
        </DropdownListItem>
        <DropdownListItem onClick={unlink}>Unlink entry</DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
};

BulkEntityEditorActionsDropdown.propTypes = {
  openInEntryEditor: PropTypes.func.isRequired,
  unlink: PropTypes.func.isRequired,
  stateRef: PropTypes.object.isRequired,
};

export default BulkEntityEditorActionsDropdown;
