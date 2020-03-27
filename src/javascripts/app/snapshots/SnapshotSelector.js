import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import {
  Dropdown,
  Table,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  TextLink,
  Spinner,
  Paragraph,
  Icon,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import SnapshotStatus from 'app/snapshots/helpers/SnapshotStatus';
import useInfiniteScroll from 'components/shared/useInfiniteScroll';
import useSortableColumns from './useSortableColumns';
import useSnapshots from './useSnapshots';

const styles = {
  textLink: css({
    color: tokens.colorTextDark,
    fontWeight: tokens.fontWeightDemiBold,
    fontSize: tokens.fontSizeL,
    '&:hover': {
      color: tokens.colorTextLightest,
    },
    '&:hover svg': {
      fill: `${tokens.colorTextLightest} !important`,
    },
    '& svg': {
      fill: tokens.colorTextDark,
    },
  }),
  activeRow: css({
    backgroundColor: tokens.colorIceMid,
  }),
  clickableRow: css({
    cursor: 'pointer',
  }),
  headerRow: css({
    '& > th': {
      padding: '0.625rem 1.25rem',
      position: 'relative',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: tokens.colorElementLight,
      },
      '& > svg': {
        position: 'absolute',
        transform: 'translateY(-50%)',
        top: '50%',
      },
    },
  }),
  statusRow: css({
    '& > td': {
      textAlign: 'center',
    },
  }),
  placeholder: css({
    color: tokens.colorTextMid,
  }),
  dropdownContainer: css({
    padding: tokens.spacingL,
    minWidth: '600px',
    maxWidth: '700px',
  }),
  table: css({
    border: 'none',
    '& tr': {
      display: 'table',
      tableLayout: 'fixed',
      width: '100%',
    },
  }),
  tableBody: css({
    display: 'block',
    maxHeight: '45vh',
    overflowY: 'scroll',
  }),
};

const SnapshotSelector = ({ snapshot: activeSnapshot, goToSnapshot, editorData }) => {
  const [isOpen, setOpen] = useState(false);
  const [{ isLoading, snapshots }, { initSnapshots, loadMore, setSnapshots }] = useSnapshots({
    editorData,
  });

  const [sort, sortBy] = useSortableColumns({
    setSnapshots,
    snapshots,
  });

  const onScroll = useInfiniteScroll({
    onScrolledToBottom: loadMore,
  });

  return (
    <Dropdown
      testId="snapshot-selector"
      dropdownContainerClassName={styles.dropdownContainer}
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      toggleElement={
        <TextLink
          testId="snapshot-selector-button"
          aria-label="show-snapshot-list-btn"
          linkType="secondary"
          className={styles.textLink}
          icon="ChevronDown"
          iconPosition="right"
          onClick={() => {
            setOpen(!isOpen);
            initSnapshots();
          }}>
          <RelativeDateTime value={activeSnapshot.sys.createdAt} />
        </TextLink>
      }>
      <Table className={styles.table} testId="snapshot-selector-table">
        <TableHead isSticky>
          <TableRow className={styles.headerRow}>
            <TableCell
              testId="snapshot-selector-table-sort-lastedited"
              onClick={sortBy.lastEdited}
              sorting={sort.order.byLastEdited}>
              Last edited
              {sort.order.byLastEdited && <Icon icon={sort.icon} color="muted" />}
            </TableCell>
            <TableCell
              testId="snapshot-selector-table-sort-editor"
              onClick={sortBy.editor}
              sorting={sort.order.byEditor}>
              Edited by
              {sort.order.byEditor && <Icon icon={sort.icon} color="muted" />}
            </TableCell>
            <TableCell
              testId="snapshot-selector-table-sort-status"
              onClick={sortBy.status}
              sorting={sort.order.byStatus}>
              Status
              {sort.order.byStatus && <Icon icon={sort.icon} color="muted" />}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody
          className={styles.tableBody}
          onScroll={onScroll}
          testId="snapshot-selector-tablebody">
          {snapshots.map((snapshot) => {
            const { sys } = snapshot;
            const isActive = activeSnapshot.sys.id === sys.id;
            return (
              <TableRow
                key={sys.id}
                testId={`snapshot-selector-table-row-${sys.id}`}
                className={isActive ? styles.activeRow : styles.clickableRow}
                onClick={() => {
                  if (!isActive) {
                    setOpen(false);
                    goToSnapshot(snapshot);
                  }
                }}>
                <TableCell>
                  <RelativeDateTime value={sys.createdAt} />
                </TableCell>
                <TableCell>{sys.createdBy.authorName}</TableCell>
                <TableCell>
                  <SnapshotStatus {...sys} />
                </TableCell>
              </TableRow>
            );
          })}
          {isLoading && (
            <TableRow className={styles.statusRow}>
              <TableCell>
                <Spinner />
              </TableCell>
            </TableRow>
          )}
          {!isLoading && snapshots.length < 1 && (
            <TableRow className={styles.statusRow}>
              <TableCell>
                <Paragraph className={styles.placeholder}>No snapshots found.</Paragraph>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Dropdown>
  );
};

SnapshotSelector.propTypes = {
  snapshot: PropTypes.object.isRequired,
  goToSnapshot: PropTypes.func.isRequired,
  editorData: PropTypes.object.isRequired,
};

export default SnapshotSelector;
