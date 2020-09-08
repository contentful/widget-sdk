import React from 'react';
import mitt from 'mitt';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import { deepFreeze } from 'utils/Freeze';
import { cloneDeep } from 'lodash';
import VersionsWidgetContainer, { PREVIEW_COUNT } from './VersionsWidgetContainer';
import VersionsWidget from './VersionsWidget';
import SidebarEventTypes from '../SidebarEventTypes';
import APIClient from 'data/APIClient';

const mockGetEntrySnapshots = jest.fn();
jest.mock('data/APIClient', () => {
  return jest.fn().mockImplementation(() => {
    return { getEntrySnapshots: mockGetEntrySnapshots };
  });
});

const PUBLISHED_ENTRY_SYS = deepFreeze({
  id: 'SOME_ID_123',
  type: 'Entry',
  publishedVersion: 10,
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
      publishedVersion: entrySys.publishedVersion,
    });
    await Promise.resolve();
    await wrapper.update();
  }

  beforeEach(() => {
    emitter = mitt();
    APIClient.mockClear();
    mockGetEntrySnapshots.mockClear();
  });

  it('renders VersionsWidget with isLoaded=false by default', () => {
    const { wrapper } = render();
    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: null,
      error: null,
      isLoaded: false,
      versions: [],
    });
  });

  it('gets entry snapshots when UPDATED_VERSIONS_WIDGET was emitted for the first time', async () => {
    mockGetEntrySnapshots.mockResolvedValueOnce({
      items: [],
    });

    const { wrapper } = render();

    await emitUpdatedVersionsWidgetEvent(PUBLISHED_ENTRY_SYS);

    expect(mockGetEntrySnapshots).toHaveBeenCalledWith(PUBLISHED_ENTRY_SYS.id, {
      limit: PREVIEW_COUNT,
    });
    expect(mockGetEntrySnapshots).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    await wrapper.update();

    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: PUBLISHED_ENTRY_SYS.id,
      error: null,
      isLoaded: true,
      versions: [],
    });
  });

  it('gets entry snapshots only when publishedVersion is changed', async () => {
    mockGetEntrySnapshots.mockResolvedValueOnce({
      items: [],
    });

    const { wrapper } = render();
    const sys1 = { ...PUBLISHED_ENTRY_SYS, version: 101 };
    const sys2 = { ...sys1, version: sys1.version + 1 };
    await emitUpdatedVersionsWidgetEvent(sys1);
    await emitUpdatedVersionsWidgetEvent(sys2);

    expect(mockGetEntrySnapshots).toHaveBeenCalledWith(PUBLISHED_ENTRY_SYS.id, {
      limit: PREVIEW_COUNT,
    });
    expect(mockGetEntrySnapshots).toHaveBeenCalledTimes(1);

    const snapshots = [newSnapshotFromEntrySys(sys1), newSnapshotFromEntrySys(sys2)];
    mockGetEntrySnapshots.mockResolvedValueOnce({
      items: snapshots,
    });

    const sys3 = {
      ...sys2,
      version: sys2.version + 1,
      publishedVersion: sys2.version,
    };
    await emitUpdatedVersionsWidgetEvent(sys3);

    expect(mockGetEntrySnapshots).toHaveBeenCalledTimes(2);

    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: sys3.id,
      error: null,
      isLoaded: true,
      versions: expect.any(Array),
    });
  });

  it('decorates snapshots with `isCurrent`', async () => {
    const { wrapper } = render();
    const sys1 = { ...PUBLISHED_ENTRY_SYS, version: 101 };
    const nextVersion = sys1.version + 1;
    const sys2 = { ...sys1, version: nextVersion, publishedVersion: nextVersion };
    const snapshots = deepFreeze([newSnapshotFromEntrySys(sys1), newSnapshotFromEntrySys(sys2)]);

    mockGetEntrySnapshots.mockResolvedValueOnce({
      items: snapshots,
    });
    await emitUpdatedVersionsWidgetEvent(sys2);
    await wrapper.update();

    const expectedSnapshots = cloneDeep(snapshots);
    expectedSnapshots[0].sys.isCurrent = false;
    expectedSnapshots[1].sys.isCurrent = true;
    expect(wrapper.find(VersionsWidget).props().versions).toEqual(expectedSnapshots);
  });

  it('keeps initial fetching error after a sys update without published version bump', async () => {
    mockGetEntrySnapshots.mockRejectedValueOnce({});

    const { wrapper } = render();
    const expectError = async () => {
      await wrapper.update();
      expect(wrapper.find(VersionsWidget).props().error).toEqual(expect.any(String));
    };

    await emitUpdatedVersionsWidgetEvent({ ...PUBLISHED_ENTRY_SYS, version: 100 });
    await expectError();

    await emitUpdatedVersionsWidgetEvent({ ...PUBLISHED_ENTRY_SYS, version: 101 });
    await expectError();
  });
});

function newSnapshotFromEntrySys(entrySys) {
  return deepFreeze({ sys: { type: 'Snapshot' }, snapshot: { sys: entrySys } });
}
