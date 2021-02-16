import type { AddPatch, ReplacePatch, TestPatch } from 'json-patch';
import type { Operation } from 'fast-json-patch';
import { compare } from 'fast-json-patch';
import deepEqual from 'fast-deep-equal';
import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import isUndefined from 'lodash/isUndefined';
import set from 'lodash/set';
import { Entity } from 'app/entity_editor/Document/types';

type OverrideableOpPatch = AddPatch | ReplacePatch | TestPatch;

interface Options {
  diffNestedValues: boolean;
}

function isNestedValue(fieldValue): fieldValue is Array<unknown> | object {
  return isPlainObject(fieldValue) || Array.isArray(fieldValue);
}

function canAppendOverride(path: Operation): path is OverrideableOpPatch {
  // `compare` doesn't care about superfluous values, but the OpPatch type does,
  // so we should only add the `value` property when applicable
  return path.op === 'add' || path.op === 'replace' || path.op === 'test';
}

function isAddingToNewField(original: Entity, updated: Entity, fieldName: string): boolean {
  // This is only salient if there is no content for any field.
  // We need to check for this because otherwise patches like
  // [{ "op": "add", "path": "/fields/fieldName/en-US", "value": "foo" }]
  // will fail, since the patch library will try to reach the
  // unreachable deep locale property.
  return !get(original, ['fields', fieldName]) && get(updated, ['fields', fieldName]);
}

type DiffableEntity = Omit<Entity, 'sys'>;

export function createJsonPatch(
  originalData: Entity,
  updatedData: Entity,
  options: Options = { diffNestedValues: false }
) {
  const originalFields = originalData.fields || {};
  const updatedFields = updatedData.fields || {};

  // Fields always needs to exist,
  // otherwise clearing an entry becomes impossible
  const originalToDiff: DiffableEntity = { fields: {} };
  const updatedToDiff: DiffableEntity = { fields: {} };

  // If metadata property exists on the original & updated entry,
  // allow diffing on metadata.
  // This is needed because the content tags feature isn't in GA
  // yet. If the original data doesn't have metadata, we can infer
  // from that that the content tags feature isn't enabled.
  // TODO: remove this when content tags goes into GA.
  if (originalData.metadata && updatedData.metadata) {
    originalToDiff.metadata = originalData.metadata;
    updatedToDiff.metadata = updatedData.metadata;
  }

  const pathOverrides: { [path: string]: unknown } = {};

  const allFields = new Set([...Object.keys(originalFields), ...Object.keys(updatedFields)]);

  for (const fieldName of allFields) {
    if (!isAddingToNewField(originalData, updatedData, fieldName)) {
      // The field itself also always needs to exist because otherwise
      // removing the contents of a field removes the entire field,
      // which may not be covered by the paths constraint.
      set(originalToDiff, ['fields', fieldName], {});
      set(updatedToDiff, ['fields', fieldName], {});
    }

    // In this case we actually want something like `null` to also
    // become an empty object in order for `Object.keys` not to error
    const originalField = get(originalFields, [fieldName]) || {};
    const updatedField = get(updatedFields, [fieldName]) || {};

    const allLocales: Set<string> = new Set([
      ...Object.keys(originalField),
      ...Object.keys(updatedField),
    ]);

    for (const locale of allLocales) {
      const originalValue = get(originalFields, [fieldName, locale]);
      const updatedValue = get(updatedFields, [fieldName, locale]);

      if (deepEqual(originalValue, updatedValue)) {
        // Both are equal, so just set both to `true`
        // to ensure that the diffing will not try to compare
        // the objects again
        set(originalToDiff, ['fields', fieldName, locale], true);
        set(updatedToDiff, ['fields', fieldName, locale], true);
        continue;
      }

      if (isUndefined(updatedValue)) {
        // If the value is not there in the update,
        // then it must have been deleted, so we need to set the original value only
        set(originalToDiff, ['fields', fieldName, locale], originalValue);
        continue;
      }

      if (isUndefined(originalValue)) {
        // If the original value is undefined but the updated is not
        // - which is implied by the failing isEqual check -
        // then this will just be a creation and we can put the whole value there and continue
        set(updatedToDiff, ['fields', fieldName, locale], updatedValue);
        continue;
      }

      if (
        (isNestedValue(originalValue) || isNestedValue(updatedValue)) &&
        !options.diffNestedValues
      ) {
        // The fields are not the same, and they are undiffable,
        // so we need to put a placeholder value in place that always fails diffing
        // which we can then replace with the full object again later
        const path = `/fields/${fieldName}/${locale}`;
        set(pathOverrides, [path], updatedValue);

        set(originalToDiff, ['fields', fieldName, locale], false);
        set(updatedToDiff, ['fields', fieldName, locale], true);
        continue;
      }

      // Both are not equal, but they are diffable,
      // so just set their values and continue
      set(originalToDiff, ['fields', fieldName, locale], originalValue);
      set(updatedToDiff, ['fields', fieldName, locale], updatedValue);
    }
  }

  const diff: Operation[] = compare(originalToDiff, updatedToDiff);

  for (const patch of diff) {
    const override = pathOverrides[patch.path];
    if (override && canAppendOverride(patch)) {
      patch.value = override;
    }
  }

  return diff;
}
