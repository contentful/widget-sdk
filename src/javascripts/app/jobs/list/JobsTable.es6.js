import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tag } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import moment from 'moment';
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paragraph,
  Icon
} from '@contentful/forma-36-react-components';

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
  })
};
export default class JobsTable extends Component {
  static propTypes = {
    description: PropTypes.string,
    jobs: PropTypes.array // Todo: Define propTypes when api clear
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

  render() {
    const { jobs, description } = this.props;
    return (
      <div>
        <Paragraph className="f36-margin-bottom--s">{description}</Paragraph>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell className={styles.scheduledTimeTableHeader}>Scheduled Time</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Scheduled By</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          {jobs && (
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell>
                    {moment
                      .utc(job.scheduledAt)
                      .local()
                      .format('ddd, MMM Do, YYYY - hh:mm A')}
                  </TableCell>
                  <TableCell>{job.actionPayload.name}</TableCell>
                  <TableCell>{job.actionPayload.contentTypeName}</TableCell>
                  <TableCell>{job.sys.createdBy.name}</TableCell>
                  <TableCell>{this.renderTag(job)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    );
  }
}
