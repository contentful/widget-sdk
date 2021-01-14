import {
  ACTION_NAMES,
  ACTION_NAMES_PRESENT_TENSE,
  ENTITY_PLURAL_NAMES,
  ENTITY_SINGULAR_NAMES,
} from './constants';
import { getEntityTitle } from 'app/entry_editor/EntryReferences/referencesService';

export async function compileResultMessages({ method, results, entityType }) {
  const entityName = (isPlural = false) =>
    isPlural
      ? ENTITY_PLURAL_NAMES[entityType].toLowerCase()
      : ENTITY_SINGULAR_NAMES[entityType].toLowerCase();
  const resultErrors = results.filter((result) => result.err);

  const successCount = results.length - resultErrors.length;
  const success = successCount
    ? `${successCount} ${entityName(successCount > 1)} ${ACTION_NAMES[method]} successfully`
    : undefined;

  // Gather all reasons
  const errors = [];

  const actionName = ACTION_NAMES_PRESENT_TENSE[method];

  // A tag that doesn't exist was specified (one failure per entry)
  const missingTags = resultErrors.filter(
    (result) => result.err.body && result.err.body.message === 'Tag not found'
  );
  const uniqueTagIds = missingTags
    .map((result) => result.err.body.details.id)
    .filter((tag, i, tags) => tags.indexOf(tag) == i);
  if (missingTags.length > 0) {
    errors.push([
      (await Promise.all(missingTags.map(getEntityInfoFromError))).filter(Boolean),
      `Failed to ${actionName} ${missingTags.length} ${entityName(
        missingTags.length > 1
      )} because some tags are missing (${uniqueTagIds.join(', ')}).`,
    ]);
  }

  // A version mismatch
  const versionMismatch = resultErrors.filter((result) => result.err.status === 409);
  if (versionMismatch.length > 0) {
    errors.push([
      (await Promise.all(versionMismatch.map(getEntityInfoFromError))).filter(Boolean),
      `Failed to ${actionName} ${versionMismatch.length} ${entityName(
        versionMismatch.length > 1
      )} because a newer version exists.`,
    ]);
  }

  // Permission denied
  const permissionDenied = resultErrors.filter((result) => result.err.status === 403);
  if (permissionDenied.length > 0) {
    errors.push([
      (await Promise.all(permissionDenied.map(getEntityInfoFromError))).filter(Boolean),
      `Failed to ${actionName} ${permissionDenied.length} ${entityName(
        permissionDenied.length > 1
      )} because you don't have permission for this action.`,
    ]);
  }

  // An entry has been deleted (it appears as a put to create without a content type?)
  const missingEntries = resultErrors.filter(
    (result) => result.err.body && result.err.body.message === 'Missing content type parameter'
  );
  if (missingEntries.length > 0) {
    errors.push([
      (await Promise.all(missingEntries.map(getEntityInfoFromError))).filter(Boolean),
      `Failed to ${actionName} ${missingEntries.length} ${entityName(
        missingEntries.length > 1
      )} because ${missingEntries.length === 1 ? 'it' : 'they'} could not be found.`,
    ]);
  }

  return { success, errors };
}

async function getEntityInfoFromError(error) {
  const entity = error.err?.request?.body;
  if (entity) {
    return [entity, await getEntityTitle(entity)];
  }
  return null;
}
