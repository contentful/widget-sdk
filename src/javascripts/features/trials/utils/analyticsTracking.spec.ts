import { track } from 'analytics/Analytics';
import { trackEvent, EVENTS } from './analyticsTracking';

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('trackEvent', () => {
  it('calls track()', async () => {
    trackEvent(EVENTS.HELP_LINK, { test: 'test' });

    expect(track).toHaveBeenCalledWith(`trial:${EVENTS.HELP_LINK}`, { test: 'test' });
  });
});
