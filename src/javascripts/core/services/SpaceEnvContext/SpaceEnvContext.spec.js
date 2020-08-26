import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpaceEnvContextProvider, SpaceEnvContext } from './SpaceEnvContext';
import { getOrganizationName, getOrganizationId, isAdmin } from './utils';

function SpaceEnvConsumerTestComponent(props) {
  return (
    <SpaceEnvContextProvider>
      <SpaceEnvContext.Consumer>{props.children}</SpaceEnvContext.Consumer>
    </SpaceEnvContextProvider>
  );
}

describe('<SpaceEnvContextProvider>', () => {
  it('should render', () => {
    function TestComponent() {
      return (
        <SpaceEnvConsumerTestComponent>{() => <div>Hello!</div>}</SpaceEnvConsumerTestComponent>
      );
    }

    render(<TestComponent />);

    expect(screen.queryByText('Hello!')).toBeInTheDocument();
  });

  it('should show values for organization', () => {
    function TestComponent() {
      return (
        <SpaceEnvConsumerTestComponent>
          {({ currentSpace }) => {
            return (
              <div>
                {getOrganizationName(currentSpace)} - {getOrganizationId(currentSpace)}
              </div>
            );
          }}
        </SpaceEnvConsumerTestComponent>
      );
    }

    render(<TestComponent />);

    expect(screen.queryByText('Contentful - org')).toBeInTheDocument();
  });

  it('should show values for admin only in case the user is administrator', () => {
    function TestComponent() {
      return (
        <SpaceEnvConsumerTestComponent>
          {({ currentSpace }) => {
            return <div>{isAdmin(currentSpace) ? 'Hello, Admin!' : 'You are not admin.'}</div>;
          }}
        </SpaceEnvConsumerTestComponent>
      );
    }

    render(<TestComponent />);

    expect(screen.queryByText('Hello, Admin!')).toBeInTheDocument();
  });

  it('should show values for the space', () => {
    function TestComponent() {
      return (
        <SpaceEnvConsumerTestComponent>
          {({ currentSpaceName, currentSpaceId }) => {
            return (
              <div>
                {currentSpaceName} - {currentSpaceId}
              </div>
            );
          }}
        </SpaceEnvConsumerTestComponent>
      );
    }

    render(<TestComponent />);

    expect(screen.queryByText('Blog - fg5eidi9k2qp')).toBeInTheDocument();
  });
});
