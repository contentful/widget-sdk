import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@contentful/forma-36-react-components';
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

const styles = {
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

  tagTypeByStatus = {
    error: 'negative',
    success: 'positive',
    pending: 'primary',
    cancelled: 'secondary'
  };

  renderTag = job => {
    const StatusIcon = () => {
      switch (job.sys.status) {
        case 'error':
          return <Icon className={styles.statusTagIcon} icon="ErrorCircle" color="negative" />;
        case 'success':
          return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="positive" />;
        case 'cancelled':
          return <Icon className={styles.statusTagIcon} icon="CheckCircle" color="secondary" />;
        default:
          return null;
      }
    };

    return (
      <Tag className={styles.statusTag} tagType={this.tagTypeByStatus[job.sys.status]}>
        {StatusIcon()}
        {job.actionType}
      </Tag>
    );
  };

  renderStatusTransition = entry => (
    <span className={styles.statusTransition} color="secondary">
      <EntityStatusTag statusLabel={stateName(getState(entry.sys))} />
      <Icon color="secondary" icon="ChevronRight" />
      <Tag tagType="positive">Published</Tag>
    </span>
  );

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
              const user = usersData[job.sys.createdBy.sys.id];
              const entry = entriesData[job.sys.entity.sys.id];
              const contentType = contentTypesData[entry.sys.contentType.sys.id];

              const entryTitle = getEntryTitle({
                entry,
                contentType,
                internallocaleCode: defaultLocale.internal_code,
                defaultInternalLocaleCode: defaultLocale.internal_code,
                defaultTitle: 'Untilted'
              });

              return (
                <TableRow key={job.sys.id} data-test-id="scheduled-job">
                  <TableCell>
                    {moment
                      .utc(job.scheduledAt)
                      .local()
                      .format('ddd, MMM Do, YYYY - hh:mm A')}
                  </TableCell>
                  <TableCell>{entryTitle}</TableCell>
                  <TableCell>{contentType.name}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>
                    {showStatusTransition
                      ? this.renderStatusTransition(entry)
                      : this.renderTag(job)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}
