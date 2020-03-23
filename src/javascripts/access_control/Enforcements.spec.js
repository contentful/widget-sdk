import { determineEnforcement } from './Enforcements';

const spaceMock = {
  organization: {
    usage: {
      permanent: {
        entry: 0,
        user: 0
      },
      period: {
        assetBandwidth: 0,
        contentDeliveryApiRequest: 0
      }
    },
    subscription: {
      additional_usage_allowed: false
    },
    subscriptionPlan: {
      limits: {
        permanent: {
          entry: 5,
          user: 5
        },
        period: {
          assetBandwidth: 5,
          contentDeliveryApiRequest: 5
        }
      }
    }
  },
  sys: {
    id: 'space_1234'
  }
};

describe('access_control/Enforcements', () => {
  describe('determines enforcements', () => {
    it('returns null for no reasons', () => {
      expect(determineEnforcement(spaceMock)).toBeNull();
    });

    it('returns null for non-existent reasons', () => {
      expect(determineEnforcement(spaceMock, ['randomReason'])).toBeNull();
    });

    describe('When reason is systemMaintenance message', () => {
      it('returns the correct error', () => {
        const enforcement = determineEnforcement(spaceMock, ['systemMaintenance']);
        expect(enforcement.message).toBeDefined();
        expect(enforcement.label).toEqual('systemMaintenance');
      });
    });

    describe('When there are multiple reasons, including systemMaintenance', () => {
      const enforcement = determineEnforcement(spaceMock, [
        'systemMaintenance',
        'subscriptionUnsettled'
      ]);

      it('returns an error', () => {
        expect(enforcement.message).toBeDefined();
      });

      it('The stated reason is systemMaintenance', () => {
        expect(enforcement.message).toMatch(/system/gi);
        expect(enforcement.label).toEqual('systemMaintenance');
      });
    });

    describe('When the reason is period usage exceeded', () => {
      const enforcement = determineEnforcement(spaceMock, ['periodUsageExceeded']);

      it('returns an error', () => {
        expect(enforcement.message).toBeDefined();
      });

      it('The stated reason is limits exceeded', () => {
        expect(enforcement.message).toMatch(/limits/gi);
        expect(enforcement.label).toEqual('periodUsageExceeded');
      });
    });

    describe('When the reason is usage exceeded', () => {
      const enforcement = determineEnforcement(spaceMock, ['usageExceeded'], 'ApiKey');

      it('Returns a tooltip but no message', () => {
        expect(enforcement.tooltip).toBeDefined();
        expect(enforcement.message).toBeUndefined();
      });

      it('The stated reason is systemMaintenance', () => {
        expect(enforcement.label).toEqual('usageExceeded');
      });
    });

    describe('When the reason is readOnlySpace', () => {
      const enforcement = determineEnforcement(spaceMock, ['readOnlySpace'], 'Entry');

      it('Returns an error', () => {
        expect(enforcement.message).toBeDefined();
      });

      it('The stated reason is read only space', () => {
        expect(enforcement.label).toEqual('readOnlySpace');
      });
    });
  });
});
