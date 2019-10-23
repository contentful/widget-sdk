import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import {
  TextLink,
  Table,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Heading,
  Paragraph,
  Note
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import FolderIllustration from 'svg/folder-illustration.es6';
import RelativeDateTime from 'components/shared/RelativeDateTime/index.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { href } from 'states/Navigator.es6';

const styles = {
  workbenchContent: css({
    padding: tokens.spacingXl
  }),
  note: css({
    marginBottom: tokens.spacingXl
  })
};

export default class TasksPage extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    currentUserId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    users: PropTypes.object.isRequired,
    defaultLocale: PropTypes.object.isRequired,
    getEntries: PropTypes.func.isRequired,
    getEntryTitle: PropTypes.func.isRequired
  };

  state = {
    tasks: []
  };

  componentDidMount = async () => {
    const { currentUserId, spaceId, users, getEntries } = this.props;

    const endpoint = createSpaceEndpoint(spaceId);
    const getTasks = endpoint(
      {
        method: 'GET',
        path: ['tasks'],
        query: { 'assignedTo.sys.id': currentUserId }
      },
      { 'x-contentful-enable-alpha-feature': 'comments-api,tasks-dashboard' }
    );
    const [{ items: tasks }, spaceUsers] = await Promise.all([getTasks, users.getAll()]);
    const { items: entries } = await getEntries({
      'sys.id[in]': tasks.map(item => item.sys.reference.sys.id).join(',')
    });

    const entryTitles = this.getEntryTitles(entries);

    this.setState({
      tasks: tasks.map(task => ({
        body: task.body,
        createdBy: spaceUsers.find(user => user.sys.id === task.sys.createdBy.sys.id),
        createdAt: task.sys.createdAt,
        entryId: task.sys.reference.sys.id,
        entryTitle: entryTitles[task.sys.reference.sys.id]
      }))
    });
  };

  getEntryTitles = entries => {
    const entryTitles = {};
    for (const entry of entries) {
      const { id } = entry.sys;
      entryTitles[id] = entryTitles[id] || this.getEntryTitle(entry);
    }
    return entryTitles;
  };

  getEntryTitle = entry =>
    this.props.getEntryTitle({
      getContentTypeId: () => entry.sys.contentType.sys.id,
      data: entry
    });

  renderEmptyState = () => (
    <EmptyStateContainer data-test-id="tasks-empty-state">
      <div className={defaultSVGStyle}>
        <FolderIllustration />
      </div>
      <Heading>No pending tasks</Heading>
      <Paragraph>You have no pending tasks</Paragraph>
    </EmptyStateContainer>
  );

  renderTable = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Task</TableCell>
          <TableCell>Created by</TableCell>
          <TableCell>Assigned at</TableCell>
          <TableCell>Appears in</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {this.state.tasks.map((task, index) => (
          <TableRow key={index}>
            <TableCell>{task.body}</TableCell>
            <TableCell>{task.createdBy.firstName}</TableCell>
            <TableCell>
              <RelativeDateTime value={task.createdAt} />
            </TableCell>
            <TableCell>
              <TextLink
                icon="Entry"
                href={href({
                  path: ['spaces', 'detail', 'entries', 'detail'],
                  params: {
                    entryId: task.entryId
                  }
                })}>
                {task.entryTitle}
              </TextLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  render() {
    return (
      <Workbench>
        <Workbench.Header title="Pending tasks"></Workbench.Header>
        <Workbench.Content className={styles.workbenchContent}>
          {!!this.state.tasks.length && (
            <Note className={styles.note}>
              Your pending tasks appear here. You must resolve these tasks in order for the related
              entry to become publishable (TODO: replace with actual message).
            </Note>
          )}
          {this.state.tasks.length ? this.renderTable() : this.renderEmptyState()}
        </Workbench.Content>
      </Workbench>
    );
  }
}
