import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import cn from 'classnames';
import tokens from '@contentful/forma-36-tokens';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  SkeletonRow,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Button,
} from '@contentful/forma-36-react-components';
import { isEdge } from 'utils/browser';
import useSelectedEntities from 'components/tabs/useSelectedEntities';
import SecretiveLink from 'components/shared/SecretiveLink';
import StateLink from 'app/common/StateLink';
import ReleaseDisplayField from './ReleaseDisplayField';
import { findValidationErrorForEntity } from './utils';

const styles = {
  checkboxCell: css({
    width: tokens.spacingXl,
    zIndex: tokens.zIndexDefault,
    verticalAlign: 'middle',
    outline: 'none',
    '& > div': {
      marginRight: tokens.spacingS,
    },
  }),
  table: css({
    marginBottom: tokens.spacing4Xl,
  }),
  tableHead: css({
    zIndex: tokens.zIndexWorkbenchHeader,
  }),
  fieldWrapper: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '& > span': {
      alignItems: 'center',
    },
  }),
  highlight: css({
    backgroundColor: tokens.colorIceMid,
  }),
  tableRow: css({
    cursor: 'pointer',
  }),
  flexCenter: css({
    display: 'flex !important',
    alignItems: 'center',
  }),
  headingTableCell: css({
    paddingLeft: 0,
  }),
  tableCell: css({
    verticalAlign: 'middle',
    padding: 0,
    outline: 'none',
  }),
  actionTableHeader: css({
    zIndex: tokens.zIndexDefault,
  }),
  borderCollapse: css({
    borderCollapse: 'collapse',
  }),
  erroredListItem: css({
    border: `2px solid ${tokens.colorRedBase}`,
  }),
};

const CheckboxCell = ({ name, checked, onClick }) => {
  return (
    <TableCell className={styles.checkboxCell} onClick={onClick}>
      <Checkbox labelText="" id={name} testId={name} name={name} checked={checked} />
    </TableCell>
  );
};

CheckboxCell.propTypes = {
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const DropdownCell = ({ id, handleEntityDelete, entity }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Dropdown
      className={styles.dropdown}
      isOpen={isDropdownOpen}
      position="bottom-right"
      onClose={() => setIsDropdownOpen(false)}
      toggleElement={
        <Button
          buttonType="naked"
          data-test-id={`${id}_remove-release-ddl`}
          icon="MoreHorizontal"
          className={styles.dropdownButton}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        />
      }>
      <DropdownList>
        <DropdownListItem
          testId="delete-entity"
          onClick={() => {
            handleEntityDelete(entity);
            setIsDropdownOpen(false);
          }}>
          Remove from release
        </DropdownListItem>
      </DropdownList>
    </Dropdown>
  );
};

DropdownCell.propTypes = {
  id: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
};

const ReleaseTable = ({
  displayedFields,
  entities,
  defaultLocale,
  isLoading,
  handleEntityDelete,
  validationErrors,
}) => {
  const [{ allSelected }, { isSelected, toggleSelected, toggleAllSelected }] = useSelectedEntities({
    entities,
  });

  const columnCount = displayedFields.length + 2;
  return (
    <Table className={cn(styles.table, { [styles.borderCollapse]: validationErrors.length })}>
      <TableHead offsetTop={isEdge() ? '0px' : '-20px'} isSticky className={styles.tableHead}>
        <TableRow>
          <CheckboxCell
            visible
            name="select-all"
            checked={allSelected}
            onClick={toggleAllSelected}
          />
          {displayedFields.map(({ id, name, onClick, direction }) => {
            return (
              <TableCell
                className={styles.headingTableCell}
                key={id}
                testId={id}
                onClick={onClick}
                direction={direction}
                aria-label={name}>
                <span className={styles.fieldWrapper} title={name}>
                  {name}
                </span>
              </TableCell>
            );
          })}
          <TableCell className={styles.actionTableHeader} testId="action">
            <span>Action</span>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <SkeletonRow rowCount={10} columnCount={columnCount} />
        ) : (
          entities.map((entity, index) => {
            const {
              sys: { id: entityId, type },
            } = entity;
            const entityIsSelected = isSelected(entity);
            const entityType = type.toLowerCase();
            const pathType = entityType === 'entry' ? 'entries' : 'assets';
            const validated = findValidationErrorForEntity(entityId, validationErrors);
            return (
              <StateLink
                path={['spaces', 'detail', pathType, 'detail']}
                params={{ [`${entityType}Id`]: entityId }}
                trackingEvent={entityType === 'entry' ? 'search:entry_clicked' : null}
                trackParams={{ index }}
                key={entityId}>
                {({ onClick, getHref }) => {
                  const href = getHref();
                  return (
                    <TableRow
                      tabIndex="0"
                      key={`${entityId}-${index}`}
                      className={cn(styles.tableRow, {
                        [styles.highlight]: entityIsSelected,
                        [styles.visibilityHidden]: !entities.length,
                        [styles.erroredListItem]: validated,
                      })}
                      testId={`${entityType}-row`}>
                      <CheckboxCell
                        name={`select-${entityId}`}
                        checked={entityIsSelected}
                        onClick={() => toggleSelected(entity)}
                      />
                      {displayedFields.map((field) => {
                        const { id } = field;
                        const uniqueId = `${entityId}_${id}`;
                        return (
                          <TableCell
                            key={uniqueId}
                            className={styles.tableCell}
                            testId={id}
                            onClick={onClick}>
                            <SecretiveLink
                              href={href}
                              className={cn(styles.flexCenter, styles.fieldWrapper)}>
                              <ReleaseDisplayField
                                field={id}
                                entity={entity}
                                defaultLocale={defaultLocale}
                                validationError={validated}
                              />
                            </SecretiveLink>
                          </TableCell>
                        );
                      })}
                      <TableCell className={styles.tableCell} testId="action">
                        <DropdownCell
                          id={`${entityType}_${index}`}
                          handleEntityDelete={handleEntityDelete}
                          entity={entity}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }}
              </StateLink>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};

ReleaseTable.propTypes = {
  displayedFields: PropTypes.array.isRequired,
  entities: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  defaultLocale: PropTypes.object.isRequired,
  handleEntityDelete: PropTypes.func.isRequired,
  validationErrors: PropTypes.array,
};

export default ReleaseTable;
