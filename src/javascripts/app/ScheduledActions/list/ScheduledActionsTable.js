import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@contentful/forma-36-react-components';
import isHotkey from 'is-hotkey';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import moment from 'moment';
import { stateName, getState } from 'data/CMA/EntityState';
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paragraph,
  Icon,
} from '@contentful/forma-36-react-components';
import { EntityStatusTag } from 'components/shared/EntityStatusTag';
import { getEntryTitle } from 'classes/EntityFieldValueHelpers';
import { ActionPerformerName } from 'core/components/ActionPerformerName';

import SecretiveLink from 'components/shared/SecretiveLink';
import EntityStateLink from 'app/common/EntityStateLink';

const styles = {
  jobRow: css({
    cursor: 'pointer',
  }),
  statusTag: css({
    display: 'flex',
  }),
  statusTagIcon: css({
    marginRight: tokens.spacingXs,
  }),
  table: css({
    tableLayout: 'fixed',
  }),
  scheduledTimeTableHeader: css({
    width: '260px',
  }),
  statusTransition: css({
    display: 'flex',
    alignItems: 'center',
  }),
  description: css({
    marginBottom: tokens.spacingS,
  }),
  tableHeaderCell: css({
    whiteSpace: 'nowrap',
  }),
};

function StatusTag({ job }) {
  const typeByStatus = {
    failed: 'negative',
    succeeded: 'positive',
    scheduled: 'primary',
    canceled: 'secondary',
  };

  const getStatusLabel = () => {
    switch (job.sys.status) {
      case 'failed':
        return `${job.action} failed`;
      case 'succeeded':
        return `${job.action}ed`;
      default:
        return job.action;
    }
  };
  const StatusIcon = () => {
    switch (job.sys.status) {
      case 'failed':
        return <Icon className={styles.statusTagIcon} icon="ErrorCircle" color="negative" />;
      case 'succeeded':
        return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="positive" />;
      case 'canceled':
        return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="secondary" />;
      default:
        return null;
    }
  };

  return (
    <Tag className={styles.statusTag} tagType={typeByStatus[job.sys.status]}>
      {StatusIcon()}
      {getStatusLabel()}
    </Tag>
  );
}

StatusTag.propTypes = {
  job: PropTypes.object,
};

function StatusTransition({ entry }) {
  return (
    <span className={styles.statusTransition} color="secondary">
      <EntityStatusTag statusLabel={stateName(getState(entry.sys))} />
      <Icon color="secondary" icon="ChevronRight" />
      <Tag tagType="positive">Published</Tag>
    </span>
  );
}

StatusTransition.propTypes = {
  entry: PropTypes.object,
};

function ScheduledActionWithExsitingEntryRow({
  job,
  user,
  entry,
  contentType,
  defaultLocale,
  showStatusTransition,
}) {
  const entryTitle = getEntryTitle({
    entry,
    contentType,
    internallocaleCode: defaultLocale.internal_code,
    defaultInternalLocaleCode: defaultLocale.internal_code,
    defaultTitle: 'Untilted',
  });

  return (
    <EntityStateLink entity={entry}>
      {({ onClick, getHref }) => (
        <TableRow
          className={styles.jobRow}
          data-test-id="scheduled-job"
          tabIndex="0"
          onClick={(e) => {
            onClick(e);
          }}
          onKeyDown={(e) => {
            if (isHotkey(['enter', 'space'], e)) {
              onClick(e);
              e.preventDefault();
            }
          }}>
          <TableCell>
            {moment.utc(job.scheduledFor.datetime).local().format('ddd, MMM Do, YYYY - hh:mm A')}
          </TableCell>
          <TableCell>
            {' '}
            <SecretiveLink href={getHref()}>{entryTitle}</SecretiveLink>
          </TableCell>
          <TableCell>{contentType.name}</TableCell>
          <TableCell>
            <ActionPerformerName link={user} />
          </TableCell>
          <TableCell>
            {showStatusTransition ? <StatusTransition entry={entry} /> : <StatusTag job={job} />}
          </TableCell>
        </TableRow>
      )}
    </EntityStateLink>
  );
}

ScheduledActionWithExsitingEntryRow.propTypes = {
  job: PropTypes.object,
  user: PropTypes.object,
  entry: PropTypes.object,
  contentType: PropTypes.object,
  defaultLocale: PropTypes.object,
  showStatusTransition: PropTypes.bool,
};

function ScheduledActionWithMissingEntryRow({ job, user }) {
  return (
    <TableRow data-test-id="scheduled-job">
      <TableCell>
        {moment.utc(job.scheduledFor.datetime).local().format('ddd, MMM Do, YYYY - hh:mm A')}
      </TableCell>
      <TableCell>Entry missing or inaccessible</TableCell>
      <TableCell />
      <TableCell>
        <ActionPerformerName link={user} />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

ScheduledActionWithMissingEntryRow.propTypes = {
  job: PropTypes.object,
  user: PropTypes.object,
};

export default class ScheduledActionsTable extends Component {
  static propTypes = {
    description: PropTypes.string,
    jobs: PropTypes.array, // Todo: Define propTypes when api clear
    contentTypesData: PropTypes.object,
    entriesData: PropTypes.object,
    showStatusTransition: PropTypes.bool,
    defaultLocale: PropTypes.object,
  };

  render() {
    const {
      jobs,
      description,
      entriesData,
      contentTypesData,
      showStatusTransition,
      defaultLocale,
    } = this.props;
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
          <TableBody>
            {jobs.map((job) => {
              const user = job.sys.createdBy;

              const entry = entriesData[job.entity.sys.id];

              if (entry) {
                const contentType = contentTypesData[entry.sys.contentType.sys.id];
                return (
                  <ScheduledActionWithExsitingEntryRow
                    key={job.sys.id}
                    job={job}
                    user={user}
                    entry={entry}
                    contentType={contentType}
                    defaultLocale={defaultLocale}
                    showStatusTransition={showStatusTransition}
                  />
                );
              } else {
                return (
                  <ScheduledActionWithMissingEntryRow key={job.sys.id} job={job} user={user} />
                );
              }
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}
