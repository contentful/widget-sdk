import React from 'react';
import PersistentNotification from './PersistentNotification';
import { render } from '@testing-library/react';

describe('<PersistentNotification />', () => {
  it('should render the message', () => {
    const { queryByText } = render(<PersistentNotification contents="Hello, world!" />);

    expect(queryByText('Hello, world!')).toBeInTheDocument();
  });

  it('should render the message with html content', () => {
    const { queryByTestId } = render(
      <PersistentNotification contents="Hello, <strong>world!</strong>" />
    );

    expect(queryByTestId('persistent-notification-message')).toContainHTML(
      'Hello, <strong>world!</strong>'
    );
  });

  it('should render the link', () => {
    const { queryByTestId } = render(
      <PersistentNotification
        contents="Hello, world!"
        linkText="Talk to support"
        linkUrl="https://www.contentful.com/support"
      />
    );
    const link = queryByTestId('persistent-notification-link');

    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Talk to support');
    expect(link).toHaveAttribute('href', 'https://www.contentful.com/support');
  });

  it('should render the action button', () => {
    const { queryByTestId } = render(
      <PersistentNotification
        contents="Hello, world!"
        actionMessage="Create a space"
        onClickAction={jest.fn()}
      />
    );
    const button = queryByTestId('persistent-notification-action-button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Create a space');
  });

  it('should click on the button', () => {
    const clickActionCallback = jest.fn();
    const { queryByTestId } = render(
      <PersistentNotification
        contents="Hello, world!"
        actionMessage="Create a space"
        onClickAction={clickActionCallback}
      />
    );

    queryByTestId('persistent-notification-action-button').click();

    expect(clickActionCallback).toHaveBeenCalledTimes(1);
  });

  it('should not render if there is no message', () => {
    const { queryByTestId } = render(<PersistentNotification />);

    expect(queryByTestId('persistent-notification')).not.toBeInTheDocument();
  });

  it('should not render link', () => {
    const { queryByTestId } = render(<PersistentNotification contents="Hello, world!" />);

    expect(queryByTestId('persistent-notification-link')).not.toBeInTheDocument();
  });

  it('should not render action button', () => {
    const { queryByTestId } = render(<PersistentNotification contents="Hello, world!" />);

    expect(queryByTestId('persistent-notification-action-button')).not.toBeInTheDocument();
  });
});
