import React from 'react';
import Enzyme from 'enzyme';
import SidebarContentPreview from './SidebarContentPreview.es6';

jest.mock('LazyLoader', () => ({ get: () => Promise.resolve({}) }), { virtual: true });

describe('entity_editor/Components/SidebarContentPreview.es6', () => {
  const render = props => {
    return Enzyme.mount(
      <SidebarContentPreview
        isInitialized={true}
        isPreviewSetup={true}
        isAdmin={false}
        selectedContentPreview={{
          compiledUrl: 'https://contentful.com'
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
    changePreviewBtn: '[data-test-id="change-preview"]'
  };

  it('preview button should be disabled if there is no preview', () => {
    const wrapper = render({
      isPreviewSetup: false
    });
    expect(wrapper.find(selectors.previewBtn)).toBeDisabled();
  });

  describe('should have notes if there is no preview', () => {
    it('and if user is not admin', () => {
      const wrapper = render({
        isPreviewSetup: false
      });

      expect(wrapper.find(selectors.helpText)).toHaveText(
        'No content preview is set up yet. To set up your preview, contact the administrator of this space.'
      );
    });

    it('and if user is admin', () => {
      const wrapper = render({
        isPreviewSetup: false,
        isAdmin: true
      });

      expect(wrapper.find(selectors.helpText)).toHaveText(
        'No preview is set up for the content type of this entry. Click here to set up a custom content preview.'
      );
    });
  });

  it('button should have href and track click event once it is clicked', () => {
    const stubs = {
      trackStub: jest.fn()
    };
    const wrapper = render({
      selectedContentPreview: {
        compiledUrl: 'https://contentful.com'
      },
      trackPreviewOpened: stubs.trackStub
    });

    expect(wrapper.find(selectors.previewBtn).prop('href')).toEqual('https://contentful.com');
    expect(wrapper.find(selectors.previewBtn).prop('target')).toEqual('_blank');
    wrapper.find(selectors.previewBtn).simulate('click');
    expect(stubs.trackStub).toHaveBeenCalled();
  });

  it('should show dropdown selector only if there 2 or more content previews', () => {
    const wrapper = render({
      contentPreviews: [{ name: 'first' }, { name: 'second' }]
    });
    expect(wrapper.find(selectors.changePreviewBtn)).toExist();
  });
});
