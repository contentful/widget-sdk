import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { PersistentNotification } from './PersistentNotification';
import { showPersistentNotification, hidePersistentNotification } from './service';

const show = (event) => act(() => showPersistentNotification(event));
const hide = () => act(() => hidePersistentNotification());

describe('PersistentNotification', () => {
  it('should show the notification', () => {
    render(<PersistentNotification />);

    show({
      message: 'Hello world!',
    });
    expect(screen.queryByText('Hello world!')).toBeInTheDocument();
  });

  it('should show the notification with the action button', () => {
    render(<PersistentNotification />);
    const callback = jest.fn();

    show({
      message: 'Hello world!',
    });
    expect(screen.queryByTestId('persistent-notification-action-button')).not.toBeInTheDocument();

    show({
      message: 'Hello world!',
      actionMessage: 'Click here',
    });
    expect(screen.queryByTestId('persistent-notification-action-button')).not.toBeInTheDocument();

    show({
      message: 'Hello world!',
      action: jest.fn(),
    });
    expect(screen.queryByTestId('persistent-notification-action-button')).not.toBeInTheDocument();

    show({
      message: 'Hello world!',
      actionMessage: 'My precious',
      action: callback,
    });
    expect(screen.queryByText('My precious')).toBeInTheDocument();

    screen.queryByTestId('persistent-notification-action-button').click();
    expect(callback).toHaveBeenCalled();
  });

  it('should not show the notification if there is no message', () => {
    render(<PersistentNotification />);

    show();
    expect(screen.queryByTestId('persistent-notification')).not.toBeInTheDocument();

    show({});
    expect(screen.queryByTestId('persistent-notification')).not.toBeInTheDocument();

    show(null);
    expect(screen.queryByTestId('persistent-notification')).not.toBeInTheDocument();

    show(false);
    expect(screen.queryByTestId('persistent-notification')).not.toBeInTheDocument();
  });

  it('should render the link given label and url', () => {
    render(<PersistentNotification />);

    show({
      message: 'Hello world!',
    });
    expect(screen.queryByTestId('persistent-notification-link')).not.toBeInTheDocument();

    show({
      message: 'Hello world!',
      link: {
        text: 'Talk to us',
      },
    });
    expect(screen.queryByTestId('persistent-notification-link')).not.toBeInTheDocument();

    show({
      message: 'Hello world!',
      link: {
        href: 'https://www.contentful.com',
      },
    });
    expect(screen.queryByTestId('persistent-notification-link')).not.toBeInTheDocument();

    show({
      message: 'Hello world!',
      link: {
        href: 'https://www.contentful.com',
        text: 'Click here',
      },
    });

    expect(screen.queryByText('Click here')).toBeInTheDocument();
    expect(screen.queryByTestId('persistent-notification-link')).toHaveAttribute(
      'href',
      'https://www.contentful.com'
    );
  });

  it('should not show the notification', () => {
    render(<PersistentNotification />);
    expect(screen.queryByTestId('persistent-notification')).not.toBeInTheDocument();

    hide();
    expect(screen.queryByTestId('persistent-notification')).not.toBeInTheDocument();
  });
});
