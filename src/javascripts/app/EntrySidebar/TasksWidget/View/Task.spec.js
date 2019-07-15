import React from 'react';
import { render as renderReact, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-dom/extend-expect';
import { forEach } from 'lodash';

import Task from './Task.es6';

// TODO: Move to a mocks folder and use in related tests.
const MOCKS = {};
MOCKS.UserViewData = {
  existingLoadedSpaceUser: {
    isLoading: false,
    key: 'user-id-1',
    label: 'Mike Mitask-title-inputtchell',
    avatarUrl: 'https://mitchell.com/avatar.jpg',
    isRemovedFromSpace: false
  }
};
MOCKS.TaskViewData = {
  valid: {
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
    assignableUsersInfo: null
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
      availableUsers: [MOCKS.UserViewData.existingLoadedSpaceUser]
    }
  }
};

const TEST_IDS = {
  loadingPlaceholder: 'task-loading-placeholder',
  titleInputWrapper: 'task-title-input',
  assigneeSelectorWrapper: 'task-assignee-select',
  saveButton: 'save-task'
};

describe('<Task />', () => {
  function render(props) {
    const allProps = {
      viewData: { ...MOCKS.TaskViewData.valid },
      ...props
    };
    const wrapper = renderReact(<Task {...allProps} />);
    const elems = {};
    forEach(TEST_IDS, (testId, key) => {
      Object.defineProperty(elems, key, {
        get: () => wrapper.queryByTestId(testId)
      });
    });
    Object.defineProperty(elems, 'titleInput', {
      get: () => elems.titleInputWrapper.querySelector('textarea')
    });
    Object.defineProperty(elems, 'assigneeSelector', {
      get: () => elems.assigneeSelectorWrapper.querySelector('select')
    });
    return { wrapper, elems, props: allProps };
  }

  afterEach(cleanup);

  describe('edit mode', () => {
    let elems;
    const changeTitle = () => userEvent.type(elems.titleInput, 'some text');
    const changeAssignee = () => {
      // userEvent currently doesn't fire onChange events on select elements
      // See: https://github.com/testing-library/user-event/pull/131
      fireEvent.change(elems.assigneeSelector, {
        target: { value: 'user-id-1' }
      });
    };

    beforeEach(() => {
      const viewData = MOCKS.TaskViewData.draft;
      elems = render({ viewData }).elems;
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
});
