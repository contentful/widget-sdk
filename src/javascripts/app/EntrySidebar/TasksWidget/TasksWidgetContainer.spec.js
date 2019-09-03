import React from 'react';
import { render, cleanup } from '@testing-library/react';

import * as FeatureFlagKey from 'featureFlags.es6';
import TasksWidgetContainer from './TasksWidgetContainer.es6';

import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
jest.mock('utils/LaunchDarkly/BooleanFeatureFlag.es6', () => jest.fn());

import { trackIsTasksAlphaEligible } from './analytics.es6';
jest.mock('./analytics.es6');

describe('<TasksWidgetContainer />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const build = () => {
    const props = {
      emitter: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      },
      featureFlagKey: FeatureFlagKey.TASKS,
      children: jest.fn().mockReturnValue(null)
    };
    return { rendered: render(<TasksWidgetContainer {...props} />) };
  };

  describe('with task alpha feature flag disabled', () => {
    beforeEach(() => {
      mockBooleanFeatureFlag(false);
    });

    it('does not track to intercom', () => {
      build();
      expect(trackIsTasksAlphaEligible).not.toHaveBeenCalled();
    });

    it('does not render tasks', () => {
      const { rendered } = build();
      expect(rendered.container.children).toHaveLength(0);
    });
  });

  describe('with task alpha feature flag enabled', () => {
    beforeEach(() => {
      mockBooleanFeatureFlag(true);
    });

    it('tracks to intercom', () => {
      build();
      expect(trackIsTasksAlphaEligible).toHaveBeenCalled();
    });
  });
});

function mockBooleanFeatureFlag(currentVariation) {
  BooleanFeatureFlag.mockImplementation(({ children }) => children({ currentVariation }));
}
