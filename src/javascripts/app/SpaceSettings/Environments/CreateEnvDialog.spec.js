import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import * as Environment from 'data/CMA/SpaceEnvironmentsRepo.es6';
import { CreateEnvironmentView } from './CreateEnvDialog';

describe('CreateEnvironmentDialog', () => {
  afterEach(cleanup);

  describe('when environment branching is disabled', function() {
    it('does not show the env selector and uses master', function() {
      const stubs = {
        createEnvironment: jest.fn().mockResolvedValue({
          type: Environment.EnvironmentUpdated
        }),
        onClose: jest.fn(),
        onCreate: jest.fn()
      };

      const { getByTestId, queryByTestId, getByText } = render(
        <CreateEnvironmentView
          environments={[{ id: 'master', status: 'ready' }, { id: 'test', status: 'ready' }]}
          currentEnvironment="master"
          canSelectSource={false}
          createEnvironment={stubs.createEnvironment}
          onClose={stubs.onClose}
          onCreate={stubs.onCreate}
        />
      );

      expect(queryByTestId('source.id')).not.toBeInTheDocument();

      fireEvent.change(getByTestId('field.id'), {
        target: { value: 'new env!!!' }
      });
      fireEvent.click(getByTestId('submit'));

      expect(
        getByText('Please use only letters, numbers, underscores, dashes and dots for the ID.')
      ).toBeInTheDocument();

      fireEvent.change(getByTestId('field.id'), {
        target: { value: 'new_env' }
      });
      fireEvent.click(getByTestId('submit'));

      expect(stubs.createEnvironment).toHaveBeenCalledWith({
        id: 'new_env',
        name: 'new_env',
        source: 'master'
      });
    });

    describe('when environment branching is enabled', function() {
      it('shows the selector if there are multiple envs', async function() {
        const stubs = {
          createEnvironment: jest.fn().mockResolvedValue({
            type: Environment.EnvironmentUpdated
          }),
          onClose: jest.fn(),
          onCreate: jest.fn()
        };

        const { getByTestId, getByText } = render(
          <CreateEnvironmentView
            environments={[{ id: 'master', status: 'ready' }, { id: 'test', status: 'ready' }]}
            currentEnvironment="master"
            canSelectSource={true}
            createEnvironment={stubs.createEnvironment}
            onClose={stubs.onClose}
            onCreate={stubs.onCreate}
          />
        );

        expect(getByTestId('source.id').value).toEqual('master');

        fireEvent.change(getByTestId('field.id'), {
          target: { value: 'new env!!!' }
        });
        fireEvent.click(getByTestId('submit'));

        expect(
          getByText('Please use only letters, numbers, underscores, dashes and dots for the ID.')
        ).toBeInTheDocument();

        fireEvent.change(getByTestId('field.id'), {
          target: { value: 'new_env' }
        });
        fireEvent.change(getByTestId('source.id'), {
          target: { value: 'test' }
        });

        fireEvent.click(getByTestId('submit'));

        expect(stubs.createEnvironment).toHaveBeenCalledWith({
          id: 'new_env',
          name: 'new_env',
          source: 'test'
        });
      });
    });
  });
});
