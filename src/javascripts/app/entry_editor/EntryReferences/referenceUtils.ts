import type { EntitySys } from '@contentful/editorial-primitives';
import { BasicMetaSysProps } from 'contentful-management/types';
import { getState } from 'data/CMA/EntityState';

// If there is a circular reference that is not handled this will keep us from endless.
const FAILSAFE_LEVEL = 15;
const linkableEntityTypes = ['Asset', 'Entry'];

// This controls the limit of total nodes to be displayed in a given child element
// We currently slice the number of references using this value
export const REFERENCES_TREE_MAX_REF_NODES = 100;

interface Entity {
  sys: EntitySys;
}

interface Entry extends Entity {
  sys: EntitySys;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, Record<string, any>>;
}

type TreeNode = {
  key: string;
  entity: Entity;
  level: number;
  isCircular: boolean;
  isResolved: boolean;
  type: string;
  children: TreeNode[];
  addChild: (entity: Entity, key: string) => TreeNode | undefined;
};

/**
 * Converts the entity into a tree node
 * @param entity
 * @param key a unique index of the entity in the tree
 * @param level level of depth in the tree at which the given entity was located
 */
const createTreeNode = (entity: Entity, key: string, level: number): TreeNode => {
  const children = [] as TreeNode[];

  return {
    key,
    entity,
    level,
    isCircular: false,
    isResolved: isLinkableEntity(entity),
    type: entity.sys.type,
    children,
    addChild(entity, key) {
      // PUL-1239 - skipping if the same reference was rendered on this level and it's just the same one for different locale
      const existingChild = children.find(
        (childNode) =>
          childNode.entity.sys.id === entity.sys.id && childNode.type === entity.sys.type
      );

      if (existingChild) {
        return;
      }
      const childNode = createTreeNode(entity, key, level + 1);
      children.push(childNode);
      return childNode;
    },
  };
};

type Tree = {
  root: TreeNode;
};

/**
 * Returns a tree structure with a root entity as a root tree node
 * @param rootEntity
 */
const createTree = (rootEntity: Entity): Tree => {
  const root = createTreeNode(rootEntity, '0', 0);

  return {
    root,
  };
};

/**
 * Goes over each of the tree node, looking for more references on a level deeper
 * @param treeNode - node to search deeper from
 * @param visitedEntities - array of ids of already discovered entitoes on levels above the given treeNode, and the treeNode itself. Is used to discover circular references and not end in an infinite loop
 */
const traverse = (treeNode: TreeNode, visitedEntities) => {
  const { entity, key: entityIndexInTree } = treeNode;
  const { fields } = entity as Entry;
  const referenceNodes = [] as any[];

  Object.entries(fields).forEach(([_fieldName, fieldValue], fieldIndex) => {
    Object.entries(fieldValue).forEach(([_locale, localizedFieldValue], localeIndex) => {
      // if field is an array of entity references
      if (Array.isArray(localizedFieldValue) && localizedFieldValue.every((value) => value.sys)) {
        localizedFieldValue.forEach((entityReference, entityReferenceIndexInArray) => {
          const nextEntityIndexInTree = `${entityIndexInTree}.${fieldIndex}.${localeIndex}.${entityReferenceIndexInArray}`;
          visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];
          referenceNodes.push(treeNode.addChild(entityReference, nextEntityIndexInTree));
        });
        // if rich text field
      } else if (Array.isArray(localizedFieldValue?.content)) {
        const getRichTextReferences = (content, parentIndex) => {
          const maybeSearchRichTextNodeForReferences = (entity, entityIndex) =>
            Array.isArray(entity.content) && entity.content.length
              ? getRichTextReferences(entity.content, entityIndex)
              : [];

          content.forEach((richTextNode, richTextNodedIndex) => {
            const nextEntityIndexInTree = `${parentIndex}.${fieldIndex}.${localeIndex}.${richTextNodedIndex}`;
            visitedEntities[nextEntityIndexInTree] = [...visitedEntities[parentIndex]];
            // we search each rich text node deeper
            maybeSearchRichTextNodeForReferences(richTextNode, nextEntityIndexInTree);
            if (
              [
                'embedded-asset-block',
                'embedded-entry-block',
                'embedded-entry-inline',
                'entry-hyperlink',
              ].includes(richTextNode.nodeType)
            ) {
              const entityPayload = richTextNode.data.target;
              referenceNodes.push(treeNode.addChild(entityPayload, nextEntityIndexInTree));
            }
          });
        };
        getRichTextReferences(localizedFieldValue.content, entityIndexInTree);
        // if single ref
      } else if (localizedFieldValue?.sys) {
        const nextEntityIndexInTree = `${entityIndexInTree}.${localeIndex}.${fieldIndex}`;
        visitedEntities[nextEntityIndexInTree] = [...visitedEntities[entityIndexInTree]];
        referenceNodes.push(treeNode.addChild(localizedFieldValue, nextEntityIndexInTree));
      }
    });
  });

  return referenceNodes;
};

type ReferenceTreeMetadata = {
  maxLevel: number;
  areAllReferencesSelected: boolean;
  selectedStates: string[];
};

/**
 * Looks for references in the fields of the given entity. Breadth-first.
 * @param root - root entity to start looking from
 * @param metadata - information, related to rendering or a state of rendered tree, like selection, maxLevel of rendering and etc
 */
const buildTreeOfReferences = (root: Entity, metadata: ReferenceTreeMetadata) => {
  const { maxLevel, areAllReferencesSelected, selectedStates } = metadata;
  const visitedEntities = { '0': [] } as Record<string, string[]>;

  let circularReferenceCount = 0;

  const getReferencesInNodes = (treeNodes: TreeNode[]): [TreeNode[], boolean] => {
    if (!treeNodes.length) {
      return [[], false];
    }

    const discoveredReferenceNodes = [] as TreeNode[];

    for (const treeNode of treeNodes) {
      const { entity, level, key: entityIndexInTree } = treeNode;
      const { fields } = entity as Entry;

      if (!fields || level > FAILSAFE_LEVEL) {
        continue;
      }

      if (entityIndexInTree !== '0' && visitedEntities[entityIndexInTree].includes(entity.sys.id)) {
        treeNode.isCircular = true;
        circularReferenceCount++;
        continue;
      }

      if (entity.sys.id) {
        visitedEntities[entityIndexInTree].push(entity.sys.id);
      }

      const referenceNodes = traverse(treeNode, visitedEntities);
      discoveredReferenceNodes.push(...referenceNodes.filter((node) => node && node.entity));
    }

    if (discoveredReferenceNodes.length > REFERENCES_TREE_MAX_REF_NODES) {
      return [discoveredReferenceNodes.slice(0, REFERENCES_TREE_MAX_REF_NODES), true];
    }

    return [discoveredReferenceNodes, false];
  };

  const selectionMap = new Map<string, Entity>();
  const tree = createTree(root);
  const entitiesPerLevel = [] as number[];
  let currentLevelTreeNodes = [tree.root];
  let someLevelIsSliced = false;

  const maybeMarkAsSelected = (treeNode: TreeNode) => {
    const { entity, type, isResolved } = treeNode;

    if (!isResolved) {
      return;
    }

    if (areAllReferencesSelected) {
      selectionMap.set(`${entity.sys.id}-${type}`, entity);
    } else if (selectedStates?.length && isLinkableEntity(entity)) {
      selectedStates.forEach((entityState) => {
        if (getState(entity.sys) === entityState) {
          selectionMap.set(`${entity.sys.id}-${type}`, entity);
        }
      });
    }
  };

  maybeMarkAsSelected(tree.root);

  do {
    const [nextLevelTreeNodes, isSliced] = getReferencesInNodes(currentLevelTreeNodes);
    someLevelIsSliced = someLevelIsSliced || isSliced;

    if (nextLevelTreeNodes.length) {
      const currentLevel = currentLevelTreeNodes[0].level;
      entitiesPerLevel[currentLevel] = nextLevelTreeNodes.length;
    }

    const level = currentLevelTreeNodes[0].level;

    // Remove this check if you want to attempt to publish even entities deeper than maxLevel
    // Since at the time of writing, API returns only 10 levels deep of entities, such entities are unresolved (type: Link, linkType: Entry|Asset)
    // which results in ValidationError if publishing is attempted
    if (level < maxLevel) {
      for (const treeNode of nextLevelTreeNodes) {
        maybeMarkAsSelected(treeNode);
      }
    }

    currentLevelTreeNodes = nextLevelTreeNodes;
  } while (currentLevelTreeNodes.length);

  return {
    circularReferenceCount,
    entitiesPerLevel,
    selectionMap,
    tree,
    isSliced: someLevelIsSliced,
  };
};

type EntityShape = {
  sys: BasicMetaSysProps;
};

const isLinkableEntity = (entity: EntityShape): boolean => {
  if (!entity?.sys) {
    return false;
  }

  return linkableEntityTypes.includes(entity.sys.type);
};

const isLink = (entity: EntityShape): boolean => {
  if (!entity?.sys) {
    return false;
  }

  return entity.sys.type === 'Link';
};

export { createTreeNode, createTree, buildTreeOfReferences, traverse, isLinkableEntity, isLink };
