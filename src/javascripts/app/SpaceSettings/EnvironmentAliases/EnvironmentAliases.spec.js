import React from 'react';
import { render, cleanup } from '@testing-library/react';
import EnvironmentAliases from './EnvironmentAliases.es6';
import '@testing-library/jest-dom/extend-expect';

jest.mock('./Feedback.es6', () => () => <div>Feedback</div>);

const optedIn = {
  targetEnv: {
    id: 'staging',
    aliases: ['master'],
    payload: { sys: { createdAt: Date.now() } }
  }
};

const getComponent = (props = {}) => {
  return (
    <EnvironmentAliases
      allSpaceAliases={[{ sys: { id: 'master' } }]}
      items={[
        {
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now() } }
        },
        {
          aliases: [],
          id: 'release-1',
          payload: { sys: { createdAt: Date.now() } }
        },
        {
          aliases: [],
          id: 'release-2',
          payload: { sys: { createdAt: Date.now() } }
        }
      ]}
      spaceId="123456"
      {...props}></EnvironmentAliases>
  );
};

describe('EnvironmentAliases', () => {
  afterEach(cleanup);

  it('does not show the component', () => {
    const component = getComponent({ items: [] });
    const { getByTestId } = render(component);
    expect(() => getByTestId('environmentaliases.wrapper')).toThrow();
  });

  it('shows the opted-in state', () => {
    const component = getComponent(optedIn);
    const { getByTestId } = render(component);
    const environmentalias = getByTestId('environmentalias.wrapper');
    expect(environmentalias).toBeInTheDocument();
    expect(environmentalias.innerHTML).toContain('master');
    expect(environmentalias.innerHTML).toContain('staging');
  });

  it('shows a disabled "Change Environment" link when only one environment exists', () => {
    const component = getComponent({
      ...optedIn,
      items: [
        {
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now() } }
        }
      ]
    });
    const { getByTestId } = render(component);
    const environmentalias = getByTestId('environmentalias.wrapper');
    expect(environmentalias).toBeInTheDocument();

    const openChangeDialog = getByTestId('openChangeDialog');
    expect(openChangeDialog).toBeDisabled();
  });

  it('starts the opt-in flow', () => {
    const component = getComponent({ allSpaceAliases: [] });
    const { getByTestId } = render(component);

    const environmentaliases = getByTestId('environmentaliases.wrapper');
    expect(environmentaliases).toBeInTheDocument();

    expect(getByTestId('environmentaliases.start-opt-in')).toBeInTheDocument();

    getByTestId('environmentaliases.start-opt-in').click();

    const optIn = getByTestId('environmentaliases.opt-in');
    expect(optIn).toBeInTheDocument();
  });
});
