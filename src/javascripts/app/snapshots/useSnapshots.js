import { useState, useMemo } from 'react';
import { get } from 'lodash';
import Paginator from 'classes/Paginator';
import * as snapshotDecorator from 'app/snapshots/helpers/SnapshotDecorator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext';
import createCache from 'data/userCache';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { useSpaceEnvCMAClient } from 'core/services/usePlainCMAClient';

const PER_PAGE = 20;
const paginator = Paginator.create(PER_PAGE);

const useSnapshots = ({ editorData }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const { spaceEnvCMAClient } = useSpaceEnvCMAClient();
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const spaceEndpoint = useMemo(() => createSpaceEndpoint(currentSpaceId, currentEnvironmentId), [
    currentSpaceId,
    currentEnvironmentId,
  ]);
  const usersRepo = useMemo(() => createCache(spaceEndpoint), [spaceEndpoint]);

  const load = async () => {
    setLoading(true);
    const getUnique = (items) => {
      return items
        .slice(0, paginator.getPerPage())
        .filter((snapshot) => snapshots.every(({ sys }) => sys.id !== snapshot.sys.id));
    };
    const entry = get(editorData, 'entity', {});
    // TODO: Instead of duck punching snapshot entities and keeping the whole
    //  thing in memory, we should reduce it to a view friendly data structure
    //  with only relevant data to build the list.
    const { items } = await spaceEnvCMAClient.snapshot.getManyForEntry({
      entryId: editorData.entityInfo.id,
      query: {
        skip: paginator.getSkipParam(),
        limit: paginator.getPerPage() + 1,
      },
    });
    paginator.setTotal((total) => total + items.length);

    const uniqueSnapshots = getUnique(items);

    const entrySys = get(entry, 'data.sys', {});
    let decoratedSnapshots = await snapshotDecorator.withCurrent(entrySys, uniqueSnapshots);
    decoratedSnapshots = await snapshotDecorator.withAuthorName(usersRepo, decoratedSnapshots);

    setSnapshots([...snapshots, ...decoratedSnapshots]);
    setLoading(false);
  };

  const loadMore = () => {
    if (!isLoading && !paginator.isAtLast()) {
      paginator.next();
      load();
    }
  };

  const initSnapshots = () => {
    if (snapshots.length === 0) {
      paginator.setTotal(0);
      paginator.setPage(0);
      load();
    }
  };

  return [
    { snapshots, isLoading },
    { loadMore, setSnapshots, initSnapshots },
  ];
};

export default useSnapshots;
