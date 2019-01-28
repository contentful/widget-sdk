import React from 'react';
import Enzyme from 'enzyme';
import DomClipboardCopy from 'utils/DomClipboardCopy.es6';
import CopyIconButton from './CopyIconButton.es6';

jest.mock('utils/DomClipboardCopy.es6', () => jest.fn(), { virtual: true });

describe('ui/Components/CopyIconButton.es6', () => {
  it('copies the value to the clipboard', function*() {
    const wrapper = Enzyme.mount(<CopyIconButton value="TEXT" />);
    wrapper.find('[data-test-id="clickToCopy"]').simulate('click');
    expect(DomClipboardCopy).toHaveBeenCalledWith('TEXT');
  });
});
