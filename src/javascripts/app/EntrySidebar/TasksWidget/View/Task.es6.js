import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  CardActions,
  DropdownList,
  DropdownListItem,
  Form,
  Notification,
  Option,
  SelectField,
  TabFocusTrap,
  TextField,
  Tooltip,
  SkeletonContainer,
  SkeletonBodyText,
  Spinner
} from '@contentful/forma-36-react-components';
import Visible from 'components/shared/Visible/index.es6';
import { cx } from 'emotion';
import moment from 'moment';
import isHotKey from 'is-hotkey';
import TaskDeleteDialog from './TaskDeleteDialog.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import { TaskViewData } from '../ViewData/TaskViewData.es6';
import { taskStyles as styles } from './styles.es6';

export default class Task extends React.Component {
  static propTypes = {
    viewData: PropTypes.shape(TaskViewData),
    isLoading: PropTypes.bool,
    onEdit: PropTypes.func,
    onCancel: PropTypes.func,
    onSave: PropTypes.func,
    onDeleteTask: PropTypes.func,
    onStatusChange: PropTypes.func
  };

  state = {
    isExpanded: false,
    pendingChanges: {},
    isUpdating: false
  };

  componentDidUpdate(prevProps) {
    const { isInEditMode, validationMessage } = this.props.viewData;
    if (
      !isInEditMode &&
      validationMessage &&
      validationMessage !== prevProps.viewData.validationMessage
    ) {
      // We don't have a place on the actual task card to show a deletion error.
      Notification.error(validationMessage);
    }
    if (isInEditMode !== prevProps.viewData.isInEditMode) {
      this.setState({ pendingChanges: {} });
    }
  }

  handleTaskKeyDown = event => {
    if (isHotKey('enter', event)) {
      this.handleTaskExpand();
    }
  };

  handleTaskExpand = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }));
  };

  handleEditClick = event => {
    event.stopPropagation();
    this.props.onEdit();
  };

  addChange(change) {
    this.setState({ pendingChanges: { ...this.state.pendingChanges, ...change } });
  }

  getChangedValue() {
    const { pendingChanges } = this.state;
    const { viewData } = this.props;
    return {
      body: viewData.body,
      assigneeKey: viewData.assignee && viewData.assignee.key,
      isDone: viewData.isDone,
      ...pendingChanges
    };
  }

  handleBodyUpdate = event => {
    this.addChange({ body: event.target.value });
  };

  handleAssigneeUpdate = event => {
    this.addChange({ assigneeKey: event.target.value });
  };

  handleSubmit = () => {
    this.props.onSave(this.getChangedValue());
  };

  handleCancelEdit = event => {
    event.stopPropagation();
    this.props.onCancel();
  };

  handleStatusChange = () => {
    this.setState({ isUpdating: true });
    const newViewData = {
      ...this.getChangedValue(),
      isDone: !this.props.viewData.isDone
    };
    this.props.onStatusChange(newViewData, () => this.setState({ isUpdating: false }));
  };

  handleDeleteClick = async event => {
    event.stopPropagation();
    return ModalLauncher.open(({ isShown, onClose }) => (
      <TaskDeleteDialog
        key={Date.now()}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => {
          this.props.onDeleteTask();
          onClose(true);
        }}
      />
    ));
  };

  renderAvatar(user) {
    const tooltip = user.isLoading
      ? 'Loading...'
      : user.isRemovedFromSpace
      ? 'User was removed from this space'
      : `Assigned to ${user.label}`;
    return (
      <Tooltip content={tooltip} place="left">
        <img src={user.avatarUrl} className={styles.avatar} onClick={this.handleTaskExpand} />
      </Tooltip>
    );
  }

  renderActions = () => {
    // TODO: Check roles/permissions before rendering actions
    return (
      <CardActions className={cx(styles.actions, this.state.isExpanded && styles.actionsVisible)}>
        <DropdownList>
          <DropdownListItem onClick={this.handleEditClick}>Edit task</DropdownListItem>
          <DropdownListItem onClick={event => this.handleDeleteClick(event)}>
            Delete task
          </DropdownListItem>
        </DropdownList>
      </CardActions>
    );
  };

  renderDetails = () => {
    const { isExpanded, isUpdating } = this.state;
    const { body, creator, createdAt, isDone, assignee } = this.props.viewData;

    return (
      <React.Fragment>
        <div className={styles.checkboxWrapper}>
          {isUpdating ? (
            <Spinner size="small" className={styles.taskLoadingSpinner} />
          ) : (
            <input
              type="checkbox"
              checked={isDone}
              onChange={event => this.handleStatusChange(event)}
            />
          )}
        </div>
        <div
          className={cx(styles.body, isExpanded && styles.bodyExpanded)}
          onClick={this.handleTaskExpand}>
          {body}
          <Visible if={isExpanded}>
            <div className={styles.meta}>
              Created{' '}
              <Visible if={createdAt}>
                <time
                  dateTime={moment(createdAt, moment.ISO_8601).toISOString()}
                  title={moment(createdAt, moment.ISO_8601).format('LLLL')}
                  className={styles.timestamp}>
                  {moment(createdAt, moment.ISO_8601).fromNow()}
                </time>{' '}
              </Visible>
              by {creator.label}
            </div>
          </Visible>
        </div>
        <div className={styles.avatarWrapper}>
          {assignee && this.renderAvatar(assignee)}
          {this.renderActions()}
        </div>
      </React.Fragment>
    );
  };

  renderEditForm = () => {
    const { body, isDraft, validationMessage } = this.props.viewData;
    const bodyLabel = isDraft ? 'Create task' : 'Edit task';
    const ctaLabel = isDraft ? 'Create task' : 'Save changes';
    const ctaContext = isDraft ? 'primary' : 'positive';
    const characterLimit = 3000;

    return (
      <Form spacing="condensed" onClick={e => e.stopPropagation()} className={styles.editForm}>
        <TextField
          name="body"
          id="body"
          testId="task-title-input"
          labelText={bodyLabel}
          textarea
          value={body}
          onBlur={event => this.handleBodyUpdate(event)}
          textInputProps={{ rows: 4, autoFocus: true, maxLength: characterLimit }}
          validationMessage={validationMessage}
        />
        {this.renderAssigneeSelector()}
        <div className={styles.editActions}>
          <Button
            testId="save-task"
            buttonType={ctaContext}
            className={styles.editSubmit}
            onClick={() => this.handleSubmit()}
            size="small">
            {ctaLabel}
          </Button>
          <Button buttonType="muted" onClick={event => this.handleCancelEdit(event)} size="small">
            Cancel
          </Button>
        </div>
      </Form>
    );
  };

  renderAssigneeSelector() {
    const EMPTY = '<<EMPTY>>';
    const { assignableUsersInfo } = this.props.viewData;
    const { availableUsers, selectedUser } = assignableUsersInfo;

    const currentKey = selectedUser ? selectedUser.key : EMPTY;
    const isCurrentUserRemoved = selectedUser && selectedUser.isRemovedFromSpace;

    return (
      <SelectField
        name="assignee"
        id="assignee"
        testId="task-assignee-select"
        labelText="Assign to"
        value={currentKey}
        onChange={this.handleAssigneeUpdate}>
        {currentKey === EMPTY && (
          <Option disabled key={EMPTY} value={EMPTY}>
            Please select a user
          </Option>
        )}
        {isCurrentUserRemoved && (
          <Option key={currentKey} value={currentKey}>
            Unknown user (removed from space)
          </Option>
        )}
        {availableUsers.map(({ key, label }) => {
          return (
            <Option key={key} value={key}>
              {label}
            </Option>
          );
        })}
      </SelectField>
    );
  }

  renderLoadingState() {
    return (
      <div className={cx(styles.task, styles.taskLoading)}>
        <SkeletonContainer svgHeight={18}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </div>
    );
  }

  renderTask() {
    const { isInEditMode } = this.props.viewData;

    return (
      <div
        className={cx(styles.task, isInEditMode && styles.taskHasEditForm)}
        onKeyDown={this.handleTaskKeyDown}
        tabIndex={0}>
        <TabFocusTrap className={styles.tabFocusTrap}>
          {isInEditMode ? this.renderEditForm() : this.renderDetails()}
        </TabFocusTrap>
      </div>
    );
  }

  render() {
    const { isLoading } = this.props;

    return (
      <React.Fragment>{isLoading ? this.renderLoadingState() : this.renderTask()}</React.Fragment>
    );
  }
}
