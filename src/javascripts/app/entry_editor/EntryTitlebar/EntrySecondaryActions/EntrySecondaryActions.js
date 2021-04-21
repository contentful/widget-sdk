import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import * as Navigator from 'states/Navigator';
import * as accessChecker from 'access_control/AccessChecker';
import * as logger from 'services/logger';
import * as K from 'core/utils/kefir';
import tokens from '@contentful/forma-36-tokens';
import {
  Dropdown,
  DropdownList,
  DropdownListItem,
  IconButton,
  Notification,
} from '@contentful/forma-36-react-components';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { valuePropertyAt } from 'app/entity_editor/Document';
import {
  alignSlugWithEntryTitle,
  appendDuplicateIndexToEntryTitle,
} from 'app/entity_editor/entityHelpers';
import * as Analytics from 'analytics/Analytics';

const styles = {
  dropdown: css({
    display: 'flex',
    marginLeft: tokens.spacingM,
  }),
};

export default function EntrySecondaryActions({
  entityInfo,
  otDoc,
  editorData,
  preferences,
  onDelete,
}) {
  const { currentSpaceContentTypes, currentSpace } = useSpaceEnvContext();
  const [isOpen, setOpen] = useState(false);

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

  const entryActions = useMemo(() => {
    const contentTypeData = {
      id: entityInfo.contentTypeId,
      type: currentSpaceContentTypes.find(({ sys }) => sys.id === entityInfo.contentTypeId),
    };
    return {
      onAdd: async () => {
        Analytics.track('entry_editor:created_with_same_ct', {
          contentTypeId: contentTypeData.id,
          entryId: entityInfo.id,
        });

        try {
          const entry = await currentSpace.createEntry(contentTypeData.id, {});
          Analytics.track('entry:create', {
            eventOrigin: 'entry-editor',
            contentType: contentTypeData.type,
            response: entry.data,
          });
          goToCreatedEntry(entry);
          setOpen(false);
        } catch (error) {
          logger.captureError(error);
          Notification.error('Entry creation failed');
        }
      },
      onDuplicate: async () => {
        const currentFields = K.getValue(valuePropertyAt(otDoc, ['fields']));
        const displayFieldId = contentTypeData.type.displayField;
        const displayFieldControl =
          contentTypeData.type.fields.find((field) => field.id === displayFieldId) || {};
        const currentFieldsWithIndexedDisplayField = appendDuplicateIndexToEntryTitle(
          currentFields,
          displayFieldId
        );
        const slugControl = editorData.editorInterface.controls.find(
          (control) => control.widgetId === 'slugEditor'
        );
        // [PUL-809] We update the slug with the same index that was set on the displayField
        if (slugControl) {
          const slugField = contentTypeData.type.fields.find((field) =>
            [field.apiName, field.id].includes(slugControl.fieldId)
          );
          if (slugField) {
            const slugFieldData = currentFieldsWithIndexedDisplayField[slugField.id];
            const indexedSlugFieldData = alignSlugWithEntryTitle({
              entryTitleData: currentFieldsWithIndexedDisplayField[displayFieldId],
              unindexedTitleData: currentFields[displayFieldId],
              slugFieldData,
              isRequired: slugField.required,
              isEntryTitleLocalized: displayFieldControl.localized,
            });

            if (indexedSlugFieldData) {
              currentFieldsWithIndexedDisplayField[slugField.id] = indexedSlugFieldData;
            }
          }
        }
        try {
          const entry = await currentSpace.createEntry(contentTypeData.id, {
            fields: currentFieldsWithIndexedDisplayField,
          });
          Analytics.track('entry:create', {
            eventOrigin: 'entry-editor__duplicate',
            contentType: contentTypeData.type,
            response: entry.data,
          });
          goToCreatedEntry(entry);
          setOpen(false);
        } catch (error) {
          logger.captureError(error);
          Notification.error('Entry duplication failed');
        }
      },
      onShowDisabledFields: () => {
        const show = (preferences.showDisabledFields = !preferences.showDisabledFields);
        Analytics.track('entry_editor:disabled_fields_visibility_toggled', {
          entryId: entityInfo.id,
          show: show,
        });
        setOpen(false);
      },
      onDelete: () => {
        onDelete.execute();
        setOpen(false);
      },
    };
  }, [
    currentSpace,
    currentSpaceContentTypes,
    editorData.editorInterface.controls,
    entityInfo.contentTypeId,
    entityInfo.id,
    onDelete,
    otDoc,
    preferences,
  ]);

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
            onClick={entryActions.onAdd}
            isDisabled={!canCreateEntry()}
            testId="cf-ui-button-action-add">
            Create new <em>{entityInfo.contentType.name}</em>
          </DropdownListItem>
          <DropdownListItem
            onClick={entryActions.onDuplicate}
            testId="cf-ui-button-action-duplicate"
            isDisabled={!canCreateEntry()}>
            Duplicate
          </DropdownListItem>
          <DropdownListItem onClick={entryActions.onDelete} testId="cf-ui-button-action-delete">
            Delete
          </DropdownListItem>
          <DropdownListItem
            onClick={entryActions.onShowDisabledFields}
            testId="cf-ui-button-action-show-disabled-fields">
            {preferences.showDisabledFields ? `Hide disabled fields` : `Show disabled fields`}
          </DropdownListItem>
        </DropdownList>
      </Dropdown>
    </>
  );
}

EntrySecondaryActions.propTypes = {
  onDelete: PropTypes.shape({
    execute: PropTypes.func,
  }),
  otDoc: PropTypes.shape({
    fields: PropTypes.array,
  }).isRequired,
  editorData: PropTypes.shape({
    editorInterface: PropTypes.shape({
      controls: PropTypes.arrayOf(
        PropTypes.shape({
          widgetId: PropTypes.string,
        }).isRequired
      ).isRequired,
    }).isRequired,
  }).isRequired,
  preferences: PropTypes.shape({
    showDisabledFields: PropTypes.bool,
  }).isRequired,
  entityInfo: PropTypes.shape({
    id: PropTypes.string,
    contentTypeId: PropTypes.string,
    contentType: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
};
