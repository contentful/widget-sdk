import {
  trackCTAClick,
  trackTargetedCTAClick,
  trackTargetedCTAImpression,
  CTA_EVENTS,
} from './trackCTA';
import { track } from './Analytics';
import { getCurrentStateName } from 'states/Navigator';

jest.mock('./Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn().mockReturnValue('current.state.name'),
}));

describe.each([
  [trackCTAClick, 'cta_clicked:upgrade_space_plan'],
  [trackTargetedCTAClick, 'targeted_cta_clicked:upgrade_space_plan'],
  [trackTargetedCTAImpression, 'targeted_cta_impression:upgrade_space_plan'],
])('trackCTA', (func, eventName) => {
  describe(func, () => {
    it('should throw if given an invalid intent', () => {
      expect(() => func('something')).toThrow();
      expect(() => func(CTA_EVENTS.UPGRADE_SPACE_PLAN)).not.toThrow();
    });

    it('should throw if given an invalid metadata key', () => {
      expect(() =>
        func(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
          orgId: 'org_1234',
        })
      ).toThrow();
      expect(() =>
        func(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
          organizationId: 'org_1234',
        })
      ).not.toThrow();
    });

    it('should track the correct event', () => {
      func(CTA_EVENTS.UPGRADE_SPACE_PLAN, {
        organizationId: 'org_1234',
      });

      expect(track).toBeCalledWith(eventName, {
        ctaLocation: getCurrentStateName(),
        meta: {
          organizationId: 'org_1234',
        },
      });
    });
  });
});
