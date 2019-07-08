import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@contentful/forma-36-react-components';
import isHotkey from 'is-hotkey';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import moment from 'moment';
import { stateName, getState } from 'data/CMA/EntityState.es6';
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paragraph,
  Icon
} from '@contentful/forma-36-react-components';
import { EntityStatusTag } from 'components/shared/EntityStatusTag.es6';
import { getEntryTitle } from 'classes/EntityFieldValueHelpers.es6';
import StateLink from 'app/common/StateLink.es6';
import SecretiveLink from 'components/shared/SecretiveLink.es6';

const styles = {
  jobRow: css({
    cursor: 'pointer'
  }),
  statusTag: css({
    display: 'flex'
  }),
  statusTagIcon: css({
    marginRight: tokens.spacingXs
  }),
  table: css({
    tableLayout: 'fixed'
  }),
  scheduledTimeTableHeader: css({
    width: '260px'
  }),
  statusTransition: css({
    display: 'flex',
    alignItems: 'center'
  })
};

function StatusTag({ job }) {
  const typeByStatus = {
    failed: 'negative',
    done: 'positive',
    pending: 'primary',
    cancelled: 'secondary'
  };

  const getStatusLabel = () => {
    switch (job.sys.status) {
      case 'failed':
        return `${job.action} failed`;
      case 'done':
        return `${job.action}ed`;
      default:
        return job.action;
    }
  };
  const StatusIcon = () => {
    switch (job.sys.status) {
      case 'failed':
        return <Icon className={styles.statusTagIcon} icon="ErrorCircle" color="negative" />;
      case 'done':
        return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="positive" />;
      case 'cancelled':
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
  job: PropTypes.object
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
  entry: PropTypes.object
};

function JobWithExsitingEntryRow({
  job,
  user,
  entry,
  contentType,
  defaultLocale,
  showStatusTransition
}) {
  const entryTitle = getEntryTitle({
    entry,
    contentType,
    internallocaleCode: defaultLocale.internal_code,
    defaultInternalLocaleCode: defaultLocale.internal_code,
    defaultTitle: 'Untilted'
  });

  return (
    <StateLink to="spaces.detail.entries.detail" params={{ entryId: entry.sys.id }}>
      {({ onClick, getHref }) => (
        <TableRow
          className={styles.jobRow}
          key={job.sys.id}
          data-test-id="scheduled-job"
          tabIndex="0"
          onClick={e => {
            onClick(e);
          }}
          onKeyDown={e => {
            if (isHotkey(['enter', 'space'], e)) {
              onClick(e);
              e.preventDefault();
            }
          }}>
          <TableCell>
            {moment
              .utc(job.scheduledAt)
              .local()
              .format('ddd, MMM Do, YYYY - hh:mm A')}
          </TableCell>
          <TableCell>
            {' '}
            <SecretiveLink href={getHref()}>{entryTitle}</SecretiveLink>
          </TableCell>
          <TableCell>{contentType.name}</TableCell>
          <TableCell>{user.firstName}</TableCell>
          <TableCell>
            {showStatusTransition ? <StatusTransition entry={entry} /> : <StatusTag job={job} />}
          </TableCell>
        </TableRow>
      )}
    </StateLink>
  );
}

JobWithExsitingEntryRow.propTypes = {
  job: PropTypes.object,
  user: PropTypes.object,
  entry: PropTypes.object,
  contentType: PropTypes.object,
  defaultLocale: PropTypes.object,
  showStatusTransition: PropTypes.bool
};

function JobWithMissingEntryRow({ job, user }) {
  return (
    <TableRow key={job.sys.id} data-test-id="scheduled-job">
      <TableCell>
        {moment
          .utc(job.scheduledAt)
          .local()
          .format('ddd, MMM Do, YYYY - hh:mm A')}
      </TableCell>
      <TableCell>Entry missing or inaccessible</TableCell>
      <TableCell />
      <TableCell>{user.firstName}</TableCell>
      <TableCell />
    </TableRow>
  );
}

JobWithMissingEntryRow.propTypes = {
  job: PropTypes.object,
  user: PropTypes.object
};

export default class JobsTable extends Component {
  static propTypes = {
    description: PropTypes.string,
    jobs: PropTypes.array, // Todo: Define propTypes when api clear
    usersData: PropTypes.object,
    contentTypesData: PropTypes.object,
    entriesData: PropTypes.object,
    showStatusTransition: PropTypes.bool,
    defaultLocale: PropTypes.object
  };

  render() {
    const {
      jobs,
      description,
      usersData,
      entriesData,
      contentTypesData,
      showStatusTransition,
      defaultLocale
    } = this.props;
    return (
      <div>
        <Paragraph className="f36-margin-bottom--s">{description}</Paragraph>
        <Table className={styles.table} data-test-id="jobs-table">
          <TableHead>
            <TableRow>
              <TableCell className={styles.scheduledTimeTableHeader}>Scheduled Time</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Scheduled By</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(job => {
              const user = usersData[job.sys.scheduledBy.sys.id];

              const entry = entriesData[job.sys.entity.sys.id];

              if (entry) {
                const contentType = contentTypesData[entry.sys.contentType.sys.id];
                return (
                  <JobWithExsitingEntryRow
                    job={job}
                    user={user}
                    entry={entry}
                    contentType={contentType}
                    defaultLocale={defaultLocale}
                    showStatusTransition={showStatusTransition}
                  />
                );
              } else {
                return <JobWithMissingEntryRow job={job} user={user} />;
              }
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}
