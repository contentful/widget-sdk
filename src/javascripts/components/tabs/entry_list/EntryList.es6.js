/* eslint-disable react/prop-types */
import React from 'react';

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
  TextLink
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

/*

.table(ng-show="hasPage()")
      .table__head
        table
          thead
            tr
              th.th__checkbox-cell.x--large-cell(
                aria-label="cell-display-name"
                ng-if="!context.view.contentTypeId || !displayFieldForFilteredContentType()")
                div
                  label(ng-click="$event.stopPropagation()")
                    input(type="checkbox" cf-selection="entries" ng-click="selection.toggleList(entries, $event)" ng-show="entries.length > 0" tabindex="-1")
                  div
                    | Name
              th.x--medium-cell(
                aria-label="cell-content-type"
                ng-if="!context.view.contentTypeId && !context.view.contentTypeHidden")
                | Content type
              th.x--large-cell(
                aria-label="cell-display-name"
                ng-if="context.view.contentTypeId && displayFieldForFilteredContentType()"
                ng-init="getField=displayFieldForFilteredContentType"
                ng-class="{'x--sortable': fieldIsSortable(getField()), 'x--active-sort': isOrderField(getField())}"
                ng-click="fieldIsSortable(getField()) && orderColumnBy(getField())")
                  div.table__checkbox-cell
                    label(ng-click="$event.stopPropagation()")
                      input(type="checkbox" cf-selection="entries" ng-click="selection.toggleList(entries, $event)" ng-show="entries.length > 0" tabindex="-1")
                    | Name
                    span(ng-show="fieldIsSortable(getField())")
                      i.fa.fa-caret-up(ng-show="context.view.order.direction === 'ascending' && isOrderField(getField())")
                      i.fa.fa-caret-down(ng-show="context.view.order.direction === 'descending' && isOrderField(getField())")
              th.x--small-cell(
                ng-repeat="field in displayedFields track by field.id"
                ng-class="{'x--sortable': fieldIsSortable(field), 'x--active-sort': isOrderField(field)}"
                data-field-id="{{field.id}}"
                ng-click="fieldIsSortable(field) && orderColumnBy(field)")
                | {{field.name}}
                span(ng-show="fieldIsSortable(field)")
                  i.fa.fa-caret-up(ng-show="context.view.order.direction === 'ascending' && isOrderField(field)")
                  i.fa.fa-caret-down(ng-show="context.view.order.direction === 'descending' && isOrderField(field)")
              th.x--small-cell(aria-label="cell-status") 
                .status-header-cell
                  span
                    | Status
                  .view-customizer
                    react-component(
                      ng-show="hasPage()"
                      name="components/tabs/entry_list/ViewCustomizer/index.es6"
                      props="{ hasHiddenFields: hasHiddenFields, displayedFields: displayedFields, hiddenFields: hiddenFields, removeDisplayField: removeDisplayField, addDisplayField: addDisplayField, toggleContentType: toggleContentType, isContentTypeHidden: !context.view.contentTypeId && context.view.contentTypeHidden, updateFieldOrder: updateFieldOrder}"
                    )

      .table__bulk-actions(ng-hide="selection.isEmpty()")
        .workbench-actions(ng-controller="EntryListActionsController")
          .workbench-actions__label
            +pluralize-entity("entry", "selection.size()", "selected: ")

          span.text-link--neutral-emphasis-mid(type="button"
            ng-click="duplicateSelected()"
            ng-show="showDuplicate()"
            aria-label="duplicate")
            | Duplicate
          span.text-link--destructive(type="button"
            ng-show="showDelete()"
            cf-context-menu-trigger
            data-test-id="delete-entry"
            aria-label="delete")
            | Delete
          .delete-confirm(cf-context-menu="bottom")
            p You are about to delete #[+pluralize-entity("entry", "selection.size()")]
            button.btn-caution(type="button" ng-click="deleteSelected()")
              | Delete
            button.btn-secondary-action(type="button")
              | Don't Delete
          span.text-link--neutral-emphasis-mid(type="button"
            ng-click="archiveSelected()"
            ng-show="showArchive()"
            aria-label="archive")
            | Archive
          span.text-link--neutral-emphasis-mid(type="button" 
            ng-click="unarchiveSelected()"
            ng-show="showUnarchive()"
            aria-label="unarchive")
            | Unarchive
          span.text-link--neutral-emphasis-mid(type="button"
            ng-click="unpublishSelected()"
            ng-show="showUnpublish()"
            aria-label="unpublish")
            | Unpublish
          span.text-link--constructive(type="submit"
            ng-click="publishSelected()"
            ng-show="showPublish()"
            aria-label="publish")
            | {{publishButtonName()}}



*/

function SortableTableCell({ fieldName, isSortable, isActiveSort, onClick, direction }) {
  return (
    <TableCell
      className={cn({
        'x--sortable': isSortable,
        'x--active-sort': isActiveSort
      })}
      onClick={() => {
        onClick();
      }}>
      {fieldName}
      {isSortable && isActiveSort && (
        <IconButton
          buttonType="naked"
          iconProps={{
            icon: direction === 'descending' ? 'ArrowDown' : 'ArrowDown'
          }}
        />
      )}
    </TableCell>
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
  actions
}) {
  const hasContentTypeSelected = !!context.view.contentTypeId;
  const displayFieldName = displayFieldForFilteredContentType();

  const isContentTypeVisible = !hasContentTypeSelected && !displayFieldName;
  return (
    <Table>
      <TableHead offsetTop={isEdgeBrowser ? '0px' : '-22px'} isSticky>
        <TableRow>
          {(!hasContentTypeSelected || !displayFieldName) && (
            <TableCell>
              <Checkbox onChange={e => selection.toggleList(entries, e)} />
              Name
            </TableCell>
          )}
          {isContentTypeVisible && <TableCell>Content Type</TableCell>}
          {context.view.contentTypeId && displayFieldForFilteredContentType() && (
            <SortableTableCell
              fieldName="Name"
              isSortable={fieldIsSortable(displayFieldName)}
              isActiveSort={isOrderField(displayFieldName)}
              onClick={() => {
                fieldIsSortable(displayFieldName) && orderColumnBy(displayFieldName);
              }}
              direction={context.view.order.direction}
            />
          )}
          {displayedFields.map(field => {
            return (
              <SortableTableCell
                key={field.id}
                fieldName={field.name}
                isSortable={fieldIsSortable(field)}
                isActiveSort={isOrderField(field)}
                onClick={() => {
                  fieldIsSortable(field) && orderColumnBy(field);
                }}
                direction={context.view.order.direction}
              />
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
          <TableRow>
            <TableCell colSpan="5">
              <span className="f36-margin-right--s">{selection.size()} entries selected:</span>
              {actions.showDuplicate && actions.showDuplicate() && (
                <TextLink
                  className="f36-margin-right--s"
                  linkType="secondary"
                  onClick={() => actions.duplicateSelected()}>
                  Duplicate
                </TextLink>
              )}
              {/* TODO: add confirmation */}
              {actions.showDelete && actions.showDelete() && (
                <TextLink
                  className="f36-margin-right--s"
                  linkType="negative"
                  onClick={() => actions.deleteSelected()}
                  data-test-id="delete-entry">
                  Delete
                </TextLink>
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
                    if (e.target.tagName !== 'INPUT') {
                      onClick(e);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.target.tagName !== 'INPUT') {
                      if (isHotkey(['enter', 'space'], e)) {
                        onClick(e);
                        e.preventDefault();
                      }
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
                      <DisplayField field={field} entry={entry} />
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
