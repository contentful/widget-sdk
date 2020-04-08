import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { get } from 'lodash';
import {
  DropdownList,
  DropdownListItem,
  Dropdown,
  TextLink,
  Icon,
  Tag,
  Spinner,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  icon: css({
    float: 'right',
    marginLeft: tokens.spacingXs,
    marginRight: -tokens.spacing2Xs,
  }),
  dropdownSpacing: css({
    marginRight: tokens.spacingM,
  }),
};

const stateColours = {
  published: 'positive',
  draft: 'warning',
  changes: 'primary',
  archived: 'negative',
};

const BulkEntityEditorStatusDropdown = ({ stateLabel, state, inProgress, allActions }) => {
  const [isOpen, setOpen] = useState(false);

  const color = get(stateColours, state, 'positive');

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      testId="change-state-menu"
      className={styles.dropdownSpacing}
      position="bottom-right"
      toggleElement={
        <TextLink
          testId="bulk-entity-editor-status-dropdown-trigger"
          onClick={() => setOpen(!isOpen)}>
          <Tag aria-busy={inProgress} tagType={color}>
            {stateLabel}
          </Tag>
          {inProgress ? (
            <Spinner size="small" className={styles.icon} />
          ) : (
            <Icon icon="ChevronDown" color={color} className={styles.icon} />
          )}
        </TextLink>
      }>
      <DropdownList testId="bulk-entity-editor-status-dropdown-menu">
        {allActions.map((command) => (
          <DropdownListItem
            testId={`bulk-entity-editor-${command.label.toLowerCase()}-button`}
            onClick={() => {
              // command.execute is sensitive to scope..
              command.execute();
              setOpen(false);
            }}
            key={command.label}>
            {command.label}
          </DropdownListItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};

BulkEntityEditorStatusDropdown.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  state: PropTypes.string.isRequired,
  stateLabel: PropTypes.string.isRequired,
  allActions: PropTypes.arrayOf(
    PropTypes.shape({
      execute: PropTypes.func.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default BulkEntityEditorStatusDropdown;
