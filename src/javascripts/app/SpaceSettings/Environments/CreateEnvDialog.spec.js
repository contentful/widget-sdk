import React from 'react';
import { render, fireEvent, wait, screen } from '@testing-library/react';

import * as Environment from 'data/CMA/SpaceEnvironmentsRepo';
import { CreateEnvironmentView } from './CreateEnvDialog';

describe('CreateEnvironmentDialog', () => {
  describe('when environment branching is disabled', function() {
    it('does not show the env selector and uses master', async function() {
      const stubs = {
        createEnvironment: jest.fn().mockResolvedValue({
          type: Environment.EnvironmentUpdated
        }),
        onClose: jest.fn(),
        onCreate: jest.fn()
      };

      render(
        <CreateEnvironmentView
          environments={[{ id: 'master', status: 'ready' }, { id: 'test', status: 'ready' }]}
          currentEnvironment="master"
          canSelectSource={false}
          createEnvironment={stubs.createEnvironment}
          onClose={stubs.onClose}
          onCreate={stubs.onCreate}
        />
      );

      expect(screen.queryByTestId('source.id')).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('field.id'), {
        target: { value: 'new env!!!' }
      });

      fireEvent.click(screen.getByTestId('submit'));

      expect(
        screen.getByText(
          'Please use only letters, numbers, underscores, dashes and dots for the ID.'
        )
      ).toBeInTheDocument();

      fireEvent.change(screen.getByTestId('field.id'), {
        target: { value: 'new_env' }
      });

      fireEvent.click(screen.getByTestId('submit'));

      expect(stubs.createEnvironment).toHaveBeenCalledWith({
        id: 'new_env',
        name: 'new_env',
        source: 'master'
      });

      return wait();
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

        render(
          <CreateEnvironmentView
            environments={[{ id: 'master', status: 'ready' }, { id: 'test', status: 'ready' }]}
            currentEnvironment="master"
            canSelectSource={true}
            createEnvironment={stubs.createEnvironment}
            onClose={stubs.onClose}
            onCreate={stubs.onCreate}
          />
        );

        expect(screen.getByTestId('source.id').value).toEqual('master');

        fireEvent.change(screen.getByTestId('field.id'), {
          target: { value: 'new env!!!' }
        });
        fireEvent.click(screen.getByTestId('submit'));

        expect(
          screen.getByText(
            'Please use only letters, numbers, underscores, dashes and dots for the ID.'
          )
        ).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('field.id'), {
          target: { value: 'new_env' }
        });
        fireEvent.change(screen.getByTestId('source.id'), {
          target: { value: 'test' }
        });

        fireEvent.click(screen.getByTestId('submit'));

        expect(stubs.createEnvironment).toHaveBeenCalledWith({
          id: 'new_env',
          name: 'new_env',
          source: 'test'
        });

        return wait();
      });
    });
  });
});
