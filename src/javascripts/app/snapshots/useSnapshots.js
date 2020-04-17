import { useState } from 'react';
import { get } from 'lodash';
import { getModule } from 'core/NgRegistry';
import Paginator from 'classes/Paginator';
import * as snapshotDecorator from 'app/snapshots/helpers/SnapshotDecorator';

const PER_PAGE = 20;
const paginator = Paginator.create(PER_PAGE);

const useSnapshots = ({ editorData }) => {
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const spaceContext = getModule('spaceContext');
    const getUnique = (items) => {
      return items
        .slice(0, paginator.getPerPage())
        .filter((snapshot) => snapshots.every(({ sys }) => sys.id !== snapshot.sys.id));
    };
    const entry = get(editorData, 'entity', {});
    const query = {
      skip: paginator.getSkipParam(),
      limit: paginator.getPerPage() + 1,
    };
    // TODO: Instead of duck punching snapshot entities and keeping the whole
    //  thing in memory, we should reduce it to a view friendly data structure
    //  with only relevant data to build the list.
    const { items } = await spaceContext.cma.getEntrySnapshots(editorData.entityInfo.id, query);
    paginator.setTotal((total) => total + items.length);

    const uniqueSnapshots = getUnique(items);

    const entrySys = get(entry, 'data.sys', {});
    let decoratedSnapshots = await snapshotDecorator.withCurrent(entrySys, uniqueSnapshots);
    decoratedSnapshots = await snapshotDecorator.withAuthorName(spaceContext, decoratedSnapshots);

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
