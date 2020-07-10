import { trackCTAClick } from './targetedCTA';
import { track } from './Analytics';
import { getCurrentStateName } from 'states/Navigator';

jest.mock('./Analytics', () => ({
  track: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn().mockReturnValue('current.state.name'),
}));

describe('targetedCTA', () => {
  describe('trackCTAClick', () => {
    it('should throw if given an invalid intent', () => {
      expect(() => trackCTAClick('something')).toThrow();
      expect(() => trackCTAClick('upgrade_space_plan')).not.toThrow();
    });

    it('should throw if given an invalid metadata key', () => {
      expect(() =>
        trackCTAClick('upgrade_space_plan', {
          orgId: 'org_1234',
        })
      ).toThrow();
      expect(() =>
        trackCTAClick('upgrade_space_plan', {
          organizationId: 'org_1234',
        })
      ).not.toThrow();
    });

    it('should track the correct event', () => {
      trackCTAClick('upgrade_space_plan', {
        organizationId: 'org_1234',
      });

      expect(track).toBeCalledWith('targeted_cta_clicked:upgrade_space_plan', {
        ctaLocation: getCurrentStateName(),
        meta: {
          organizationId: 'org_1234',
        },
      });
    });
  });
});
