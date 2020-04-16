import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import * as Navigator from 'states/Navigator';
import * as accessChecker from 'access_control/AccessChecker';
import * as logger from 'services/logger';
import tokens from '@contentful/forma-36-tokens';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  IconButton,
  Notification,
} from '@contentful/forma-36-react-components';

const styles = {
  dropdown: css({
    display: 'flex',
    marginLeft: tokens.spacingM,
  }),
};

export default function EntrySecondaryActions({ entityInfo, entryActions, onDelete }) {
  const [isOpen, setOpen] = useState(false);
  const [areDisabledFieldsVisible, setAreDisabledFieldsVisible] = useState(false);

  const canCreateEntry = () => {
    return accessChecker.canPerformActionOnEntryOfType('create', entityInfo.contentTypeId);
  };

  const goToCreatedEntry = (entry) => {
    Navigator.go({
      path: '^.detail',
      params: {
        entryId: entry.data.sys.id,
        previousEntries: '',
        addToContext: false,
      },
    });
  };

  const handleDuplicate = () => {
    return entryActions
      .onDuplicate()
      .then((entry) => {
        goToCreatedEntry(entry);
        setOpen(false);
      })
      .catch((error) => {
        logger.logError(`Duplicating entry failed`, {
          error,
          message: error.message,
        });
        Notification.error('Entry duplication failed');
      });
  };

  const handleAdd = () => {
    entryActions
      .onAdd()
      .then((entry) => {
        goToCreatedEntry(entry);
        setOpen(false);
      })
      .catch((error) => {
        logger.logError(`Adding entry failed`, {
          error,
          message: error.message,
        });
        Notification.error('Entry creation failed');
      });
  };

  const handleShowDisabled = () => {
    const show = entryActions.onShowDisabledFields();
    setAreDisabledFieldsVisible(show);
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete.execute();
    setOpen(false);
  };

  return (
    <>
      <Dropdown
        testId="cf-ui-secondary-entry-actions"
        className={styles.dropdown}
        toggleElement={
          <IconButton
            testId="cf-ui-button-actions"
            buttonType="secondary"
            label="Entry actions"
            iconProps={{ icon: 'MoreHorizontal', size: 'large' }}
            onClick={() => {
              setOpen(!isOpen);
            }}
          />
        }
        onClose={() => setOpen(false)}
        isOpen={isOpen}>
        <DropdownList testId="cf-ui-secondary-entry-actions-list">
          <DropdownListItem
            onClick={handleAdd}
            isDisabled={!canCreateEntry()}
            testId="cf-ui-button-action-add">
            Create new <em>{entityInfo.contentType.name}</em>
          </DropdownListItem>
          <DropdownListItem
            onClick={handleDuplicate}
            testId="cf-ui-button-action-duplicate"
            isDisabled={!canCreateEntry()}>
            Duplicate
          </DropdownListItem>
          <DropdownListItem onClick={handleDelete} testId="cf-ui-button-action-delete">
            Delete
          </DropdownListItem>
          <DropdownListItem
            onClick={handleShowDisabled}
            testId="cf-ui-button-action-show-disabled-fields">
            {areDisabledFieldsVisible ? `Hide disabled fields` : `Show disabled fields`}
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    </>
  );
}

EntrySecondaryActions.propTypes = {
  entryActions: PropTypes.shape({
    onAdd: PropTypes.func,
    onDuplicate: PropTypes.func,
    onShowDisabledFields: PropTypes.func,
    getContentType: PropTypes.func,
  }),
  onDelete: PropTypes.shape({
    execute: PropTypes.func,
  }),
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
    contentTypeId: PropTypes.string,
    contentType: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
};
