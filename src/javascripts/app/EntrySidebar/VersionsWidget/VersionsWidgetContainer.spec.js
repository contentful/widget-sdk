import React from 'react';
import mitt from 'mitt';
import Enzyme from 'enzyme';
import { deepFreeze } from 'utils/Freeze.es6';
import { cloneDeep } from 'lodash';
import VersionsWidgetContainer, { PREVIEW_COUNT } from './VersionsWidgetContainer.es6';
import VersionsWidget from './VersionsWidget.es6';
import spaceContextMocked from 'ng/spaceContext';
import SidebarEventTypes from '../SidebarEventTypes.es6';

jest.mock('ng/$q', () => ({}), { virtual: true });

jest.mock('ng/spaceContext', () => ({
  cma: {
    getEntrySnapshots: jest.fn()
  }
}));

const PUBLISHED_ENTRY_SYS = deepFreeze({
  id: 'SOME_ID_123',
  type: 'Entry',
  publishedVersion: 10
});

describe('EntrySidebar/VersionsWidgetContainer', () => {
  let emitter, wrapper;

  const render = () => {
    wrapper = Enzyme.shallow(<VersionsWidgetContainer emitter={emitter} />);
    return { wrapper };
  };

  async function emitUpdatedVersionsWidgetEvent(entrySys) {
    emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
      entrySys: deepFreeze(cloneDeep(entrySys)),
      publishedVersion: entrySys.publishedVersion
    });
    await Promise.resolve();
    await wrapper.update();
  }

  beforeEach(() => {
    emitter = mitt();
    spaceContextMocked.cma.getEntrySnapshots.mockReset();
  });

  it('renders VersionsWidget with isLoaded=false by default', () => {
    const { wrapper } = render();
    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: null,
      error: null,
      isLoaded: false,
      versions: []
    });
  });

  it('gets entry snapshots when UPDATED_VERSIONS_WIDGET was emitted for the first time', async () => {
    spaceContextMocked.cma.getEntrySnapshots.mockResolvedValueOnce({
      items: []
    });

    const { wrapper } = render();

    await emitUpdatedVersionsWidgetEvent(PUBLISHED_ENTRY_SYS);

    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledWith(PUBLISHED_ENTRY_SYS.id, {
      limit: PREVIEW_COUNT
    });
    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    await wrapper.update();

    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: PUBLISHED_ENTRY_SYS.id,
      error: null,
      isLoaded: true,
      versions: []
    });
  });

  it('gets entry snapshots only when publishedVersion is changed', async () => {
    spaceContextMocked.cma.getEntrySnapshots.mockResolvedValueOnce({
      items: []
    });

    const { wrapper } = render();
    const sys1 = { ...PUBLISHED_ENTRY_SYS, version: 101 };
    const sys2 = { ...sys1, version: sys1.version + 1 };
    await emitUpdatedVersionsWidgetEvent(sys1);
    await emitUpdatedVersionsWidgetEvent(sys2);

    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledWith(PUBLISHED_ENTRY_SYS.id, {
      limit: PREVIEW_COUNT
    });
    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledTimes(1);

    const snapshots = [newSnapshotFromEntrySys(sys1), newSnapshotFromEntrySys(sys2)];
    spaceContextMocked.cma.getEntrySnapshots.mockResolvedValueOnce({
      items: snapshots
    });

    const sys3 = {
      ...sys2,
      version: sys2.version + 1,
      publishedVersion: sys2.version
    };
    await emitUpdatedVersionsWidgetEvent(sys3);

    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledTimes(2);

    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: sys3.id,
      error: null,
      isLoaded: true,
      versions: expect.any(Array)
    });
  });

  it('keeps initial fetching error after a sys update without published version bump', async () => {
    spaceContextMocked.cma.getEntrySnapshots.mockRejectedValueOnce({});

    const { wrapper } = render();
    const expectError = () =>
      expect(wrapper.find(VersionsWidget).props().error).toEqual(expect.any(String));

    await emitUpdatedVersionsWidgetEvent({ ...PUBLISHED_ENTRY_SYS, version: 100 });
    expectError();

    await emitUpdatedVersionsWidgetEvent({ ...PUBLISHED_ENTRY_SYS, version: 101 });
    expectError();
  });
});

function newSnapshotFromEntrySys(entrySys) {
  return { sys: { type: 'Snapshot' }, snapshot: { sys: entrySys } };
}
