import React, { useState } from 'react';
import { css } from 'emotion';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownListItem,
  TextLink,
  Flex,
} from '@contentful/forma-36-react-components';
import type { useCreateActions } from 'features/content-model-editor';

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

type Actions = ReturnType<typeof useCreateActions>['actions'];

export interface ContentTypePageActionsProps {
  isNew?: boolean;
  canEdit: boolean;
  showMetadataDialog: Actions['showMetadataDialog'];
  save: Actions['save'];
  delete: Actions['delete'];
  cancel: Actions['cancel'];
  duplicate: Actions['duplicate'];
}

export function ContentTypePageActions(props: ContentTypePageActionsProps) {
  const [openActions, setOpenActions] = useState(false);
  const [inProgress, setInProgress] = useState(false);

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
            onClick={async () => {
              try {
                setInProgress(true);
                await props.save.execute();
              } finally {
                setInProgress(false);
              }
            }}
            loading={inProgress}
            disabled={inProgress || props.save.isDisabled()}>
            Save
          </Button>
        </Flex>
      )}
    </>
  );
}
