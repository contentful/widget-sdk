import React, { useState } from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TextLink,
  Flex,
} from '@contentful/forma-36-react-components';

const styles = {
  dropdownContainer: css({
    width: '150px',
  }),
  headerActions: css({
    ['> *']: {
      marginLeft: '1em',
    },
  }),
};

export function ContentTypePageActions(props) {
  const [openActions, setOpenActions] = useState(false);

  return (
    <>
      {props.canEdit && (
        <TextLink
          testId="show-metadata-dialog"
          onClick={() => {
            props.showMetadataDialog.execute();
          }}
          className="text-link">
          Edit
        </TextLink>
      )}
      {props.canEdit && (
        <Flex alignItems="center" alignSelf="center" className={styles.headerActions}>
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
          {!props.isNew && (
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
          )}
          <Button
            testId="save-content-type"
            buttonType="positive"
            onClick={() => {
              props.save.execute();
            }}
            // TODO: fix "inProgress" state in "utils/command/command.js"
            // loading={props.save.inProgress()}
            disabled={props.save.isDisabled()}>
            Save
          </Button>
        </Flex>
      )}
    </>
  );
}

ContentTypePageActions.propTypes = {
  isNew: PropTypes.bool,
  canEdit: PropTypes.bool.isRequired,
  showMetadataDialog: PropTypes.object.isRequired,
  save: PropTypes.object.isRequired,
  delete: PropTypes.object.isRequired,
  cancel: PropTypes.object.isRequired,
  duplicate: PropTypes.object.isRequired,
};
