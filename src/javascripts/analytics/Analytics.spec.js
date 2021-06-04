jest.mock('analytics/segment', () => {
  return {
    __esModule: true,
    ...jest.requireActual('analytics/segment'),
    default: ['enable', 'disable', 'identify', 'track', 'page'].reduce(
      (acc, key) => ({
        ...acc,
        [key]: jest.fn(),
      }),
      {
        plan: {},
      }
    ),
  };
});

jest.mock('analytics/snowplow', () => {
  return ['enable', 'disable', 'identify', 'track', 'buildUnstructEventData'].reduce(
    (acc, key) => ({
      ...acc,
      [key]: jest.fn(),
    }),
    {}
  );
});

jest.mock('analytics/analyticsConsoleController', () => {
  return {
    add: jest.fn(),
    setSessionData: jest.fn(),
  };
});

jest.mock('analytics/transform', () => ({
  transformEventForSnowplow: jest.fn().mockImplementation((_, data) => ({ data })),
  eventExists: jest.fn().mockReturnValue(true),
  getSegmentSchemaForEvent: jest
    .fn()
    .mockReturnValue({ name: 'event', isLegacySnowplowGeneric: false }),
}));

describe('Analytics', () => {
  const userData = {
    firstName: 'Hans',
    lastName: 'Wurst',
    sys: { id: 'userid' },
  };

  function getAllDeps() {
    const analytics = require('./Analytics');
    // we want to simulate production environment
    // this way data hits the Segment and Snowplow services
    analytics.__testOnlySetEnv('production');
    const segment = require('analytics/segment').default;
    const Snowplow = require('analytics/snowplow');
    const transform = require('analytics/transform');

    return { analytics, segment, Snowplow, transform };
  }

  beforeEach(function () {
    jest.resetModules();
  });

  describe('#enable()', () => {
    it('enables Segment and Snowplow', function () {
      const { analytics, segment, Snowplow } = getAllDeps();
      analytics.enable(userData);
      expect(segment.enable).toHaveBeenCalled();
      expect(Snowplow.enable).toHaveBeenCalled();
    });

    it('is executed only once', function () {
      const { analytics, segment } = getAllDeps();
      analytics.enable(userData);
      analytics.enable(userData);
      expect(segment.enable).toHaveBeenCalledTimes(1);
    });
  });

  describe('#trackContextChange', function () {
    it('should set the space in the session if given', function () {
      const { analytics } = getAllDeps();
      const space = { sys: { id: 'space_1234' } };
      analytics.trackContextChange(space);
      expect(analytics.getSessionData('space')).toEqual(space);
    });
    it('should set the organization in the session if given', function () {
      const { analytics } = getAllDeps();
      const org = { sys: { id: 'org_1234' } };
      analytics.trackContextChange(null, org);
      expect(analytics.getSessionData('organization')).toEqual(org);
    });
    it('should set both space and org if given', function () {
      const { analytics } = getAllDeps();
      const space = { sys: { id: 'space_4567' } };
      const org = { sys: { id: 'org_4567' } };
      analytics.trackContextChange(space, org);
      expect(analytics.getSessionData('space')).toEqual(space);
      expect(analytics.getSessionData('organization')).toEqual(org);
    });
    it('should unset if explicitly called with null value for given param', function () {
      const { analytics } = getAllDeps();
      const space = { sys: { id: 'space_4567' } };
      const org = { sys: { id: 'org_4567' } };
      analytics.trackContextChange(space, org);
      expect(analytics.getSessionData('space')).toEqual(space);
      expect(analytics.getSessionData('organization')).toEqual(org);
      analytics.trackContextChange(null);
      expect(analytics.getSessionData('space')).toBeNull();
      expect(analytics.getSessionData('organization')).toEqual(org);
      analytics.trackContextChange(space, null);
      expect(analytics.getSessionData('space')).toEqual(space);
      expect(analytics.getSessionData('organization')).toBeNull();
      analytics.trackContextChange(undefined);
      expect(analytics.getSessionData('space')).toEqual(space);
    });
  });

  describe('identifying data', () => {
    it('should identify when enabling the service', function () {
      const { analytics, segment, Snowplow } = getAllDeps();
      expect(segment.identify).not.toHaveBeenCalled();
      expect(Snowplow.identify).not.toHaveBeenCalled();

      analytics.enable(userData);

      expect(segment.identify).toHaveBeenCalledWith(
        'userid',
        {
          firstName: 'Hans',
          lastName: 'Wurst',
        },
        { integrations: { Intercom: { user_hash: undefined } } }
      );

      expect(Snowplow.identify).toHaveBeenCalledWith('userid');
    });
  });

  describe('.track()', function () {
    it('calls analytics services if event is valid', function () {
      const { analytics, segment, Snowplow } = getAllDeps();
      analytics.enable(userData);
      analytics.track('Event', { foo: 'bar' });
      expect(segment.track).toHaveBeenCalledWith('Event', {
        payload: {
          foo: 'bar',
          userId: userData.sys.id,
        },
      });
      expect(Snowplow.track).toHaveBeenCalledWith('Event', {
        data: {
          foo: 'bar',
          userId: userData.sys.id,
        },
      });
    });

    it('sends `tracking:invalid_event` event is given an invalid event and does not track the original event', function () {
      const { analytics, segment, Snowplow, transform } = getAllDeps();

      let calls = 0;
      transform.eventExists.mockImplementation(() => {
        calls++;
        if (calls === 2) {
          return false;
        }
        return true;
      });

      analytics.enable(userData);

      analytics.track('Event', { data: 'foobar' });

      expect(segment.track).toHaveBeenCalledWith('tracking:invalid_event', {
        payload: {
          event: 'Event',
          userId: 'userid',
        },
      });
      expect(Snowplow.track).toHaveBeenCalledWith('tracking:invalid_event', {
        data: {
          event: 'Event',
          userId: 'userid',
        },
      });

      expect(segment.track).not.toHaveBeenCalledWith('Event', {
        data: 'foobar',
        userId: userData.sys.id,
      });
      expect(Snowplow.track).not.toHaveBeenCalledWith('Event', {
        data: 'foobar',
        userId: userData.sys.id,
      });
    });

    it('should transform the event when tracking', function () {
      const { analytics, transform } = getAllDeps();

      analytics.enable(userData);
      analytics.track('EventName', { data: 'some data' });
      expect(transform.transformEventForSnowplow).toHaveBeenCalledWith('EventName', {
        data: 'some data',
        userId: userData.sys.id,
      });
    });
  });

  describe('stateActivated', () => {
    const state = { name: 'spaces.detail.entries.detail' };
    const stateParams = { spaceId: 'spaceId', entryId: 'entryId' };

    it('should set the page in segment', function () {
      const { analytics, segment } = getAllDeps();
      analytics.enable(userData);
      analytics.trackStateChange(state, stateParams);
      expect(segment.page).toHaveBeenCalledWith(state.name, stateParams);
    });
  });
});
