import React from 'react';

import cn from 'classnames';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  IconButton
} from '@contentful/forma-36-react-components';

import ViewCustomizer from 'components/tabs/entry_list/ViewCustomizer/index.es6';

import { isEdge } from 'utils/browser.es6';
const isEdgeBrowser = isEdge();

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


      .table__body
        table
          tbody
            tr.x--multiline(ng-repeat="entry in entries track by entry.getId()"
              ng-init="linkToEntry = '^.detail({ entryId: entry.getId() })'"
              ng-class="{'x--highlight': selection.isSelected(entry)}"
              ui-sref="{{linkToEntry}}")
              td.x--large-cell.td__checkbox-cell(aria-label="cell-display-name")
                div
                  label(ng-click="$event.stopPropagation()")
                    input(type="checkbox" cf-selection="entry" tabindex="-1" aria-label="cell-select" ng-click="selection.toggle(entry, $event);")
                  a(ui-sref="{{linkToEntry}}" ng-click="$event.stopPropagation();") {{entryTitle(entry)}}
              +td.x--medium-cell(
                aria-label="cell-content-type"
                ui-sref="{{linkToEntry}}"
                ng-show="!context.view.contentTypeId && !context.view.contentTypeHidden")
                | {{contentTypeName(entry) || '&nbsp;'}}
              +td.x--small-cell(
                ui-sref="{{linkToEntry}}"
                ng-repeat="field in displayedFields track by field.id")
                cf-field-display
              +td.x--small-cell(
                ui-sref="{{linkToEntry}}"
                aria-label="cell-status")
                  <react-component name="@contentful/forma-36-react-components/Tag" props="entityStatus.getProps(entry)"></react-component>


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
  updateFieldOrder
}) {
  console.log('sss', context.view.contentTypeId && displayFieldForFilteredContentType());
  const hasContentTypeSelected = !!context.view.contentTypeId;
  const displayField = displayFieldForFilteredContentType();
  const t = !hasContentTypeSelected || !displayField;
  const t1 = !hasContentTypeSelected && !displayField;
  return (
    <Table>
      <TableHead offsetTop={isEdgeBrowser ? '0px' : '-22px'} isSticky>
        <TableRow>
          {t && (
            <TableCell>
              <Checkbox />
              Name
            </TableCell>
          )}
          {t1 && <TableCell>Content Type</TableCell>}
          {context.view.contentTypeId && displayFieldForFilteredContentType() && (
            <SortableTableCell
              fieldName="Name"
              isSortable={fieldIsSortable(displayField)}
              isActiveSort={isOrderField(displayField)}
              onClick={() => {
                fieldIsSortable(displayField) && orderColumnBy(displayField);
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
      </TableHead>
      <TableBody />
    </Table>
  );
}
