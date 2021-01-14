import React from 'react';
import { mount, shallow } from 'enzyme';
import { BatchErrorsModal } from './BatchErrorsModal';
import 'jest-enzyme';

describe('BatchErrorsModal', () => {
  it('should render correctly', async () => {
    const mockEntry = {
      sys: { type: 'Entry', id: 'some-entry-id' },
    };
    const wrapper = shallow(
      <BatchErrorsModal
        successMessage="1 entry saved successfully"
        errorMessages={[
          [[[mockEntry, 'Entry Title']], 'Failed to save 1 entry because a newer version exists.'],
        ]}
        isShown={true}
        onClose={jest.fn()}
      />
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('call provided function when close button is clicked', async () => {
    const mockEntry = {
      sys: { type: 'Entry', id: 'some-entry-id' },
    };
    const onCloseStub = jest.fn();

    const wrapper = mount(
      <BatchErrorsModal
        successMessage="1 entry saved successfully"
        errorMessages={[
          [[[mockEntry, 'Entry Title']], 'Failed to save 1 entry because a newer version exists.'],
        ]}
        isShown={true}
        onClose={onCloseStub}
      />
    );
    const closeButton = wrapper.findWhere((el) => el.prop('testId') === 'close-modal');

    expect(closeButton.prop('onClick')).toEqual(onCloseStub);
  });
});
