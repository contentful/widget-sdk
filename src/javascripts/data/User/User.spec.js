import * as K from '__mocks__/kefirMock';
import moment from 'moment';
import * as TokenStore from 'services/TokenStore';
import * as NgRegistry from 'core/NgRegistry';
import * as spaceContext from 'classes/spaceContext';

import * as utils from 'data/User';

jest.mock('services/TokenStore');
jest.mock('core/NgRegistry');

describe('data/User', () => {
  let tokenStore, context, $stateParams, orgs, $rootScope;
  beforeEach(async function () {
    tokenStore = {
      organizations$: K.createMockProperty(null),
      user$: K.createMockProperty(null),
      spacesByOrganization$: K.createMockProperty(null),
    };

    context = {
      organization: {},
      space: {
        data: {},
      },
    };

    $stateParams = {
      orgId: 1,
    };

    orgs = [
      {
        role: 'owner',
        organization: { sys: { id: 'org-owner' } },
      },
      {
        role: 'member',
        organization: { sys: { id: 'org-member' } },
      },
    ];

    let $stateChangeSuccess;
    const $on = (_, fn) => {
      $stateChangeSuccess = fn;
    };
    const $broadcast = () => {
      $stateChangeSuccess();
    };

    $rootScope = { $on, $broadcast };

    jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => context);

    NgRegistry.getModule = jest.fn().mockImplementation((arg) => {
      if (arg === '$stateParams') {
        return $stateParams;
      }
      if (arg === '$rootScope') {
        return $rootScope;
      }
      return jest.requireActual('core/NgRegistry')(arg);
    });

    TokenStore.organizations$ = tokenStore.organizations$;
    TokenStore.spacesByOrganization$ = tokenStore.spacesByOrganization$;
    TokenStore.user$ = tokenStore.user$;
  });

  describe('#getOrgRole', () => {
    it('returns the role the user has for a given orgId', function () {
      const role = 'some role';
      const orgId = 'org-1';
      const user = {
        organizationMemberships: [{ role, organization: { sys: { id: orgId } } }],
      };
      const foundRole = utils.getOrgRole(user, orgId);

      expect(foundRole).toEqual(role);
    });
    it('returns undefined when org with given org id is not found', function () {
      const foundRole = utils.getOrgRole([{ role: 'potato', organization: { sys: { id: 1 } } }], 2);

      expect(foundRole).toBeNull();
    });
  });

  describe('#getUserAgeInDays', () => {
    it("gets the user's age in days for older dates", function () {
      const diff = 7;
      const creationDate = moment().subtract(diff, 'days');

      expect(utils.getUserAgeInDays({ sys: { createdAt: creationDate.toISOString() } })).toBe(diff);
    });
    it('returns null if the operation throws', function () {
      expect(Number.isNaN(utils.getUserAgeInDays({ sys: { createdAt: 'some wrong date' } }))).toBe(
        true
      );
    });
  });

  describe('#getUserCreationDateUnixTimestamp', () => {
    it('should return the user creation date as a unix timestamp', function () {
      const creationDate = moment();

      expect(
        utils.getUserCreationDateUnixTimestamp({
          sys: { createdAt: creationDate.toISOString() },
        })
      ).toBe(creationDate.unix());
    });
  });

  describe('#hasAnOrgWithSpaces', () => {
    it('returns true if any of the orgs user belongs to has one or more spaces', function () {
      expect(utils.hasAnOrgWithSpaces({ org1: [1, 2] })).toBe(true);
      expect(utils.hasAnOrgWithSpaces({ org1: [1, 2], org2: [] })).toBe(true);
    });
    it('returns false otherwise', function () {
      expect(utils.hasAnOrgWithSpaces({})).toBe(false);
      expect(utils.hasAnOrgWithSpaces({ org1: [], org2: [] })).toBe(false);
    });
  });

  describe('#ownsAtleastOneOrg', () => {
    it('returns true if user owns at least on org', function () {
      expect(utils.ownsAtleastOneOrg({ organizationMemberships: orgs })).toBe(true);
    });
    it('returns false otherwise', function () {
      expect(utils.ownsAtleastOneOrg({ organizationMemberships: [orgs[1]] })).toBe(false);
      expect(utils.ownsAtleastOneOrg({ organizationMemberships: [] })).toBe(false);
      expect(utils.ownsAtleastOneOrg({})).toBe(false);
    });
  });

  describe('#getOwnedOrgs', () => {
    it('returns a list of orgs the user is an owner of', function () {
      expect(utils.getOwnedOrgs({ organizationMemberships: orgs })).toEqual([orgs[0]]);
    });
    it('returns an empty list if user owns no orgs', function () {
      expect(utils.getOwnedOrgs({ organizationMemberships: [orgs[1]] })).toEqual([]);
    });
  });

  describe('#getFirstOwnedOrgWithoutSpaces', () => {
    let testGetFirstOwnedOrgWithoutSpaces;
    beforeEach(function () {
      testGetFirstOwnedOrgWithoutSpaces = (spacesByOrg, assertion) => {
        const org = utils.getFirstOwnedOrgWithoutSpaces(
          {
            organizationMemberships: orgs,
          },
          spacesByOrg
        );

        assertion(org);
      };
    });
    it('returns the first org the user owns that has no spaces', function () {
      testGetFirstOwnedOrgWithoutSpaces({ 'org-owner': [] }, (org) =>
        expect(org).toBe(orgs[0].organization)
      );
      testGetFirstOwnedOrgWithoutSpaces({}, (org) => expect(org).toBe(orgs[0].organization));
    });
    it('returns undefined otherwise', function () {
      testGetFirstOwnedOrgWithoutSpaces({ 'org-owner': [1] }, (org) => expect(org).toBeUndefined());
    });
  });

  describe('#isAutomationTestUser', () => {
    let assertOnEmails;
    beforeEach(function () {
      assertOnEmails = function (emails, value) {
        emails.forEach((email) => {
          expect(utils.isAutomationTestUser({ email })).toEqual(value);
        });
      };
    });

    it('returns true for users whose email matches the automation test user email pattern', function () {
      const userEmails = [
        'autotest+quirely_orgowner_worker1@contentful.com',
        'autotest+flinkly_orgowner_worker1@contentful.com',
        'autotest+flinkly_orgmember_worker1@contentful.com',
        'autotest+flinkly_orgmember_developer@contentful.com',
        'autotest+flinkly_newuser_1235_1235@contentful.com',
      ];

      assertOnEmails(userEmails, true);
    });

    it('returns false for all non test automation users', function () {
      const userEmails = [
        'potato@contentful.com',
        'autotest@contentful.com',
        'something@gmail.com',
        'omg@bbq.net',
      ];

      assertOnEmails(userEmails, false);
    });
  });

  describe('#isUserOrgCreator', () => {
    const makeUserWithId = (id) => ({ sys: { id } });
    const makeOrgCreatedByUserWithId = (id) => ({ sys: { createdBy: { sys: { id } } } });

    it('returns true if the current org was created by the current user', function () {
      expect(utils.isUserOrgCreator(makeUserWithId(1), makeOrgCreatedByUserWithId(1))).toEqual(
        true
      );
    });

    it('returns false if the current org was not created by the current user', function () {
      expect(utils.isUserOrgCreator(makeUserWithId(1), makeOrgCreatedByUserWithId(2))).toEqual(
        false
      );
    });

    it('throws if user is malformed', function () {
      expect(() => utils.isUserOrgCreator({}, makeOrgCreatedByUserWithId(1))).toThrow(
        new Error('Expected user to be an object')
      );
    });

    it('throws if org is malformed', function () {
      expect(() => utils.isUserOrgCreator(makeUserWithId(42), {})).toThrow(
        new Error('Expected org to be an object')
      );
    });
  });

  describe('#getUserSpaceRoles', () => {
    it('includes "admin" in the array in case of admin', function () {
      const space = {
        spaceMember: {
          admin: true,
          roles: [],
        },
      };
      const roles = utils.getUserSpaceRoles(space);
      expect(roles).toContain('admin');
    });

    it('does not include "admin" in the array in case of not admin', function () {
      const space = {
        spaceMember: {
          admin: false,
          roles: [{ name: 'Some' }],
        },
      };
      const roles = utils.getUserSpaceRoles(space);
      expect(roles).toEqual(['some']);
    });

    it('converts role names to lowercase', function () {
      const space = {
        spaceMember: {
          admin: false,
          roles: [{ name: 'SoMe' }],
        },
      };
      const roles = utils.getUserSpaceRoles(space);
      expect(roles).toContain('some');
    });
  });
});
