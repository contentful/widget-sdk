import React from 'react';
import { render, wait } from '@testing-library/react';
import TasksWidgetContainer from './TasksWidgetContainer';

import { trackIsTasksAlphaEligible } from './analytics';
import * as ProductCatalog from 'data/CMA/ProductCatalog';

jest.mock('data/CMA/ProductCatalog', () => ({
  getSpaceFeature: jest.fn(),
  FEATURES: {
    TASKS: 'test-tasks',
  },
}));
jest.mock('./analytics');

describe('<TasksWidgetContainer />', () => {
  afterEach(() => {
    ProductCatalog.getSpaceFeature.mockClear();
  });

  const build = () => {
    const props = {
      emitter: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      featureFlagKey: ProductCatalog.FEATURES.TASKS,
      children: jest.fn().mockReturnValue(null),
    };
    return { rendered: render(<TasksWidgetContainer {...props} />) };
  };

  describe('with task alpha feature flag disabled', () => {
    beforeEach(() => {
      mockBooleanFeatureFlag(false);
    });

    it('does not track to intercom', async () => {
      build();
      await wait();
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

    it('tracks to intercom', async () => {
      build();
      await wait();
      expect(trackIsTasksAlphaEligible).toHaveBeenCalled();
    });
  });
});

function mockBooleanFeatureFlag(currentVariation) {
  ProductCatalog.getSpaceFeature.mockResolvedValue(currentVariation);
}
