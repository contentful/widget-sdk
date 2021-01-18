import { cloneDeep } from 'lodash';
import describeEntry from './entry';
import describeAsset from './asset';
import describeContentType from './content_type';

export default function spaceInstanceDescription(serverSpaceData, context) {
  describe('instance', function () {
    beforeEach(function () {
      context.space = context.client.newSpace(cloneDeep(serverSpaceData));
    });

    /**
     * Entities
     */
    describeEntry(context);
    describeAsset(context);
    describeContentType(context);

    it('disabled #update, #save and #delete', function () {
      expect(context.space.update).toThrow();
      expect(context.space.save).toThrow();
      expect(context.space.delete).toThrow();
    });

    it('#isOwner(user) is true for creator', function () {
      const creator = { sys: { id: 'creator' } };
      const user = { sys: { id: 'uid' } };
      const organization = { sys: { id: 'oid' } };
      context.space.data.organization = organization;
      organization.sys.createdBy = creator;
      expect(context.space.isOwner(creator)).toBe(true);
      expect(context.space.isOwner(user)).toBe(false);
    });

    describe('#isAdmin(user)', function () {
      it('is true for admin member', function () {
        const user = { sys: { id: 'uid' } };
        const admin = { sys: { id: 'admin' } };
        context.space.data.spaceMember = {
          admin: true,
          sys: {
            user: admin,
          },
        };
        expect(context.space.isAdmin(admin)).toBe(true);
        expect(context.space.isAdmin(user)).toBe(false);
      });

      it('is false for non admin member', function () {
        const user = { sys: { id: 'uid' } };
        context.space.data.spaceMember = {
          admin: false,
          sys: {
            user: user,
          },
        };
        expect(context.space.isAdmin(user)).toBe(false);
      });
    });
  });
}
