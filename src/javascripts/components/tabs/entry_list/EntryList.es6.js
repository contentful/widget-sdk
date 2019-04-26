/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import pluralize from 'pluralize';

import cn from 'classnames';
import { truncate } from 'lodash';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton,
  TextLink,
  ModalConfirm,
  Paragraph
} from '@contentful/forma-36-react-components';

import isHotkey from 'is-hotkey';
import StateLink from 'app/common/StateLink.es6';

import ViewCustomizer from './ViewCustomizer/index.es6';
import DisplayField from './DisplayField.es6';

import { EntityStatusTag } from 'components/shared/EntityStatusTag.es6';

import { isEdge } from 'utils/browser.es6';
const isEdgeBrowser = isEdge();

import { getModule } from 'NgRegistry.es6';
const spaceContext = getModule('spaceContext');
const EntityState = getModule('data/CMA/EntityState.es6');

// TODO This function is called repeatedly from the template.
// Unfortunately, 'publishedCTs.get' has the side effect of
// fetching the CT if it was not found. This results in problems
// when we switch the space but this directive is still active. We
// request a content type from the _new_ space which does not
// exist.
// The solution is to separate `entryTitle()` and similar
// functions from the space context.
const entryTitle = entry => {
  let entryTitle = spaceContext.entryTitle(entry);
  const length = 130;
  if (entryTitle.length > length) {
    entryTitle = truncate(entryTitle, length);
  }
  return entryTitle;
};

const contentTypeName = entry => {
  const ctId = entry.getContentTypeId();
  const ct = spaceContext.publishedCTs.get(ctId);
  if (ct) {
    return ct.getName();
  } else {
    return '';
  }
};

function SortableTableCell({ children, isSortable, isActiveSort, onClick, direction }) {
  return (
    <TableCell
      className={cn({
        'x--sortable': isSortable,
        'x--active-sort': isActiveSort
      })}
      onClick={e => {
        if (isTargetInput(e)) {
          return;
        }
        onClick();
      }}>
      {children}
      {isSortable && isActiveSort && (
        <IconButton
          buttonType="naked"
          iconProps={{
            icon: direction === 'ascending' ? 'ArrowDown' : 'ArrowUp'
          }}
        />
      )}
    </TableCell>
  );
}

function DeleteEntryConfirm({ itemsCount, onCancel, onConfirm }) {
  return (
    <ModalConfirm
      title={`Delete ${pluralize('entry', itemsCount, true)}`}
      isShown={true}
      intent="negative"
      confirmLabel="Delete"
      cancelLabel="Cancel"
      confirmTestId="delete-entry-confirm"
      cancelTestId="delete-entry-cancel"
      onCancel={onCancel}
      onConfirm={onConfirm}>
      <Paragraph>Do you really want to delete {pluralize('entry', itemsCount, true)}?</Paragraph>
    </ModalConfirm>
  );
}

function BulkActionsRow({ colSpan, actions, selection }) {
  const [isConfirmVisibile, setConfirmVisibility] = useState(false);
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <span className="f36-margin-right--s">
          {pluralize('entry', selection.size(), true)} selected:
        </span>
        {actions.showDuplicate && actions.showDuplicate() && (
          <TextLink
            className="f36-margin-right--s"
            linkType="secondary"
            onClick={() => actions.duplicateSelected()}>
            Duplicate
          </TextLink>
        )}

        {actions.showDelete && actions.showDelete() && (
          <React.Fragment>
            <TextLink
              className="f36-margin-right--s"
              linkType="negative"
              onClick={() => setConfirmVisibility(true)}
              data-test-id="delete-entry">
              Delete
            </TextLink>
            {isConfirmVisibile && (
              <DeleteEntryConfirm
                itemsCount={selection.size()}
                onConfirm={() => {
                  actions.deleteSelected();
                  setConfirmVisibility(false);
                }}
                onCancel={() => setConfirmVisibility(false)}
              />
            )}
          </React.Fragment>
        )}
        {actions.showArchive && actions.showArchive() && (
          <TextLink
            className="f36-margin-right--s"
            linkType="secondary"
            onClick={() => actions.archiveSelected()}>
            Archive
          </TextLink>
        )}
        {actions.showUnarchive && actions.showUnarchive() && (
          <TextLink
            className="f36-margin-right--s"
            linkType="secondary"
            onClick={() => actions.unarchiveSelected()}>
            Unarchive
          </TextLink>
        )}
        {actions.showPublish && actions.showPublish() && (
          <TextLink
            className="f36-margin-right--s"
            linkType="positive"
            onClick={() => actions.publishSelected()}>
            {actions.publishButtonName()}
          </TextLink>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function EntryList({
  context,
  displayedFields = [],
  displayFieldForFilteredContentType,
  fieldIsSortable,
  isOrderField,
  orderColumnBy,
  hasHiddenFields,
  hiddenFields,
  removeDisplayField,
  addDisplayField,
  toggleContentType,
  updateFieldOrder,
  selection,
  entries = [],
  actions,
  entryCache,
  assetCache
}) {
  const hasContentTypeSelected = !!context.view.contentTypeId;
  const displayFieldName = displayFieldForFilteredContentType();

  const isContentTypeVisible = !hasContentTypeSelected && !context.view.contentTypeHidden;
  const selectAll = (
    <Checkbox
      className="f36-margin-left--s"
      onChange={e => {
        selection.toggleList(entries, e);
      }}
    />
  );

  const columnLength =
    // if no ct selected 2 cols, otherwise 1
    (hasContentTypeSelected ? 1 : 2) +
    // all displayed fields
    displayedFields.length +
    // status column
    1;
  return (
    <Table>
      <TableHead offsetTop={isEdgeBrowser ? '0px' : '-22px'} isSticky>
        <TableRow>
          {hasContentTypeSelected ? (
            <SortableTableCell
              isSortable={fieldIsSortable(displayFieldName)}
              isActiveSort={isOrderField(displayFieldName)}
              onClick={() => {
                fieldIsSortable(displayFieldName) && orderColumnBy(displayFieldName);
              }}
              direction={context.view.order.direction}>
              {selectAll}
              Name
            </SortableTableCell>
          ) : (
            <React.Fragment>
              <TableCell>
                {selectAll}
                Name
              </TableCell>
              {isContentTypeVisible && <TableCell>Content Type</TableCell>}
            </React.Fragment>
          )}

          {displayedFields.map(field => {
            return (
              <SortableTableCell
                key={field.id}
                isSortable={fieldIsSortable(field)}
                isActiveSort={isOrderField(field)}
                onClick={() => {
                  fieldIsSortable(field) && orderColumnBy(field);
                }}
                direction={context.view.order.direction}>
                {field.name}
              </SortableTableCell>
            );
          })}
          <TableCell>
            Status
            <ViewCustomizer
              hasHiddenFields={hasHiddenFields}
              displayedFields={displayedFields}
              hiddenFields={hiddenFields}
              removeDisplayField={removeDisplayField}
              addDisplayField={addDisplayField}
              toggleContentType={toggleContentType}
              isContentTypeHidden={!context.view.contentTypeId && context.view.contentTypeHidden}
              updateFieldOrder={updateFieldOrder}
            />
          </TableCell>
        </TableRow>
        {!selection.isEmpty() && (
          <BulkActionsRow colSpan={columnLength} actions={actions} selection={selection} />
        )}
      </TableHead>
      <TableBody>
        {entries.map(entry => (
          <StateLink to="^.detail" params={{ entryId: entry.getId() }} key={entry.getId()}>
            {({ onClick }) => {
              return (
                <TableRow
                  tabIndex="0"
                  onClick={e => {
                    if (isTargetInput(e)) {
                      return;
                    }
                    onClick(e);
                  }}
                  onKeyDown={e => {
                    if (isTargetInput(e)) {
                      return;
                    }
                    if (isHotkey(['enter', 'space'], e)) {
                      onClick(e);
                      e.preventDefault();
                    }
                  }}
                  className={cn({
                    'ctf-ui-cursor--pointer': true,
                    'x--highlight': selection.isSelected(entry)
                  })}>
                  <TableCell>
                    <Checkbox
                      checked={selection.isSelected(entry)}
                      onChange={e => {
                        selection.toggle(entry, e);
                        e.preventDefault();
                      }}
                    />
                    {entryTitle(entry)}
                  </TableCell>
                  {isContentTypeVisible && <TableCell>{contentTypeName(entry)}</TableCell>}
                  {displayedFields.map(field => (
                    <TableCell key={field.id}>
                      <DisplayField
                        field={field}
                        entry={entry}
                        entryCache={entryCache}
                        assetCache={assetCache}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <EntityStatusTag
                      statusLabel={EntityState.stateName(EntityState.getState(entry.data.sys))}
                    />
                  </TableCell>
                </TableRow>
              );
            }}
          </StateLink>
        ))}
      </TableBody>
    </Table>
  );
}
function isTargetInput(e) {
  return e.target.tagName === 'INPUT';
}
