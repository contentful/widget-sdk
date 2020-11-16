import { get } from 'lodash';
import type { Entity } from '@contentful/types';
import type { Document, Node, Block } from '@contentful/rich-text-types';

type EntityType = 'Link' | 'Entry' | 'Asset';
type EntityLinksMap = Record<EntityType, Map<string, Entity>>;

interface Entry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, Record<string, any>>;
}

// NOTE: addLinksFromRichTextNode and getRichTextEntities are pulled from @contentful/rich-text-links
// except that they allow for non-Link objects

function addLinksFromRichTextNode(node: Node, links: EntityLinksMap): void {
  const toCrawl: Node[] = [node];

  while (toCrawl.length > 0) {
    const { data, content } = toCrawl.pop() as Block;

    if (data?.target?.sys?.type) {
      links[data.target.sys.type].set(data.target.sys.id, data.target);
    }

    if (Array.isArray(content)) {
      for (const childNode of content) {
        toCrawl.push(childNode);
      }
    }
  }
}

function getRichTextEntities(document: Document): { [type in EntityType]: Entity[] } {
  const entityLinks: Record<EntityType, Map<string, Entity>> = {
    Entry: new Map(),
    Asset: new Map(),
    Link: new Map(),
  };

  const content = document?.content || ([] as Node[]);
  for (const node of content) {
    addLinksFromRichTextNode(node, entityLinks);
  }

  return {
    Asset: Array.from(entityLinks.Asset.values()),
    Entry: Array.from(entityLinks.Entry.values()),
    Link: Array.from(entityLinks.Link.values()),
  };
}

const isPresent = (needle: Entity, haystack: Entity[]): boolean =>
  haystack.some((entity) => needle.sys.id === entity.sys.id && needle.sys.type === entity.sys.type);

export function getReferencesFromEntry({ fields }: Entry): Entity[] {
  const references: Entity[] = [];

  Object.entries(fields).forEach(([_, fieldValue]) => {
    Object.entries(fieldValue).forEach(([_, localizedFieldValue]) => {
      // if field is an array of entities
      if (Array.isArray(localizedFieldValue) && localizedFieldValue.every((value) => value.sys)) {
        references.push(...localizedFieldValue.filter((entity) => !isPresent(entity, references)));
        // if rich text field
      } else if (Array.isArray(get(localizedFieldValue, 'content'))) {
        const entitiesByType = getRichTextEntities(localizedFieldValue);
        references.push(...entitiesByType.Entry.filter((entry) => !isPresent(entry, references)));
        references.push(...entitiesByType.Asset.filter((asset) => !isPresent(asset, references)));
        references.push(...entitiesByType.Link.filter((link) => !isPresent(link, references)));

        // if plain entity
      } else if (get(localizedFieldValue, 'sys')) {
        if (!isPresent(localizedFieldValue, references)) {
          references.push(localizedFieldValue);
        }
      }
    });
  });

  return references;
}
