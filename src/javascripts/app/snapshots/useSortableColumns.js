import { useState } from 'react';
import { get, reverse } from 'lodash';
import moment from 'moment';

const useSortableColumns = ({ snapshots, setSnapshots }) => {
  const [sortOrder, setSortOrder] = useState({});
  const [isAscending, setIsAscending] = useState(true);

  const handleOrdering = sorted => {
    const results = [...sorted];
    if (!isAscending) reverse(results);
    setSnapshots(results);
    setIsAscending(!isAscending);
  };

  const sortByDate = () => {
    const sorted = snapshots.sort(
      (a, b) => moment(a.sys.createdAt).unix() - moment(b.sys.createdAt).unix()
    );
    handleOrdering(sorted);
  };

  const sortByLastEdited = () => {
    setSortOrder({ byLastEdited: true });
    sortByDate();
  };

  const sortAsStringAtPath = stringPropertyPath => {
    const sorted = snapshots.sort((a, b) => {
      const propA = get(a, stringPropertyPath, '');
      const propB = get(b, stringPropertyPath, '');
      if (propA > propB) return 1;
      if (propA < propB) return -1;
      return 0;
    });
    handleOrdering(sorted);
  };

  const sortByEditor = () => {
    setSortOrder({ byEditor: true });
    sortAsStringAtPath('sys.createdBy.authorName');
  };

  const sortByStatus = () => {
    setSortOrder({ byStatus: true });
    sortAsStringAtPath('sys.snapshotType');
  };

  const sortBy = { lastEdited: sortByLastEdited, editor: sortByEditor, status: sortByStatus };
  const sort = { order: sortOrder, icon: isAscending ? 'ArrowDown' : 'ArrowUp' };
  return [sort, sortBy];
};

export default useSortableColumns;
