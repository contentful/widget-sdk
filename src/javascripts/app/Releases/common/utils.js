import { getReleasesIncludingEntity } from '../releasesService';
import { SET_RELEASES_INCLUDING_ENTRY } from '../state/actions';

/**
 * @param {import('@contentful/types').Release} release
 * @param {string} entityId
 */
const excludeEntityFromRelease = (release, entityId) =>
  release.entities.items.filter(({ sys: { id } }) => id !== entityId);

const fetchReleases = async (entityInfo, dispatch) => {
  const { id, type } = entityInfo;
  const fetchedReleases = await getReleasesIncludingEntity(id, type);

  dispatch({ type: SET_RELEASES_INCLUDING_ENTRY, value: fetchedReleases.items });
};

export { excludeEntityFromRelease, fetchReleases };
