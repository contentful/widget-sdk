import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@contentful/forma-36-react-components';
import isHotkey from 'is-hotkey';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import moment from 'moment';
import { getState } from 'data/CMA/EntityState';
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
import { getEntryTitle, getAssetTitle } from 'classes/EntityFieldValueHelpers';
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

function StatusTransition({ entity }) {
  return (
    <span className={styles.statusTransition} color="secondary">
      <EntityStatusTag statusLabel={getState(entity.sys)} />
      <Icon color="secondary" icon="ChevronRight" />
      <Tag tagType="positive">Published</Tag>
    </span>
  );
}

StatusTransition.propTypes = {
  entity: PropTypes.object,
};

function ScheduledActionWithExsitingEntityRow({
  job,
  user,
  entity,
  contentType,
  defaultLocale,
  showStatusTransition,
}) {
  const entityTypeToTitle = {
    Entry: getEntryTitle({
      entry: entity,
      contentType,
      internalLocaleCode: defaultLocale.internal_code,
      defaultInternalLocaleCode: defaultLocale.internal_code,
      defaultTitle: 'Untitled',
    }),
    Release: entity.title,
    Asset: getAssetTitle({
      asset: entity,
      internalLocaleCode: defaultLocale.internal_code,
      defaultInternalLocaleCode: defaultLocale.internal_code,
      defaultTitle: 'Untitled',
    }),
  };

  return (
    <EntityStateLink entity={entity}>
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
            <SecretiveLink href={getHref()}>{entityTypeToTitle[entity.sys.type]}</SecretiveLink>
          </TableCell>
          <TableCell>{contentType && contentType.name}</TableCell>
          <TableCell>
            <ActionPerformerName link={user} />
          </TableCell>
          <TableCell>
            {showStatusTransition ? <StatusTransition entity={entity} /> : <StatusTag job={job} />}
          </TableCell>
        </TableRow>
      )}
    </EntityStateLink>
  );
}

ScheduledActionWithExsitingEntityRow.propTypes = {
  job: PropTypes.object,
  user: PropTypes.object,
  entity: PropTypes.object,
  contentType: PropTypes.object,
  defaultLocale: PropTypes.object,
  showStatusTransition: PropTypes.bool,
};

function ScheduledActionWithMissingEntityRow({ job, user }) {
  return (
    <TableRow data-test-id="scheduled-job">
      <TableCell>
        {moment.utc(job.scheduledFor.datetime).local().format('ddd, MMM Do, YYYY - hh:mm A')}
      </TableCell>
      <TableCell>Entity missing or inaccessible</TableCell>
      <TableCell />
      <TableCell>
        <ActionPerformerName link={user} />
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

ScheduledActionWithMissingEntityRow.propTypes = {
  job: PropTypes.object,
  user: PropTypes.object,
};

export default class ScheduledActionsTable extends Component {
  static propTypes = {
    description: PropTypes.string,
    jobs: PropTypes.array, // Todo: Define propTypes when api clear
    contentTypesData: PropTypes.object,
    entitiesById: PropTypes.object,
    showStatusTransition: PropTypes.bool,
    defaultLocale: PropTypes.object,
  };

  render() {
    const {
      jobs,
      description,
      entitiesById,
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

              const entity = entitiesById[job.entity.sys.id];

              if (entity) {
                const contentType =
                  entity.sys.contentType && contentTypesData[entity.sys.contentType.sys.id];
                return (
                  <ScheduledActionWithExsitingEntityRow
                    key={job.sys.id}
                    job={job}
                    user={user}
                    entity={entity}
                    contentType={contentType}
                    defaultLocale={defaultLocale}
                    showStatusTransition={showStatusTransition}
                  />
                );
              } else {
                return (
                  <ScheduledActionWithMissingEntityRow key={job.sys.id} job={job} user={user} />
                );
              }
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}
