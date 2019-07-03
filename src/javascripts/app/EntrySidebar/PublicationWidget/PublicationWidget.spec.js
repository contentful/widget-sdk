import React from 'react';
import { render as renderReact, cleanup, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { mapValues, toArray } from 'lodash';
import PublicationWidget from './PublicationWidget.es6';

const createCommand = props => ({
  isDisabled: () => false,
  isAvailable: () => true,
  isRestricted: () => false,
  inProgress: () => false,
  execute: jest.fn(),
  ...props
});

const commandTemplates = {
  unavailable: {
    label: 'Unavailable command',
    targetStateId: 'unavailable-command',
    isAvailable: () => false
  },
  enabled: {
    label: 'Enabled command',
    targetStateId: 'enabled-command'
  },
  disabled: {
    label: 'Disabled command',
    targetStateId: 'disabled-command',
    isDisabled: () => true
  },
  restricted: {
    label: 'Restricted command',
    targetStateId: 'restricted-command',
    isDisabled: () => true,
    isRestricted: () => true
  }
};

const createCommands = () => mapValues(commandTemplates, createCommand);

const TEST_IDS = {
  dateText: 'last-saved',
  publishedStatus: 'entity-state',
  revertButton: 'discard-changed-button',
  primaryActionButton: 'primary-action-change-state',
  primaryActionRestrictionNote: 'action-restriction-note',
  secondaryActionsDropdown: 'change-state-menu-trigger'
};
const select = mapValues(TEST_IDS, testId => elem => elem.queryByTestId(testId));
select.actionByCommand = (elem, { targetStateId }) =>
  elem.queryByTestId(`change-state-${targetStateId}`);

const render = props => {
  const allProps = {
    status: 'draft',
    updatedAt: '2042-01-01T00:00:01.000Z',
    secondary: [],
    ...props
  };
  const wrapper = renderReact(<PublicationWidget isSaving={false} {...allProps} />);
  return { wrapper, props: allProps };
};

describe('app/EntrySidebar/PublicationWidget', () => {
  afterEach(cleanup);

  it('shows last changed date', () => {
    const { wrapper } = render({
      updatedAt: '1985-05-25T12:34:56.000Z'
    });
    expect(select.dateText(wrapper)).toHaveTextContent('Last saved 05/25/1985');
  });

  describe('with "draft" status', () => {
    const props = {
      status: 'draft'
    };

    itRendersStatus(props, {
      expectedText: 'Status: Draft'
    });
    itCanRenderRevert(props);
    itRendersPrimaryActions(props);
    itCanRenderSecondaryActions(props);
  });

  describe('with "changes" status', () => {
    const props = {
      status: 'changes'
    };

    itRendersStatus(props, {
      expectedText: 'Status: Published (pending changes)'
    });
    itCanRenderRevert(props);
    itRendersPrimaryActions(props);
    itCanRenderSecondaryActions(props);
  });

  describe('with "archived" status', () => {
    const props = {
      status: 'archived'
    };

    itRendersStatus(props, {
      expectedText: 'Status: Archived'
    });
    itCanRenderRevert(props);
    itRendersPrimaryActions(props);
    itCanRenderSecondaryActions(props);
  });

  describe('with "published" status', () => {
    const props = {
      status: 'published'
    };

    itRendersStatus(props, {
      expectedText: 'Status: Published'
    });
    itCanRenderRevert(props);
    itCanRenderSecondaryActions(props);

    // TODO: Instead of all this status depending logic, we should probably just
    //  simply not pass a primary command or set its `isAvailable()` to `false`
    //  and not render the primary action accordingly.
    it('hides primary action button', () => {
      const { wrapper } = render({
        ...props,
        primary: createCommand()
      });

      expect(select.primaryActionButton(wrapper)).not.toBeInTheDocument();
    });
  });
});

function itRendersStatus(props, { expectedText }) {
  test('renders status', () => {
    const { wrapper, props: allProps } = render(props);
    expect(select.publishedStatus(wrapper)).toHaveTextContent(expectedText);
    expect(select.publishedStatus(wrapper)).toHaveAttribute('data-state', allProps.status);
  });
}

function itCanRenderRevert(props) {
  test('does not render revert action if "revert" prop is not defined', () => {
    const { wrapper } = render(props);
    expect(select.revertButton(wrapper)).not.toBeInTheDocument();
  });

  test('renders revert action if "revert" prop is defined', () => {
    const revertCommand = createCommand({
      label: 'Reeeeevert!!!', // This is ignored as shown in the label assertion.
      isAvailable: () => true
    });
    const { wrapper } = render({
      ...props,
      revert: revertCommand
    });
    const revertButtonElem = select.revertButton(wrapper);
    expect(revertButtonElem).toBeInTheDocument();
    expect(revertButtonElem).not.toHaveTextContent(revertCommand.label);
    expect(revertButtonElem).toHaveTextContent('Discard changes');
    fireEvent.click(revertButtonElem);
    expect(revertCommand.execute).toHaveBeenCalled();
  });
}

function itRendersPrimaryActions(props) {
  itRendersPrimaryAction(props, 'enabled', { expectClickable: true });
  itRendersPrimaryAction(props, 'disabled', { expectClickable: false });
  itRendersPrimaryAction(props, 'restricted', {
    expectClickable: false,
    restrictedText: 'You do not have permission to restricted command.'
  });
}

function itRendersPrimaryAction(props, commandKey, { expectClickable, restrictedText = false }) {
  describe(`${commandKey} primary action`, () => {
    let wrapper, command;

    beforeEach(() => {
      command = createCommands()[commandKey];
      if (!command) throw new Error(`No command for key ${commandKey}`);
      wrapper = render({
        ...props,
        primary: command
      }).wrapper;
    });

    it('renders button', () => {
      expectPrimaryButton(wrapper, {
        text: command.label,
        isDisabled: command.isDisabled(),
        restriction: restrictedText
      });
    });

    it(`${expectClickable ? 'handles' : 'prevents'} button click`, () => {
      fireEvent.click(select.primaryActionButton(wrapper));
      expectClickable
        ? expect(command.execute).toHaveBeenCalled()
        : expect(command.execute).not.toHaveBeenCalled();
    });
  });
}

function itCanRenderSecondaryActions(props) {
  describe('secondary actions', () => {
    let wrapper, commands, elems;

    const selectCommandElems = () =>
      mapValues(commands, command => select.actionByCommand(wrapper, command));

    beforeEach(() => {
      commands = createCommands();
      wrapper = render({
        ...props,
        secondary: toArray(commands)
      }).wrapper;
      elems = selectCommandElems();
    });

    it('are hidden within dropdown', () => {
      expect.assertions(4);
      toArray(elems).forEach(elem => expect(elem).not.toBeInTheDocument());
    });

    describe('when opening the secondary actions dropdown', () => {
      beforeEach(() => {
        fireEvent.click(select.secondaryActionsDropdown(wrapper));
        elems = selectCommandElems();
      });

      // TODO: Unavailable actions being rendered seems like a bug.
      it.skip('does not render unavailable action', () => {
        expect(elems.unavailable).toBeInTheDocument();
      });

      it('renders available, enabled action', () => {
        expect(elems.enabled).toBeInTheDocument();
        expect(elems.enabled).toHaveTextContent(commands.enabled.label);
        expectDisabled({ key: 'enabled', isDisabled: false });
      });

      // TODO: Fix bug! Disable button for disabled actions
      it.skip('renders disabled action', () => {
        expect(elems.disabled).toBeInTheDocument();
        expect(elems.disabled).toHaveTextContent(commands.disabled.label);
        expectDisabled({ key: 'disabled', isDisabled: true });
      });

      // TODO: Fix bug! Disable button for restricted actions.
      it.skip('renders disabled restricted action', () => {
        expect(elems.restricted).toBeInTheDocument();
        expect(elems.restricted).toHaveTextContent(commands.restricted.label);
        expectDisabled({ key: 'restricted', isDisabled: true });
      });
    });

    function expectDisabled({ key, isDisabled }) {
      const actionStub = commands[key].execute;
      const actionElem = elems[key].querySelector('button');
      expect(actionStub).toBeCalledTimes(0);
      fireEvent.click(actionElem);
      expect(actionStub).toBeCalledTimes(isDisabled ? 0 : 1);
    }
  });
}

function expectPrimaryButton(wrapper, { text, isDisabled, restriction = false }) {
  const elem = select.primaryActionButton(wrapper);
  expect(elem).toBeInTheDocument();
  expect(elem).toHaveTextContent(text);
  isDisabled ? expect(elem).toBeDisabled() : expect(elem).not.toBeDisabled();

  const note = select.primaryActionRestrictionNote(wrapper);
  if (restriction) {
    expect(note).toBeInTheDocument();
    expect(note).toHaveTextContent(restriction);
  } else {
    expect(note).not.toBeInTheDocument();
  }
}
