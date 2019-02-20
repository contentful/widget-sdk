import React from 'react';
import Enzyme from 'enzyme';
import PublicationWidget from './PublicationWidget.es6';

const createCommand = props => ({
  isDisabled: () => false,
  isAvailable: () => true,
  inProgress: () => false,
  execute: () => {},
  ...props
});

describe('app/EntrySidebar/PublicationWidget', () => {
  const render = (props, renderFn = Enzyme.mount) => {
    const wrapper = renderFn(<PublicationWidget isSaving={false} {...props} />);
    return { wrapper };
  };

  it('shows proper buttons for "Draft" status', () => {
    const stubs = {
      onPublishClick: jest.fn()
    };
    const { wrapper } = render({
      status: 'draft',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isRestricted: () => false,
        label: 'Publish',
        targetStateId: 'published',
        execute: stubs.onPublishClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        })
      ]
    });

    const selectors = {
      statusState: '[data-test-id="entity-state"]',
      stateText: '.entity-sidebar__state',
      dateText: '.entity-sidebar__last-saved',
      publishBtn: '.primary-publish-button[data-test-id="change-state-published"]',
      secondaryArchiveBtn:
        '[data-test-id="change-state-menu"] [data-test-id="change-state-archived"]',
      secondaryDropdownTrigger: '[data-test-id="change-state-menu-trigger"]',
      revertButton: '[data-test-id="discard-changed-button"]'
    };

    expect(wrapper.find(selectors.statusState).prop('data-state')).toEqual('draft');
    expect(wrapper.find(selectors.stateText)).toHaveText('Status: Draft');
    expect(wrapper.find(selectors.dateText)).toHaveText('Last saved 01/14/2018');

    expect(wrapper.find(selectors.publishBtn)).toExist();
    expect(wrapper.find(selectors.publishBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.publishBtn)).toHaveText('Publish');
    wrapper.find(selectors.publishBtn).simulate('click');
    expect(stubs.onPublishClick).toHaveBeenCalled();

    expect(wrapper.find(selectors.revertButton)).not.toExist();

    expect(wrapper.find(selectors.secondaryArchiveBtn)).not.toExist();

    wrapper.find(selectors.secondaryDropdownTrigger).simulate('click');

    expect(wrapper.find(selectors.secondaryArchiveBtn)).toExist();
    expect(wrapper.find(selectors.secondaryArchiveBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.secondaryArchiveBtn)).toHaveText('Archive');
  });

  it('shows proper buttons for "Pending" status', () => {
    const stubs = {
      onPublishClick: jest.fn()
    };
    const { wrapper } = render({
      status: 'changes',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isRestricted: () => false,
        label: 'Publish changes',
        targetStateId: 'published',
        execute: stubs.onPublishClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        }),
        createCommand({
          label: 'Unpublish',
          targetStateId: 'draft'
        })
      ]
    });

    const selectors = {
      statusState: '[data-test-id="entity-state"]',
      stateText: '.entity-sidebar__state',
      dateText: '.entity-sidebar__last-saved',
      publishBtn: '.primary-publish-button[data-test-id="change-state-published"]',
      secondaryArchiveBtn:
        '[data-test-id="change-state-menu"] [data-test-id="change-state-archived"]',
      secondaryUnpublishBtn:
        '[data-test-id="change-state-menu"] [data-test-id="change-state-draft"]',
      secondaryDropdownTrigger: '[data-test-id="change-state-menu-trigger"]'
    };

    expect(wrapper.find(selectors.statusState).prop('data-state')).toEqual('changes');
    expect(wrapper.find(selectors.stateText)).toHaveText('Status: Published (pending changes)');
    expect(wrapper.find(selectors.dateText)).toHaveText('Last saved 01/14/2018');

    expect(wrapper.find(selectors.publishBtn)).toExist();
    expect(wrapper.find(selectors.publishBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.publishBtn)).toHaveText('Publish changes');
    wrapper.find(selectors.publishBtn).simulate('click');
    expect(stubs.onPublishClick).toHaveBeenCalled();

    expect(wrapper.find(selectors.secondaryArchiveBtn)).not.toExist();
    expect(wrapper.find(selectors.secondaryUnpublishBtn)).not.toExist();

    wrapper.find(selectors.secondaryDropdownTrigger).simulate('click');

    expect(wrapper.find(selectors.secondaryArchiveBtn)).toExist();
    expect(wrapper.find(selectors.secondaryArchiveBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.secondaryArchiveBtn)).toHaveText('Archive');

    expect(wrapper.find(selectors.secondaryUnpublishBtn)).toExist();
    expect(wrapper.find(selectors.secondaryUnpublishBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.secondaryUnpublishBtn)).toHaveText('Unpublish');
  });

  it('shows proper buttons for "Published" status', () => {
    const stubs = {
      revertOnClick: jest.fn()
    };
    const { wrapper } = render({
      status: 'published',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isAvailable: () => false,
        isRestricted: () => false
      }),
      revert: createCommand({
        isAvailable: () => true,
        execute: stubs.revertOnClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        }),
        createCommand({
          label: 'Unpublish',
          targetStateId: 'draft'
        })
      ]
    });

    const selectors = {
      statusState: '[data-test-id="entity-state"]',
      stateText: '.entity-sidebar__state',
      dateText: '.entity-sidebar__last-saved',
      publishBtn: '.primary-publish-button[data-test-id="change-state-published"]',
      secondaryArchiveBtn:
        '[data-test-id="change-state-menu"] [data-test-id="change-state-archived"]',
      secondaryUnpublishBtn:
        '[data-test-id="change-state-menu"] [data-test-id="change-state-draft"]',
      secondaryDropdownTrigger: '[data-test-id="change-state-menu-trigger"]',
      revertButton: '[data-test-id="discard-changed-button"]',
      actionRestrictionNote: '[data-test-id="action-restriction-note"]'
    };

    expect(wrapper.find(selectors.statusState).prop('data-state')).toEqual('published');
    expect(wrapper.find(selectors.stateText)).toHaveText('Status: Published');
    expect(wrapper.find(selectors.dateText)).toHaveText('Last saved 01/14/2018');

    expect(wrapper.find(selectors.publishBtn)).not.toExist();

    expect(wrapper.find(selectors.secondaryArchiveBtn)).not.toExist();
    expect(wrapper.find(selectors.secondaryUnpublishBtn)).not.toExist();

    expect(wrapper.find(selectors.revertButton)).toExist();
    wrapper.find(selectors.revertButton).simulate('click');
    expect(stubs.revertOnClick).toHaveBeenCalled();

    expect(wrapper.find(selectors.secondaryDropdownTrigger)).toHaveText('Change status');
    wrapper.find(selectors.secondaryDropdownTrigger).simulate('click');

    expect(wrapper.find(selectors.secondaryArchiveBtn)).toExist();
    expect(wrapper.find(selectors.secondaryArchiveBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.secondaryArchiveBtn)).toHaveText('Archive');

    expect(wrapper.find(selectors.secondaryUnpublishBtn)).toExist();
    expect(wrapper.find(selectors.secondaryUnpublishBtn)).not.toBeDisabled();
    expect(wrapper.find(selectors.actionRestrictionNote)).not.toExist();
    expect(wrapper.find(selectors.secondaryUnpublishBtn)).toHaveText('Unpublish');
  });

  it('shows the action restrtiction note for publish action', () => {
    const stubs = {
      onPublishClick: jest.fn()
    };
    const { wrapper } = render({
      status: 'draft',
      updatedAt: '2018-01-14T15:15:49.230Z',
      primary: createCommand({
        isRestricted: () => true,
        isDisabled: () => true,
        label: 'Publish',
        targetStateId: 'published',
        execute: stubs.onPublishClick
      }),
      secondary: [
        createCommand({
          label: 'Archive',
          targetStateId: 'archived'
        })
      ]
    });

    const selectors = {
      statusState: '[data-test-id="entity-state"]',
      actionRestrictionNote: '[data-test-id="action-restriction-note"]',
      publishBtn: '[data-test-id="change-state-published"]'
    };

    expect(wrapper.find(selectors.publishBtn)).toExist();
    expect(wrapper.find(selectors.publishBtn)).toBeDisabled();
    expect(wrapper.find(selectors.actionRestrictionNote)).toExist();
    expect(wrapper.find(selectors.actionRestrictionNote)).toHaveText(
      'You do not have permission to publish.'
    );
  });
});
