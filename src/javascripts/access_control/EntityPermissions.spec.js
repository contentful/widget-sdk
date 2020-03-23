describe.skip('EntityPermissions', () => {
  // TODO:xxx rewrite to jest
  describe('#can()', () => {
    it('delegates to "accessChecker.canPerformActionOnEntity()"', () => {
      this.stubs.canPerformActionOnEntity.returns(true);
      expect(this.doc.permissions.can('publish')).toBe(true);

      this.stubs.canPerformActionOnEntity.returns(false);
      expect(this.doc.permissions.can('publish')).toBe(false);

      const entity = this.stubs.canPerformActionOnEntity.args[0][1];
      expect(entity.data.sys.id).toEqual('ENTITY_ID');
    });

    it('delegates "update" calls to "accessChecker.canUpdateEntry()"', () => {
      this.stubs.canUpdateEntry.returns(true);
      expect(this.doc.permissions.can('update')).toBe(true);

      this.stubs.canUpdateEntry.returns(false);
      expect(this.doc.permissions.can('update')).toBe(false);

      const entity = this.stubs.canUpdateEntry.args[0][0];
      expect(entity.data.sys.id).toEqual('ENTITY_ID');
    });

    it('delegates "update" calls to "accessChecker.canUpdateAsset()"', () => {
      const doc = this.createDoc('Asset');

      this.stubs.canUpdateAsset.returns(true);
      expect(doc.permissions.can('update')).toBe(true);

      this.stubs.canUpdateAsset.returns(false);
      expect(doc.permissions.can('update')).toBe(false);

      const entity = this.stubs.canUpdateAsset.args[0][0];
      expect(entity.data.sys.id).toEqual('ENTITY_ID');
    });

    it('throws when action is unknown', () => {
      const doc = this.createDoc();
      expect(_.partial(doc.permissions.can, 'abc')).toThrowError('Unknown entity action "abc"');
    });
  });

  describe('#canEditFieldLocale()', () => {
    it('returns false if `update` permission is denied', () => {
      this.stubs.canUpdateEntry.returns(false);
      expect(this.doc.permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(false);
    });

    it('delegates to "policyAccessChecker"', () => {
      this.stubs.canUpdateEntry.returns(true);
      this.stubs.canEditFieldLocale.returns(true);

      expect(this.doc.permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(true);

      this.stubs.canEditFieldLocale.returns(false);
      expect(this.doc.permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(false);

      const args = this.stubs.canEditFieldLocale.args[0];
      const [ctId, { apiName }, { code }] = args;
      expect(ctId).toBe('CT_ID');
      expect(apiName).toBe('FIELD');
      expect(code).toBe('LOCALE');
    });
  });
});
