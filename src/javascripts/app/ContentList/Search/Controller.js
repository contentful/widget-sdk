import { pick, extend, get, isEmpty, range, flatten } from 'lodash';
import ReloadNotification from 'app/common/ReloadNotification';
import { Notification } from '@contentful/forma-36-react-components';
import * as Tracking from 'analytics/events/SearchAndViews';
import * as SystemFields from 'data/SystemFields';

const isInvalidQueryError = (err) => {
  return err?.statusCode === 400 || err?.statusCode === 422;
};

const isForbiddenQueryError = (err) => {
  return err?.statusCode === 403 || err?.statusCode === 404;
};

const isUnknownContentTypeError = (err) => {
  const errors = get(err, ['body', 'details', 'errors'], []);

  return errors.some(
    ({ name, value }) => name === 'unknownContentType' && value === 'DOESNOTEXIST'
  );
};

const isResponseTooBigError = (err, query, chunkSize) => {
  return (
    err.status === 400 &&
    get(err, 'body.message', '').startsWith('Response size too big') &&
    get(query, 'limit') !== undefined &&
    // reaching chunk size 1 is where recursion ends for sure in very few steps,
    // as chunk size is halved with every level of recursion
    (chunkSize === null || chunkSize > 1)
  );
};

const filterOutDeleted = (entities) => {
  return entities.filter((entity) => !entity.isDeleted());
};

const createSearchController = ({
  onLoading,
  onUpdate,
  fetchEntities,
  cache,
  keys,
  getListQuery,
  listViewContext,
  paginator,
}) => {
  const getViewSearchState = (view) => pick(view, keys.search);

  const hasQuery = () =>
    Object.values(pick(listViewContext.getView(), keys.query)).some((value) => !isEmpty(value));

  const getQueryOptions = () => {
    const view = listViewContext.getView();
    return extend(getViewSearchState(view), {
      order: get(view, 'order', SystemFields.getDefaultOrder()),
      paginator,
    });
  };

  const refreshEntityCaches = (entities) => {
    const { contentTypeId, displayedFieldIds } = listViewContext.getView();
    if (contentTypeId && cache) {
      const requests = [];
      if (cache.entry) {
        const request = cache.entry.resolveLinkedEntities(entities);
        requests.push(request);
        cache.entry.setDisplayedFieldIds(displayedFieldIds);
      }
      if (cache.asset) {
        const request = cache.asset.resolveLinkedEntities(entities);
        requests.push(request);
        cache.asset.setDisplayedFieldIds(displayedFieldIds);
      }
      // Update result list with cached entities
      Promise.all(requests).finally(() => onUpdate([...entities]));
    }
  };

  const handleEntitiesError = (err) => {
    const isInvalidQuery = isInvalidQueryError(err);
    const isForbidden = isForbiddenQueryError(err);
    const isUnknownContentType = isUnknownContentTypeError(err);

    // Reset the view only if the UI was not edited yet.
    if (isInvalidQuery || isForbidden) {
      // invalid search query, let's reset the view...
      listViewContext.setView({});
      updateEntities();
    } else if (isUnknownContentType) {
      // ...and let it request assets again after notifying a user
      const { contentTypeId } = listViewContext.getView();
      if (contentTypeId) {
        Notification.error(
          `Provided Content Type "${contentTypeId}" does not exist. The content type filter has been reset to "Any"`
        );
      }
      listViewContext.setViewKey('contentTypeId', null);
      updateEntities();
    } else {
      Notification.error('We detected an invalid search query. Please try again.');
    }
  };

  const handleEntitiesResponse = (entities) => {
    let sanitizedEntities = [];
    if (!entities) {
      paginator.setTotal(0);
    } else if (Array.isArray(entities)) {
      paginator.setTotal(entities.total);

      if (paginator.isBeyondLast()) {
        const lastPage = paginator.getPageCount() - 1;
        paginator.setPage(lastPage);
      }

      sanitizedEntities = filterOutDeleted(entities);
    }

    return sanitizedEntities;
  };

  const fetchEntitiesInChunks = async (query, chunkSize) => {
    const skipsForChunks = range(query.skip, query.skip + query.limit, chunkSize);
    const chunks = await Promise.all(
      skipsForChunks.map((skip) => fetchEntities({ ...query, skip, limit: chunkSize }))
    );
    const entities = flatten(chunks);
    entities.total = chunks[0].total;
    return entities;
  };

  async function updateEntities(chunkSize = null) {
    onLoading(true);

    const query = await getListQuery(getQueryOptions());
    try {
      let entities;

      if (chunkSize === null || query.limit === undefined) {
        entities = await fetchEntities(query);
      } else {
        entities = await fetchEntitiesInChunks(query, chunkSize);
      }

      const currPage = paginator.getPage();
      if (currPage > 0 && !entities?.length) {
        paginator.setPage(currPage - 1);
        updateEntities(chunkSize);
        return;
      }

      Tracking.searchPerformed(listViewContext.getView(), entities.total);
      const filteredEntities = handleEntitiesResponse(entities);
      refreshEntityCaches(filteredEntities);
      onUpdate(filteredEntities);
    } catch (err) {
      if (isResponseTooBigError(err, query, chunkSize)) {
        const oldChunkSize = chunkSize === null ? query.limit : chunkSize;
        updateEntities(Math.floor(oldChunkSize / 2));
      } else {
        ReloadNotification.apiErrorHandler(err);
        handleEntitiesError(err, query);
      }
    } finally {
      onLoading(false);
    }
  }

  return {
    hasQuery,
    updateEntities,
  };
};

export default createSearchController;
