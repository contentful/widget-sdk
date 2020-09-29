import * as FakeFactory from 'test/helpers/fakeFactory';
import * as Analytics from 'analytics/Analytics';
import { isOwner } from 'services/OrganizationRoles';

import { trackEvent, EVENTS } from './analyticsTracking';

const mockOrganization = FakeFactory.Organization({ isBillable: false });
const mockSessionId = 'The most sercure session id';

const mockSessionData = {
  sessionId: mockSessionId,
  organizationId: mockOrganization.sys.id,
};
const mockEventMetadata = {
  userOrganizationRole: 'owner',
  organizationPlatform: 'Free',
  canCreateFreeSpace: true,
};

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('analyticsTracking', () => {
  beforeEach(() => {
    isOwner.mockReturnValue(true);
    mockOrganization.isBillable = false;
  });

  describe('trackEvent', () => {
    it('should fire an analytic event with the event name and the sesssion data when called', () => {
      trackEvent(EVENTS.BEGIN, mockSessionData, mockEventMetadata);

      expect(Analytics.track).toBeCalledWith(`space_purchase:${EVENTS.BEGIN}`, {
        ...mockSessionData,
        spaceId: null,
        eventMetadata: mockEventMetadata,
      });
    });

    it('should fire an analytic event with the event name, the sesssion data, and any event metadata when called', () => {
      const mockEventMetadata = {
        fromStep: 'Space Details',
        toStep: 'Receipt',
      };
      trackEvent(EVENTS.NAVIGATE, mockSessionData, mockEventMetadata);

      expect(Analytics.track).toBeCalledWith(`space_purchase:${EVENTS.NAVIGATE}`, {
        ...mockSessionData,
        spaceId: null,
        eventMetadata: mockEventMetadata,
      });
    });

    it('should not allow extra information to be logged if it is not supposed to be tracked', () => {
      trackEvent(
        EVENTS.NAVIGATE,
        { ...mockSessionData, extraInformation: 'test', moreUselessStuff: 'hello world!' },
        {
          fromStep: 'Space Details',
          toStep: 'Receipt',
        }
      );

      expect(Analytics.track).toBeCalledWith(`space_purchase:${EVENTS.NAVIGATE}`, {
        ...mockSessionData,
        spaceId: null,
        eventMetadata: { fromStep: 'Space Details', toStep: 'Receipt' },
      });
    });
  });
});
