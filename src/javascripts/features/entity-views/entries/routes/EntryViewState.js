import React, { useEffect, useState } from 'react';
import snapshotsRoute from 'app/snapshots';
import { CustomRouter, RouteErrorBoundary, Route, Routes } from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import { EntryView } from '../EntryView';
import { entryDetail } from 'app/entity_editor/cfSlideInEditor';
import { initSequenceContext, clearSequenceContext } from 'analytics/sequenceContext';
import * as random from 'utils/Random';

function EntriesList() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initSequenceContext({ sequence_key: random.id() });
    setLoaded(true);
    return () => {
      clearSequenceContext();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return <EntryView />;
}

const EntriesListRouter = () => {
  const [basename] = window.location.pathname.split('entries');
  return (
    <CustomRouter splitter="entries">
      <RouteErrorBoundary>
        <Routes basename={basename + 'entries'}>
          <Route name="spaces.detail.entries.list" path="/" element={<EntriesList />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const list = {
  name: 'list',
  url: '',
  component: EntriesListRouter,
};

export const entryViewState = {
  withSnapshots: entriesBaseState(true),
  withoutSnapshots: entriesBaseState(false),
};

function entriesBaseState(withSnapshots) {
  return {
    name: 'entries',
    url: '/entries',
    abstract: true,
    children: [list, entryDetail(withSnapshots ? [snapshotsRoute] : [])],
  };
}
