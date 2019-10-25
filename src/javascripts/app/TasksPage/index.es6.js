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
import { getOpenAssignedTasksAndEntries } from './helpers.es6';
import { href } from 'states/Navigator.es6';

const styles = {
  workbenchContent: css({
    padding: tokens.spacingXl
  }),
  note: css({
    marginBottom: tokens.spacingXl
  }),
  taskColumn: css({
    width: '420px'
  }),
  entryColumn: css({
    width: '420px'
  })
};

export default class TasksPage extends Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    currentUserId: PropTypes.string.isRequired,
    environmentId: PropTypes.string.isRequired,
    users: PropTypes.object.isRequired,
    getContentType: PropTypes.func.isRequired,
    defaultLocaleCode: PropTypes.string.isRequired
  };

  state = {
    tasks: []
  };

  componentDidMount = async () => {
    const [[tasks, entries], spaceUsers] = await Promise.all([
      getOpenAssignedTasksAndEntries(this.props.spaceId, this.props.currentUserId),
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
      <Paragraph>You don&apos;t currently have any pending tasks assigned to you</Paragraph>
    </EmptyStateContainer>
  );

  renderTable = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell className={styles.taskColumn}>Task</TableCell>
          <TableCell>Created by</TableCell>
          <TableCell>Assigned at</TableCell>
          <TableCell className={styles.entryColumn}>Appears in</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {this.state.tasks.map((task, index) => (
          <TableRow key={index}>
            <TableCell className={styles.taskColumn}>{task.body}</TableCell>
            <TableCell>{task.createdBy.firstName}</TableCell>
            <TableCell>
              <RelativeDateTime value={task.createdAt} />
            </TableCell>
            <TableCell className={styles.entryColumn}>
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
              These are your pending tasks. An entry can only be published when all its pending
              tasks are resolved.
            </Note>
          )}
          {this.state.tasks.length ? this.renderTable() : this.renderEmptyState()}
        </Workbench.Content>
      </Workbench>
    );
  }
}
