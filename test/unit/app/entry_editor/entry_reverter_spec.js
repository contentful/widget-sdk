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

  it('#canRevertToPublished - published entry', function () {
    expect(this.entryReverter.canRevertToPublished()).toBe(true);
  });

  it('#canRevertToPublished - unpublished entry', function () {
    entry.data.sys.publishedVersion = undefined;
    expect(this.entryReverter.canRevertToPublished()).toBe(false);
  });

  it('#revertedToPublished', function () {
    expect(this.entryReverter.canRevertToPublished()).toBe(true);
    this.entryReverter.revertedToPublished();
    expect(this.entryReverter.canRevertToPublished()).toBe(false);
  });

  it('#publishedNewVersion', function () {
    expect(this.entryReverter.canRevertToPublished()).toBe(true);
    entry.data.sys.publishedVersion = 5;
    this.entryReverter.publishedNewVersion();
    entry.data.sys.version += 1;
    expect(this.entryReverter.canRevertToPublished()).toBe(false);
  });
});
