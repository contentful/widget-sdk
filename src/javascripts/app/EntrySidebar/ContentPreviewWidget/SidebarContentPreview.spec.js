import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import SidebarContentPreview from './SidebarContentPreview';

describe('entity_editor/Components/SidebarContentPreview', () => {
  const render = (props) => {
    return Enzyme.mount(
      <SidebarContentPreview
        isInitialized={true}
        isPreviewSetup={true}
        isAdmin={false}
        selectedContentPreview={{
          compiledUrl: 'https://contentful.com',
        }}
        contentPreviews={[]}
        onChangeContentPreview={() => {}}
        trackPreviewOpened={() => {}}
        {...props}
      />
    );
  };

  const selectors = {
    previewBtn: '[data-test-id="open-preview"]',
    helpText: '[data-test-id="open-preview-note"]',
    changePreviewBtn: '[data-test-id="change-preview"]',
  };

  it('preview button should be disabled if there is no preview', () => {
    const wrapper = render({
      isPreviewSetup: false,
    });
    expect(wrapper.find(selectors.previewBtn)).toBeDisabled();
  });

  describe('should have notes if there is no preview', () => {
    it('and if user is not admin', () => {
      const wrapper = render({
        isPreviewSetup: false,
      });

      expect(wrapper.find(selectors.helpText)).toHaveText(
        'Content preview is not set up yet. To preview, contact the administrator of this space.'
      );
    });

    it('and if user is admin', () => {
      const wrapper = render({
        isPreviewSetup: false,
        isAdmin: true,
      });

      expect(wrapper.find(selectors.helpText)).toHaveText(
        'No preview is set up for the content type of this entry. Click here to set up a custom content preview.'
      );
    });
  });

  it('tracks click event once the button is clicked', () => {
    const stubs = {
      trackStub: jest.fn(),
    };
    const wrapper = render({
      selectedContentPreview: {
        compiledUrl: 'https://contentful.com',
      },
      trackPreviewOpened: stubs.trackStub,
    });

    wrapper.find(selectors.previewBtn).simulate('click');
    expect(stubs.trackStub).toHaveBeenCalled();
  });

  it('should show dropdown selector only if there 2 or more content previews', () => {
    const wrapper = render({
      contentPreviews: [{ name: 'first' }, { name: 'second' }],
    });
    expect(wrapper.find(selectors.changePreviewBtn)).toExist();
  });
});
