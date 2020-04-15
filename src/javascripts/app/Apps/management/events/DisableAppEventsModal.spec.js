import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import { DisableAppEventsModal } from './DisableAppEventsModal';

const disableAppEvents = jest.fn(() => {});
const closeFn = jest.fn(() => {});

describe('Disable App Events Modal', () => {
  const mockedProps = {
    title: 'Algolia',
    isShown: true,
    onClose: closeFn,
    onDisableAppEvents: disableAppEvents,
  };

  afterEach(cleanup);

  it('should render the modal', () => {
    const wrapper = render(<DisableAppEventsModal {...mockedProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should render the correct modal title', () => {
    render(<DisableAppEventsModal {...mockedProps} />);
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Algolia');
  });

  it('should call the disable app events function', () => {
    const { getByTestId } = render(<DisableAppEventsModal {...mockedProps} />);

    const disableButton = getByTestId('disable-app-events');
    disableButton.click();

    expect(disableAppEvents).toHaveBeenCalled();
  });

  it('should close the modal when clicking on the cancel action', () => {
    const { getByTestId } = render(<DisableAppEventsModal {...mockedProps} />);

    const cancelButton = getByTestId('cancel-action');
    cancelButton.click();

    expect(closeFn).toHaveBeenCalled();
  });
});
