import { createTreeNode, isLinkableEntity, buildTreeOfReferences } from './referenceUtils';
import { test } from '@contentful/types';
import type { AssetProps, EntryProps } from 'contentful-management/types';

describe('isLinkableEntity', () => {
  it('should return true for entries', () => {
    const entry = test.generator.entry(undefined, undefined) as EntryProps;
    expect(isLinkableEntity(entry)).toBe(true);
  });

  it('should return true for assets', () => {
    const asset = test.generator.asset(undefined) as AssetProps;
    expect(isLinkableEntity(asset)).toBe(true);
  });

  it('should return false for another type of entity', () => {
    const entity = test.generator.entity({ type: 'ContentType' }) as any;
    expect(isLinkableEntity(entity)).toBe(false);
  });

  it('should return false if undefined state', () => {
    // testing these purely becuase the project is not fully in ts
    expect(isLinkableEntity(undefined as any)).toBe(false);
    expect(isLinkableEntity(null as any)).toBe(false);
    expect(isLinkableEntity({} as any)).toBe(false);
    expect(isLinkableEntity({ sys: undefined } as any)).toBe(false);
  });
});

describe('createTreeNode', () => {
  it('should create unresolved node for non linkable entity', () => {
    const entity = test.generator.entity({ type: 'ContentType' }) as any;
    const node = createTreeNode(entity, 'key', 1);

    expect(node.key).toBe('key');
    expect(node.entity).toEqual(entity);
    expect(node.level).toBe(1);
    expect(node.type).toBe('ContentType');
    expect(node.isResolved).toBe(false);
    expect(node.children).toEqual([]);
  });

  it('should create a resolved node for Entry', () => {
    const entity = test.generator.entry(undefined, undefined) as any;
    const node = createTreeNode(entity, 'key', 1);

    expect(node.key).toBe('key');
    expect(node.entity).toEqual(entity);
    expect(node.level).toBe(1);
    expect(node.type).toBe('Entry');
    expect(node.isResolved).toBe(true);
    expect(node.children).toEqual([]);
  });

  it('should create a resolved node for Asset', () => {
    const asset = test.generator.asset(undefined) as any;
    const node = createTreeNode(asset, 'key', 1);

    expect(node.key).toBe('key');
    expect(node.entity).toEqual(asset);
    expect(node.level).toBe(1);
    expect(node.type).toBe('Asset');
    expect(node.isResolved).toBe(true);
    expect(node.children).toEqual([]);
  });
});

describe('buildTreeOfReferences', () => {
  it('should mark non linkable entities as unresolved', () => {
    const scheduledAction = {
      sys: {
        id: 'scheduled-action-id',
        space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
        status,
        type: 'ScheduledAction',
        createdBy: { sys: { type: 'Link', linkType: 'User', id: '2L8boPZsBbeuGViJgZiKoi' } },
        createdAt: '2020-06-30T16:48:31.342Z',
      },
      environment: {
        sys: { type: 'Link', linkType: 'Environment', id: '0f376538-6177-4e52-921b-5060a827133a' },
      },
      entity: {
        sys: {
          id: '1234',
          linkType: 'Entry',
          type: 'Link',
        },
      },
      scheduledFor: {
        datetime: '01-01-01',
      },
      action: 'publish',
    };

    const rootEntry = {
      sys: test.generator.entry(undefined, undefined).sys,
      fields: {
        name: {
          de: 'test',
        },
        validRef: {
          'en-US': test.generator.entry(undefined, undefined),
        },
        invalidRef: {
          'en-US': scheduledAction,
        },
      },
    };

    const { tree } = buildTreeOfReferences(rootEntry as any, {
      maxLevel: 3,
      areAllReferencesSelected: false,
      selectedStates: [],
    });
    expect(tree.root.children).toHaveLength(2);
    const [child1, child2] = tree.root.children;
    expect(child1.isResolved).toBe(true);
    expect(child2.isResolved).toBe(false);
  });
});
