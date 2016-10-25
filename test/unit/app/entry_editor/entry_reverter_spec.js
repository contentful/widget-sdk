'use strict';

describe('entryReverter factory', function () {
  let entry;
  beforeEach(function () {
    module('contentful/test');

    const cfStub = this.$inject('cfStub');
    const createEntryReverter = this.$inject('entryReverter');

    const space = cfStub.space('testSpace');
    entry = cfStub.entry(space, 'testEntry', 'testType', {}, {
      sys: {
        publishedVersion: 1,
        version: 5
      },
      fields: {
        title: '!@#$'
      }
    });

    this.entryReverter = createEntryReverter(entry);
    this.entryReverter.init();
  });

  it('#canRevertToPrevious', function () {
    expect(this.entryReverter.canRevertToPrevious()).toBe(false);
    entry.data.sys.version = 6;
    expect(this.entryReverter.canRevertToPrevious()).toBe(true);
  });

  it('#getPreviousData', function () {
    entry.data.sys.version = 6;
    entry.data.fields.title = '&&&&';
    expect(this.entryReverter.getPreviousData().fields).toEqual({title: '!@#$'});
  });

  it('#revertedToPrevious', function () {
    entry.data.sys.version = 6;
    entry.data.fields.title = '&&&&';
    expect(this.entryReverter.canRevertToPrevious()).toBe(true);
    this.entryReverter.revertedToPrevious();
    expect(this.entryReverter.canRevertToPrevious()).toBe(false);
  });
});
