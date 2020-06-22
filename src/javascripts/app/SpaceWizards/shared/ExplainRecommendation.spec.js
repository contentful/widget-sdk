import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Fake from 'test/helpers/fakeFactory';
import ExplainRecommendation from './ExplainRecommendation';

const mockRecommendedPlan = Fake.Plan();

describe('ExplainRecommendation', () => {
  it('should not show anything if the plan cannot be recommended', () => {
    build();

    expect(screen.queryByTestId('explain-recommendation')).toBeNull();
  });

  describe('recommendation copy', () => {
    it('should explain, if there are only reached fulfillments', () => {
      const resources = [
        Fake.SpaceResource(20, 20, 'record'),
        Fake.SpaceResource(20, 20, 'locale'),
      ];

      build({ resources });

      expect(screen.getByTestId('explain-recommendation')).toHaveTextContent(
        'because you’ve reached the records and locales limits for your current space plan'
      );
    });

    it('should explain, if there are only near fulfillments', () => {
      const resources = [
        Fake.SpaceResource(19, 20, 'record'),
        Fake.SpaceResource(19, 20, 'locale'),
      ];
      build({ resources });

      expect(screen.getByTestId('explain-recommendation')).toHaveTextContent(
        'because you’re near the records and locales limits for your current space plan'
      );
    });

    it('should explain, if there are both near and reached fulfillments', () => {
      const resources = [
        Fake.SpaceResource(20, 20, 'record'),
        Fake.SpaceResource(19, 20, 'locale'),
      ];

      build({ resources });

      expect(screen.getByTestId('explain-recommendation')).toHaveTextContent(
        'because you’ve reached the records and are near the locales limits for your current space plan'
      );
    });
  });
});

function build(custom) {
  const props = Object.assign(
    {
      recommendedPlan: mockRecommendedPlan,
      resources: [],
    },
    custom
  );

  render(<ExplainRecommendation {...props} />);
}
