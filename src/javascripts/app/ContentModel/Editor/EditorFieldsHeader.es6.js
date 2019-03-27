import React, { useState } from 'react';
import { css } from 'emotion';
import ContentFieldsIcon from './ContentFieldsIcon.es6';
import PropTypes from 'prop-types';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem
} from '@contentful/forma-36-react-components';

const styles = {
  dropdownContainer: css({
    width: '150px'
  })
};

export default function EditorFieldsHeader(props) {
  const [openActions, setOpenActions] = useState(false);

  return (
    <div className="workbench-header__wrapper">
      <header className="workbench-header">
        <div className="workbench-header__icon">
          <ContentFieldsIcon />
        </div>
        <h1 className="workbench-header__title">{props.contentTypeName}</h1>
        <div className="workbench-header__description">{props.contentTypeDescription}</div>
        {props.canEdit && (
          <button
            data-test-id="show-metadata-dialog"
            onClick={() => {
              props.showMetadataDialog.execute();
            }}
            className="text-link">
            Edit
          </button>
        )}
        {props.canEdit && (
          <div className="workbench-header__actions">
            {props.isNew && (
              <Button
                buttonType="muted"
                testId="cancel-content-type"
                onClick={() => {
                  props.cancel.execute();
                }}>
                Cancel
              </Button>
            )}
            <Dropdown
              onClose={() => setOpenActions(false)}
              isOpen={openActions}
              toggleElement={
                <Button
                  indicateDropdown
                  testId="content-type-actions"
                  onClick={() => {
                    setOpenActions(!openActions);
                  }}
                  buttonType="muted">
                  Actions
                </Button>
              }>
              <DropdownList className={styles.dropdownContainer}>
                <DropdownListItem
                  onClick={() => {
                    setOpenActions(false);
                    props.duplicate.execute();
                  }}
                  testId="duplicate-content-type">
                  Duplicate
                </DropdownListItem>
                <DropdownListItem
                  onClick={() => {
                    setOpenActions(false);
                    props.delete.execute();
                  }}
                  testId="delete-content-type">
                  Delete
                </DropdownListItem>
              </DropdownList>
            </Dropdown>
            <Button
              testId="save-content-type"
              buttonType="positive"
              onClick={() => {
                props.save.execute();
              }}
              loading={props.save.inProgress()}
              disabled={props.save.isDisabled()}>
              Save
            </Button>
          </div>
        )}
      </header>
    </div>
  );
}

EditorFieldsHeader.propTypes = {
  isNew: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  contentTypeName: PropTypes.string.isRequired,
  contentTypeDescription: PropTypes.string,
  showMetadataDialog: PropTypes.object.isRequired,
  save: PropTypes.object.isRequired,
  delete: PropTypes.object.isRequired,
  cancel: PropTypes.object.isRequired,
  duplicate: PropTypes.object.isRequired
};
