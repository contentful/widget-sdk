describe('access_control/Enforcements', () => {
  let enforcements;
  let OrganizationRoles;
  let spaceMock;

  beforeEach(async function() {
    enforcements = await this.system.import('access_control/Enforcements');
    OrganizationRoles = await this.system.import('services/OrganizationRoles');

    OrganizationRoles.setUser({ sys: { id: 123 } });

    spaceMock = {
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
  });

  describe('determines enforcements', () => {
    it('returns null for no reasons', () => {
      expect(enforcements.determineEnforcement(spaceMock)).toBeNull();
    });

    it('returns null for unexistent reasons', () => {
      expect(enforcements.determineEnforcement(spaceMock, ['randomReason'])).toBeNull();
    });

    describe('returns maintenance message', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['systemMaintenance']);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });

    describe('returns maintenance message with multiple reasons', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, [
          'systemMaintenance',
          'subscriptionUnsettled'
        ]);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });

      it('error matches reason', () => {
        expect(enforcement.message).toMatch(/system/gi);
      });
    });

    describe('returns period usage exceeded', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['periodUsageExceeded']);
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });

    describe('returns usage exceeded', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['usageExceeded'], 'ApiKey');
      });

      it('has a tooltip but no message', () => {
        expect(enforcement.tooltip).toBeDefined();
        expect(enforcement.message).toBeUndefined();
      });
    });

    describe('returns readOnlySpace message', () => {
      let enforcement;
      beforeEach(() => {
        enforcement = enforcements.determineEnforcement(spaceMock, ['readOnlySpace'], 'Entry');
      });

      it('has an error', () => {
        expect(enforcement.message).toBeDefined();
      });
    });
  });
});