import React from 'react';
import mitt from 'mitt';
import Enzyme from 'enzyme';
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

describe('EntrySidebar/VersionsWidgetContainer', () => {
  const render = () => {
    const emitter = mitt();

    const wrapper = Enzyme.shallow(<VersionsWidgetContainer emitter={emitter} />);

    return { emitter, wrapper };
  };

  beforeEach(() => {
    spaceContextMocked.cma.getEntrySnapshots.mockReset();
  });

  it('should render VersionsWidget with isLoaded=false by default', () => {
    const { wrapper } = render();
    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: null,
      error: null,
      isLoaded: false,
      versions: []
    });
  });

  it('should get entry snapshotss when UPDATED_VERSIONS_WIDGET was emitted for the first time', async () => {
    spaceContextMocked.cma.getEntrySnapshots.mockResolvedValueOnce({
      items: []
    });

    const { wrapper, emitter } = render();

    emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
      entrySys: {
        id: '123'
      },
      publishedVersion: 1
    });

    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledWith('123', {
      limit: PREVIEW_COUNT
    });
    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    await wrapper.update();

    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: '123',
      error: null,
      isLoaded: true,
      versions: []
    });
  });

  it('should get entry snapshots only when publishedVersion is changed', async () => {
    spaceContextMocked.cma.getEntrySnapshots.mockResolvedValueOnce({
      items: []
    });

    const { wrapper, emitter } = render();

    emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
      entrySys: {
        id: '123'
      },
      publishedVersion: 1
    });

    await Promise.resolve();
    await wrapper.update();

    emitter.emit(SidebarEventTypes.UPDATED_VERSIONS_WIDGET, {
      entrySys: {
        id: '123'
      },
      publishedVersion: 1
    });

    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledWith('123', {
      limit: PREVIEW_COUNT
    });
    expect(spaceContextMocked.cma.getEntrySnapshots).toHaveBeenCalledTimes(1);

    expect(wrapper.find(VersionsWidget).props()).toEqual({
      entryId: '123',
      error: null,
      isLoaded: true,
      versions: []
    });
  });
});
