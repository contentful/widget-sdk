import { uniq, difference } from 'lodash';

export default function createAppDefinitionLoader(appDefinitionsEndpoint, orgEndpoint) {
  return {
    getById,
    getByIds,
    getAllForCurrentOrganization,
    getKeysForAppDefinition,
  };

  async function getById(id) {
    const map = await getByIds([id]);
    const definition = map[id];

    if (definition) {
      return definition;
    } else {
      throw new Error(`Definition with ID ${id} couldn't be found.`);
    }
  }

  async function getByIds(ids) {
    if (!Array.isArray(ids)) {
      throw new Error('Expected an array of IDs.');
    }

    const uniqueIds = uniq(ids).filter((s) => typeof s === 'string' && s.length > 0);
    if (uniqueIds.length < 1) {
      return {};
    }

    // Try to fetch all from the public endpoint.
    const publicResponse = await appDefinitionsEndpoint({
      method: 'GET',
      path: [],
      query: { 'sys.id[in]': uniqueIds.join(',') },
    });

    const publicDefinitions = publicResponse.items;
    const fetchedIds = publicDefinitions.map((def) => def.sys.id);
    const missingIds = difference(uniqueIds, fetchedIds);

    // If there were some definitions we couldn't fetch from
    // the public endpoint, try to fetch them from the
    // organization-scoped endpoint.
    const orgDefinitions =
      missingIds.length > 0 ? await fetchFromOrganizationEndpoint(missingIds) : [];

    // Merge results, public definitions take precedence.
    const publicDefinitionsMap = makeMap(publicDefinitions);
    const orgDefinitionsMap = makeMap(orgDefinitions);

    return ids.reduce((acc, id) => {
      return {
        ...acc,
        [id]: publicDefinitionsMap[id] || orgDefinitionsMap[id] || null,
      };
    }, {});
  }

  function makeMap(definitions) {
    return definitions.reduce((acc, def) => {
      return { ...acc, [def.sys.id]: def };
    }, {});
  }

  async function fetchFromOrganizationEndpoint(ids) {
    const { items } = await orgEndpoint({
      method: 'GET',
      path: ['app_definitions'],
      query: { 'sys.id[in]': ids.join(',') },
    });

    return items;
  }

  async function getAllForCurrentOrganization() {
    const { items } = await orgEndpoint({
      method: 'GET',
      path: ['app_definitions'],
    });

    return items;
  }

  async function getKeysForAppDefinition(appDefinitionId) {
    const { items } = await orgEndpoint({
      method: 'GET',
      path: ['app_definitions', appDefinitionId, 'keys'],
    });

    return items;
  }
}
