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
import { getEntryTitle } from 'classes/EntityFieldValueHelpers.es6';
import { getOpenAssignedTasks } from './helpers.es6';
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
    getEntries: PropTypes.func.isRequired,
    getContentType: PropTypes.func.isRequired,
    defaultLocaleCode: PropTypes.string.isRequired
  };

  state = {
    tasks: []
  };

  componentDidMount = async () => {
    const [[tasks, entries], spaceUsers] = await Promise.all([
      this.getTasksAndEntries(),
      this.props.users.getAll()
    ]);
    const entryTitles = this.getEntryTitles(entries);
    const taskState = tasks.reduce((tasks, task) => {
      if (!entryTitles[task.sys.reference.sys.id]) {
        // getEntryTitles() should always return a title for a valid entry, even
        // if it's just "Untitled". This gives us a cheap way of detecting
        // whether the entries are visible or not (whether the user has
        // permission or some other bug has rendered the entry missing or
        // inaccessible to the user).
        return tasks;
      }
      const newTask = {
        body: task.body,
        createdBy: spaceUsers.find(user => user.sys.id === task.sys.createdBy.sys.id),
        createdAt: task.sys.createdAt,
        entryId: task.sys.reference.sys.id,
        entryTitle: entryTitles[task.sys.reference.sys.id]
      };
      return [...tasks, newTask];
    }, []);
    this.setState({ tasks: taskState });
  };

  getTasksAndEntries = async () => {
    const { spaceId, currentUserId, getEntries } = this.props;
    const { items: tasks } = await getOpenAssignedTasks(spaceId, currentUserId);
    const { items: entries } = await getEntries({
      'sys.id[in]': tasks.map(item => item.sys.reference.sys.id).join(',')
    });
    return [tasks, entries];
  };

  getEntryTitles = entries => {
    const entryTitles = {};
    const contentTypes = {};
    for (const entry of entries) {
      if (entryTitles[entry.sys.id]) {
        continue;
      }
      const { id } = entry.sys.contentType.sys;
      contentTypes[id] = contentTypes[id] || this.props.getContentType(id);
      entryTitles[entry.sys.id] = this.getEntryTitle(entry, contentTypes[id]);
    }
    return entryTitles;
  };

  getEntryTitle = (entry, contentType) => {
    const fields = _.mapKeys(entry.fields, (_value, key) => {
      // getEntryTitle expects the entry field to be keyed by their internal ID,
      // not their API name. But we're using API data, so we need to convert
      // the field keys before passing them along.
      return _.find(contentType.data.fields, { apiName: key }).id;
    });
    return getEntryTitle({
      entry: { ...entry, fields },
      contentType: contentType.data,
      defaultInternalLocaleCode: this.props.defaultLocaleCode,
      defaultTitle: 'Untilted'
    });
  };

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
