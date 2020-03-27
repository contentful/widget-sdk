import React from 'react';
import { render as renderReact, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { forEach } from 'lodash';

import Task from './Task';

// TODO: Move to a mocks folder and use in related tests.
const MOCKS = {};

MOCKS.UserViewData = {
  existingLoadedSpaceUser: {
    isLoading: false,
    key: 'user-id-1',
    label: 'Mike Mitask-title-inputtchell',
    avatarUrl: 'https://mitchell.com/avatar.jpg',
    isRemovedFromSpace: false,
  },
};

const validTask = {
  key: 'task-id-1',
  version: 42,
  body: 'Do something already!',
  assignee: MOCKS.UserViewData.existingLoadedSpaceUser,
  creator: MOCKS.UserViewData.existingLoadedSpaceUser,
  createdAt: '2019-01-10T13:21:40.467Z',
  isDone: false,
  isDraft: false,
  isInEditMode: false,
  validationMessage: null,
  assignableUsersInfo: null,
  canEdit: false,
  canUpdateStatus: false,
};

MOCKS.TaskViewData = {
  valid: validTask,
  validDone: {
    ...validTask,
    isDone: true,
  },
  draft: {
    key: '<<DRAFT-TASK>>',
    version: 0,
    body: '',
    assignee: null,
    creator: null,
    createdAt: null,
    isDone: false,
    isDraft: true,
    isInEditMode: true,
    validationMessage: null,
    assignableUsersInfo: {
      selectedUser: null,
      availableUsers: [MOCKS.UserViewData.existingLoadedSpaceUser],
    },
  },
};

MOCKS.TaskViewData.validCanEdit = {
  ...MOCKS.TaskViewData.valid,
  canEdit: true,
};

MOCKS.TaskViewData.validCanUpdateStatus = {
  ...MOCKS.TaskViewData.valid,
  canUpdateStatus: true,
};

const TEST_IDS = {
  loadingPlaceholder: 'task-loading-placeholder',
  titleInputWrapper: 'task-title-input',
  assigneeSelectorWrapper: 'task-assignee-select',
  statusCheckbox: 'status-checkbox',
  disabledTaskTooltip: 'disabled-task-tooltip',
  saveButton: 'save-task',
  taskActions: 'task-actions',
  editTaskDropdownListItem: 'edit-task',
};

describe('<Task />', () => {
  function render(props) {
    const allProps = {
      viewData: { ...MOCKS.TaskViewData.valid },
      ...props,
    };
    const wrapper = renderReact(<Task {...allProps} />);
    const elems = {};
    forEach(TEST_IDS, (testId, key) => {
      Object.defineProperty(elems, key, {
        get: () => wrapper.queryByTestId(testId),
      });
    });
    Object.defineProperty(elems, 'titleInput', {
      get: () => elems.titleInputWrapper.querySelector('textarea'),
    });
    Object.defineProperty(elems, 'assigneeSelector', {
      get: () => elems.assigneeSelectorWrapper.querySelector('select'),
    });
    return { wrapper, elems, props: allProps };
  }

  describe('edit mode', () => {
    let elems;
    const changeTitle = () => userEvent.type(elems.titleInput, 'some text');
    const changeAssignee = () => {
      // userEvent currently doesn't fire onChange events on select elements
      // See: https://github.com/testing-library/user-event/pull/131
      fireEvent.change(elems.assigneeSelector, {
        target: { value: 'user-id-1' },
      });
    };

    beforeEach(() => {
      ({ elems } = render({ viewData: MOCKS.TaskViewData.draft }));
    });

    it('disables save button initially', () => {
      expect(elems.saveButton).toBeDisabled();
    });

    it('enables save button after typing title and selecting assignee', () => {
      changeTitle();
      changeAssignee();
      expect(elems.saveButton).not.toBeDisabled();
    });

    it('keeps save button disabled when only changing title', () => {
      changeTitle();
      expect(elems.saveButton).toBeDisabled();
    });

    it('keeps save button disabled when only changing assignee', () => {
      changeAssignee();
      expect(elems.saveButton).toBeDisabled();
    });
  });

  describe('"isLoading" prop', () => {
    describe('set to `true`', () => {
      it('renders task loading placeholder', () => {
        const { elems } = render({ isLoading: true });
        expect(elems.loadingPlaceholder).toBeInTheDocument();
      });

      it('does not crash if "viewData" prop does not have any properties', () => {
        const { elems } = render({ isLoading: true, viewData: {} });
        expect(elems.loadingPlaceholder).toBeInTheDocument();
      });
    });

    it('when set to "false", does not render a task placeholder', () => {
      const { elems } = render({ isLoading: false });
      expect(elems.loadingPlaceholder).not.toBeInTheDocument();
    });
  });

  describe('when the task cannot be edited', () => {
    it('does not render the task actions', () => {
      const { elems } = render();
      expect(elems.taskActions).not.toBeInTheDocument();
    });
  });

  describe('when the task is completed', () => {
    it('does not render the edit task dropdown list item', () => {
      const { elems } = render({ viewData: MOCKS.TaskViewData.validDone });
      expect(elems.editTaskDropdownListItem).not.toBeInTheDocument();
    });
  });

  describe('when the task can be edited', () => {
    it('renders the task actions', () => {
      const { elems } = render({
        viewData: MOCKS.TaskViewData.validCanEdit,
      });
      expect(elems.taskActions).toBeInTheDocument();
    });
  });

  describe('when the status cannot be updated', () => {
    it('disables the task checkbox and renders the disabled task tooltip', () => {
      const { elems } = render();
      expect(elems.statusCheckbox).toBeDisabled();
      expect(elems.disabledTaskTooltip).toBeInTheDocument();
    });
  });

  describe('when the status can be updated', () => {
    it('renders the task checkbox as usual', () => {
      const { elems } = render({
        viewData: MOCKS.TaskViewData.validCanUpdateStatus,
      });
      expect(elems.statusCheckbox).not.toBeDisabled();
      expect(elems.disabledTaskTooltip).not.toBeInTheDocument();
    });
  });
});
