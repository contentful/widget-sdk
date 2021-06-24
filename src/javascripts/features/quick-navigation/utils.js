import { getSpaceContext } from 'classes/spaceContext';
import { getSectionVisibility } from 'access_control/AccessChecker';
import { includes, get, orderBy, compact } from 'lodash';
import TheLocaleStore from 'services/localeStore';
import * as EntityHelpers from 'app/entity_editor/entityHelpers';
import { hasEnvironmentSectionInUrl } from 'core/react-routing/hasEnvironmentSectionInUrl';
import { routes } from 'core/react-routing';

const RESULTS_LIMIT = 20;
export const MIN_QUERY_LENGTH = 2;

const buildPathParams = (id, type) => {
  const params = {};
  if (type === 'entries') {
    params.entryId = id;
  } else if (type === 'assets') {
    params.assetId = id;
  } else {
    params.contentTypeId = id;
  }

  const withEnvironment = hasEnvironmentSectionInUrl();

  if (type === 'content_types') {
    return routes['content_types.detail']({ withEnvironment }, { contentTypeId: id });
  }

  const path = withEnvironment
    ? ['spaces', 'environment', type, 'detail']
    : ['spaces', 'detail', type, 'detail'];

  return { path, params };
};

const queryEntries = async (query) => {
  const spaceContext = getSpaceContext();

  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const entityHelpers = EntityHelpers.newForLocale(defaultLocaleCode);

  if (!getSectionVisibility().entry) {
    return {
      results: [],
      total: 0,
    };
  }

  const { items, total } = await spaceContext.cma.getEntries({
    query,
    'sys.archivedAt[exists]': 'false', // Ensures we only get non-archived entities
    order: '-sys.updatedAt',
    limit: RESULTS_LIMIT,
  });

  const results = await Promise.all(
    items.map(async (entity) => ({
      title: (await entityHelpers.entityTitle(entity)) || 'Untitled',
      type: 'entries',
      sys: get(entity, ['sys'], {}),
      contentType: get(entity, ['sys', 'contentType', 'sys', 'id'], ''),
      link: buildPathParams(get(entity, ['sys', 'id'], ''), 'entries'),
    }))
  );

  return {
    results,
    total,
  };
};

const queryAssets = async (query) => {
  const spaceContext = getSpaceContext();

  const defaultLocaleCode = TheLocaleStore.getDefaultLocale().code;
  const entityHelpers = EntityHelpers.newForLocale(defaultLocaleCode);

  if (!getSectionVisibility().asset) {
    return {
      results: [],
      total: 0,
    };
  }

  const { items, total } = await spaceContext.cma.getAssets({
    query,
    'sys.archivedAt[exists]': 'false', // Ensures we only get non-archived entitie
    order: '-sys.updatedAt',
    limit: RESULTS_LIMIT,
  });

  const results = await Promise.all(
    items.map(async (entity) => ({
      title: (await entityHelpers.entityTitle(entity)) || 'Untitled',
      type: 'assets',
      sys: get(entity, ['sys'], {}),
      link: buildPathParams(get(entity, ['sys', 'id'], ''), 'assets'),
    }))
  );

  return {
    results,
    total,
  };
};

const queryContentTypes = (query) => {
  const spaceContext = getSpaceContext();

  if (!getSectionVisibility().contentType) {
    return {
      results: [],
      total: 0,
    };
  }

  const lowerCaseQuery = query.toLowerCase();
  const contentTypes = spaceContext.publishedCTs.getAllBare().map((ct) => ({
    title: ct.name || 'Untitled',
    sys: get(ct, ['sys'], {}),
    type: 'content_types',
    link: buildPathParams(get(ct, ['sys', 'id'], ''), 'content_types'),
    updatedAt: get(ct, ['sys', 'updatedAt'], ''),
  }));

  const matchingContentTypes = contentTypes.filter((ct) =>
    includes(ct.title.toLowerCase(), lowerCaseQuery)
  );

  return {
    results: orderBy(matchingContentTypes, ['updatedAt'], ['desc']).slice(0, RESULTS_LIMIT),
    total: matchingContentTypes.length,
  };
};

const linksToSearch = {
  contentTypes: {
    type: 'search_link',
    linkType: 'content_types',
    title: 'Content Types',
  },
  entries: {
    type: 'search_link',
    linkType: 'entries',
    title: 'Entries',
  },
  assets: {
    type: 'search_link',
    linkType: 'assets',
    title: 'Assets',
  },
};

export const getSearchResults = async (query) => {
  query = query.trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const [filteredEntries, filteredAssets, filteredContentTypes] = await Promise.all([
    queryEntries(query),
    queryAssets(query),
    queryContentTypes(query),
  ]);

  const results = [
    ...filteredEntries.results,
    filteredEntries.total > RESULTS_LIMIT && {
      ...linksToSearch.entries,
      total: filteredEntries.total,
    },
    ...filteredAssets.results,
    filteredAssets.total > RESULTS_LIMIT && {
      ...linksToSearch.assets,
      total: filteredAssets.total,
    },
    ...filteredContentTypes.results,
    filteredContentTypes.total > RESULTS_LIMIT && {
      ...linksToSearch.contentTypes,
      total: filteredContentTypes.total,
    },
  ];

  return compact(results);
};
