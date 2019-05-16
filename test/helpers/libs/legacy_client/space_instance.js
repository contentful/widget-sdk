import { cloneDeep } from 'lodash';
import describeEntry from './entry';
import describeAsset from './asset';
import describeContentType from './content_type';

export default function spaceInstanceDescription(serverSpaceData) {
  describe('instance', function() {
    beforeEach(function() {
      this.space = this.client.newSpace(cloneDeep(serverSpaceData));
    });

    /**
     * Entities
     */
    describeEntry();
    describeAsset();
    describeContentType();

    it('disabled #update, #save and #delete', function() {
      expect(this.space.update).toThrow();
      expect(this.space.save).toThrow();
      expect(this.space.delete).toThrow();
    });

    it('#isOwner(user) is true for creator', function() {
      const creator = { sys: { id: 'creator' } };
      const user = { sys: { id: 'uid' } };
      const organization = { sys: { id: 'oid' } };
      this.space.data.organization = organization;
      organization.sys.createdBy = creator;
      expect(this.space.isOwner(creator)).toBe(true);
      expect(this.space.isOwner(user)).toBe(false);
    });

    describe('#isAdmin(user)', function() {
      it('is true for admin member', function() {
        const user = { sys: { id: 'uid' } };
        const admin = { sys: { id: 'admin' } };
        this.space.data.spaceMembership = {
          admin: true,
          user: admin
        };
        expect(this.space.isAdmin(admin)).toBe(true);
        expect(this.space.isAdmin(user)).toBe(false);
      });

      it('is false for non admin member', function() {
        const user = { sys: { id: 'uid' } };
        this.space.data.spaceMembership = {
          admin: false,
          user: user
        };
        expect(this.space.isAdmin(user)).toBe(false);
      });
    });
  });
}
