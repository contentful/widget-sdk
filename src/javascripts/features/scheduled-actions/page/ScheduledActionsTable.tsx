import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paragraph,
} from '@contentful/forma-36-react-components';

import {
  EntryProps,
  AssetProps,
  LocaleProps,
  ScheduledActionProps,
} from 'contentful-management/types';
import { ContentType } from 'core/services/SpaceEnvContext/types';
import { Release } from '@contentful/types';
import {
  ScheduledActionWithExsitingEntityRow,
  ScheduledActionWithMissingEntityRow,
} from './ScheduledActionsTableRow';

const styles = {
  table: css({
    tableLayout: 'fixed',
  }),
  scheduledTimeTableHeader: css({
    width: '260px',
  }),
  description: css({
    marginBottom: tokens.spacingS,
  }),
  tableHeaderCell: css({
    whiteSpace: 'nowrap',
  }),
};

type ScheduledActionsTableProps = {
  description: string;
  scheduledActions: ScheduledActionProps[];
  contentTypesById: Record<string, ContentType>;
  entitiesById: Record<string, EntryProps | AssetProps | Release>;
  showStatusTransition?: boolean;
  defaultLocale: LocaleProps;
};

const ScheduledActionsTable = ({
  scheduledActions,
  description,
  entitiesById,
  contentTypesById,
  showStatusTransition = false,
  defaultLocale,
}: ScheduledActionsTableProps) => {
  const TableRows = scheduledActions.map((scheduledAction) => {
    const user = scheduledAction.sys.createdBy;

    const entity = entitiesById[scheduledAction.entity.sys.id];

    if (entity) {
      const entityContentType = (entity as EntryProps).sys.contentType;
      const contentType = contentTypesById[entityContentType?.sys.id];
      return (
        <ScheduledActionWithExsitingEntityRow
          key={scheduledAction.sys.id}
          scheduledAction={scheduledAction}
          user={user}
          entity={entity}
          contentType={contentType}
          defaultLocale={defaultLocale}
          showStatusTransition={showStatusTransition}
        />
      );
    } else {
      return (
        <ScheduledActionWithMissingEntityRow
          key={scheduledAction.sys.id}
          scheduledAction={scheduledAction}
          user={user}
        />
      );
    }
  });

  return (
    <div>
      <Paragraph className={styles.description}>{description}</Paragraph>
      <Table className={styles.table} data-test-id="jobs-table">
        <TableHead>
          <TableRow>
            <TableCell className={styles.scheduledTimeTableHeader}>Scheduled Time</TableCell>
            <TableCell>Name</TableCell>
            <TableCell className={styles.tableHeaderCell}>Content Type</TableCell>
            <TableCell className={styles.tableHeaderCell}>Scheduled By</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{TableRows}</TableBody>
      </Table>
    </div>
  );
};

export { ScheduledActionsTable };
