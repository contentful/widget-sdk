import React from 'react';
import { render } from '@testing-library/react';
import EnvironmentAliases from './EnvironmentAliases';

// Default case is opted in with 1 alias and 3 envs
// tests override this with new valus for allSpaceAliases and items
const spaceId = '123456';
const getComponent = (props = {}) => {
  return (
    <EnvironmentAliases
      currentAliasId="master"
      allSpaceAliases={[
        {
          sys: {
            id: 'master',
            space: { sys: { id: spaceId } },
            aliasedEnvironment: { sys: { id: 'staging' } },
          },
        },
      ]}
      items={[
        {
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now(), space: { sys: { id: spaceId } } } },
        },
        {
          aliases: [],
          id: 'release-1',
          payload: { sys: { createdAt: Date.now(), space: { sys: { id: spaceId } } } },
        },
        {
          aliases: [],
          id: 'release-2',
          payload: { sys: { createdAt: Date.now(), space: { sys: { id: spaceId } } } },
        },
      ]}
      spaceId={spaceId}
      {...props}></EnvironmentAliases>
  );
};

describe('EnvironmentAliases', () => {
  it('does not show the component', () => {
    const component = getComponent({ items: [] });
    const { getByTestId } = render(component);
    expect(() => getByTestId('environmentaliases.wrapper.optin')).toThrow();
  });

  it('shows the opted-in state', () => {
    const component = getComponent();
    const { getByTestId } = render(component);
    const environmentalias = getByTestId('environmentalias.wrapper.master');
    expect(environmentalias).toBeInTheDocument();
    expect(environmentalias.innerHTML).toContain('master');
    expect(environmentalias.innerHTML).toContain('staging');
  });

  it('shows a disabled "Change Environment" link when only one environment exists', () => {
    const component = getComponent({
      allSpaceAliases: [
        {
          sys: {
            id: 'master',
            space: { sys: { id: spaceId } },
            aliasedEnvironment: { sys: { id: 'staging' } },
          },
        },
      ],
      items: [
        {
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now(), space: { sys: { id: spaceId } } } },
        },
      ],
    });
    const { getByTestId } = render(component);
    const environmentalias = getByTestId('environmentalias.wrapper.master');
    expect(environmentalias).toBeInTheDocument();

    const openChangeDialog = getByTestId('openChangeDialog.master');
    expect(openChangeDialog).toBeDisabled();
  });

  it('starts the opt-in flow', () => {
    const component = getComponent({ allSpaceAliases: [] });
    const { getByTestId } = render(component);

    const environmentaliases = getByTestId('environmentalias.wrapper.optin');
    expect(environmentaliases).toBeInTheDocument();

    expect(getByTestId('environmentalias.start-opt-in')).toBeInTheDocument();

    getByTestId('environmentalias.start-opt-in').click();

    const optIn = getByTestId('environmentalias.opt-in');
    expect(optIn).toBeInTheDocument();
  });

  it('shows a disabled "Delete" link for the master alias', () => {
    const component = getComponent();
    const { getByTestId } = render(component);
    const environmentalias = getByTestId('environmentalias.wrapper.master');
    expect(environmentalias).toBeInTheDocument();

    const openChangeDialog = getByTestId('openDeleteDialog.master');
    expect(openChangeDialog).toBeDisabled();
  });

  it('shows an enabled "Delete" link for an alias', () => {
    const component = getComponent({
      allSpaceAliases: [
        {
          sys: {
            id: 'master',
            space: { sys: { id: spaceId } },
            aliasedEnvironment: { sys: { id: 'staging' } },
          },
        },
        {
          sys: {
            id: 'test',
            space: { sys: { id: spaceId } },
            aliasedEnvironment: { sys: { id: 'staging_new' } },
          },
        },
      ],
      items: [
        {
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now(), space: { sys: { id: spaceId } } } },
        },
        {
          aliases: ['test'],
          id: 'staging_new',
          payload: { sys: { createdAt: Date.now(), space: { sys: { id: spaceId } } } },
        },
      ],
    });
    const { getByTestId } = render(component);
    const environmentalias = getByTestId('environmentalias.wrapper.test');
    expect(environmentalias).toBeInTheDocument();

    const openDeleteDialog = getByTestId('openDeleteDialog.test');
    expect(openDeleteDialog).toBeEnabled();
  });
});
