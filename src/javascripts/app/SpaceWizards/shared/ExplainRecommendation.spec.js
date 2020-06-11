import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';
import ExplainRecommendation from './ExplainRecommendation';
import { getPlanResourceFulfillment } from './utils';

jest.mock('./utils', () => ({
  getPlanResourceFulfillment: jest.fn().mockReturnValue({}),
}));

const mockCurrentPlan = Fake.Plan();
const mockRecommendedPlan = Fake.Plan();

describe('ExplainRecommendation', () => {
  it('should not show anything if there are no "fulfillments" reached or near', () => {
    build();

    expect(screen.queryByTestId('explain-recommendation')).toBeNull();
  });

  describe('recommendation copy', () => {
    it('should explain, if there are only reached fulfillments', () => {
      getPlanResourceFulfillment.mockReturnValueOnce({
        Roles: {
          reached: true,
          near: true,
        },
        Locales: {
          reached: true,
          near: true,
        },
      });

      build();

      expect(screen.getByTestId('explain-recommendation')).toHaveTextContent(
        'because you’ve reached the roles and locales limits for your current space plan'
      );
    });

    it('should explain, if there are only near fulfillments', () => {
      getPlanResourceFulfillment.mockReturnValueOnce({
        Roles: {
          reached: false,
          near: true,
        },
        Locales: {
          reached: false,
          near: true,
        },
      });

      build();

      expect(screen.getByTestId('explain-recommendation')).toHaveTextContent(
        'because you’re near the roles and locales limits for your current space plan'
      );
    });

    it('should explain, if there are both near and reached fulfillments', () => {
      getPlanResourceFulfillment.mockReturnValueOnce({
        Roles: {
          reached: true,
          near: true,
        },
        Locales: {
          reached: false,
          near: true,
        },
      });

      build();

      expect(screen.getByTestId('explain-recommendation')).toHaveTextContent(
        'because you’ve reached the roles and are near the locales limits for your current space plan'
      );
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      currentPlan: mockCurrentPlan,
      recommendedPlan: mockRecommendedPlan,
      resources: [],
    },
    custom
  );

  render(<ExplainRecommendation {...props} />);
}
