import React from 'react';
import Enzyme from 'enzyme';
import VersionsWidget, { noSnapshotsText, compareHelpText } from './VersionsWidget.es6';
import $state from 'ng/$state';

describe('EntrySidebar/VersionsWidget', () => {
  const render = (props = {}, renderFn = Enzyme.shallow) => {
    const wrapper = renderFn(<VersionsWidget versions={[]} isLoaded entryId={null} {...props} />);
    return { wrapper };
  };

  it('should render correct message if there are no versions', () => {
    const { wrapper } = render({ versions: [] }, Enzyme.mount);
    expect(wrapper).toIncludeText(noSnapshotsText);
    expect(wrapper).not.toIncludeText(compareHelpText);
  });

  describe('versions are present', () => {
    const versions = [
      {
        sys: {
          id: '1',
          createdAt: '2019-01-10T13:21:40.467Z',
          snapshotType: 'published',
          isCurrent: true
        }
      },
      {
        sys: {
          id: '2',
          createdAt: '2019-01-10T13:16:40.467Z',
          snapshotType: 'published',
          isCurrent: false
        }
      }
    ];

    it('should render correct message if there are some versions', () => {
      const { wrapper } = render(
        {
          versions
        },
        Enzyme.mount
      );
      expect(wrapper).toIncludeText(compareHelpText);
      expect(wrapper).not.toIncludeText(noSnapshotsText);
    });

    it('should render list of versions', () => {
      const { wrapper } = render({
        versions
      });
      expect(wrapper.find('table tr')).toHaveLength(2);
      expect(wrapper.find('table input')).toHaveLength(2);
      expect(wrapper.find('table input#selected-1')).toBeDisabled();
      expect(wrapper.find('table input#selected-2')).not.toBeDisabled();
    });

    it('should have disabled compare button by default which has to be enabled once version is selected', () => {
      const { wrapper } = render(
        {
          versions,
          entryId: 'sjk17sh18ska'
        },
        Enzyme.mount
      );
      expect(wrapper.find('button')).toBeDisabled();
      wrapper.find('input#selected-2').simulate('change', { currentTarget: { value: '2' } });
      expect(wrapper.find('button')).not.toBeDisabled();
      wrapper.find('button').simulate('click');
      expect($state.go).toHaveBeenCalledWith(
        'spaces.detail.entries.detail.compare.withCurrent',
        {
          entryId: 'sjk17sh18ska',
          snapshotId: '2'
        },
        undefined
      );
    });
  });
});
