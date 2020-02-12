import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  TextLink,
  Table,
  TableCell,
  TableRow,
  TableHead,
  TableBody,
  Heading,
  Paragraph,
  Note,
  SkeletonContainer,
  SkeletonBodyText,
  Workbench
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer';
import FolderIllustration from 'svg/folder-illustration.svg';
import RelativeDateTime from 'components/shared/RelativeDateTime';
import { getEntryTitle } from 'classes/EntityFieldValueHelpers';
import { getOpenAssignedTasksAndEntries } from './helpers';
import StateLink from 'app/common/StateLink';

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
    tasks: [],
    isLoading: true
  };

  componentDidMount = async () => {
    const { spaceId, environmentId, currentUserId } = this.props;
    const [[tasks, entries], spaceUsers] = await Promise.all([
      getOpenAssignedTasksAndEntries(spaceId, environmentId, currentUserId),
      this.props.users.getAll()
    ]);
    const entryTitles = this.getEntryTitles(entries);
    const taskState = tasks.reduce((tasks, task) => {
      if (!entryTitles[task.sys.parentEntity.sys.id]) {
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
        enviromentId: task.sys.environment.sys.id,
        entryId: task.sys.parentEntity.sys.id,
        entryTitle: entryTitles[task.sys.parentEntity.sys.id]
      };
      return [...tasks, newTask];
    }, []);
    this.setState({ tasks: taskState, isLoading: false });
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
              <StateLink
                path="spaces.detail.environment.entries.detail"
                params={{ entryId: task.entryId, environmentId: task.enviromentId }}>
                {({ getHref, onClick }) => (
                  <TextLink icon="Entry" href={getHref()} onClick={onClick}>
                    {task.entryTitle}
                  </TextLink>
                )}
              </StateLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  renderLoadingState = () => (
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
        <TableRow>
          <TableCell className={styles.taskColumn}>
            <SkeletonContainer svgHeight={18}>
              <SkeletonBodyText numberOfLines={1} />
            </SkeletonContainer>
          </TableCell>
          <TableCell>
            <SkeletonContainer svgHeight={18}>
              <SkeletonBodyText numberOfLines={1} />
            </SkeletonContainer>
          </TableCell>
          <TableCell>
            <SkeletonContainer svgHeight={18}>
              <SkeletonBodyText numberOfLines={1} />
            </SkeletonContainer>
          </TableCell>
          <TableCell className={styles.entryColumn}>
            <SkeletonContainer svgHeight={18}>
              <SkeletonBodyText numberOfLines={1} />
            </SkeletonContainer>
          </TableCell>
        </TableRow>
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
          {this.state.isLoading
            ? this.renderLoadingState()
            : this.state.tasks.length
            ? this.renderTable()
            : this.renderEmptyState()}
        </Workbench.Content>
      </Workbench>
    );
  }
}
