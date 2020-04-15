import {
  ENTITY_TYPES,
  DISABLED_ACTIONS,
  ACTIONS,
  TYPE_LABELS,
  createMap,
  isActionDisabled,
  areAllActionsChecked,
  areAllEntityTypesChecked,
  transformMapToTopics,
  transformTopicsToMap,
} from './TopicEventMap';

const defaultTopicMap = {
  Asset: {
    archive: false,
    create: false,
    delete: false,
    publish: false,
    save: false,
    unarchive: false,
    unpublish: false,
  },
  ContentType: {
    archive: false,
    create: false,
    delete: false,
    publish: false,
    save: false,
    unarchive: false,
    unpublish: false,
  },
  Entry: {
    archive: false,
    create: false,
    delete: false,
    publish: false,
    save: false,
    unarchive: false,
    unpublish: false,
  },
};

describe('Entity Types and Actions', () => {
  it('should these entity types for app event', () => {
    expect(ENTITY_TYPES).toMatchSnapshot();
  });

  it('should have these disabled actions for the entity types', () => {
    expect(DISABLED_ACTIONS).toMatchSnapshot();
  });

  it('should have these actions', () => {
    expect(ACTIONS).toMatchSnapshot();
  });

  it('should have these Type Labels for App Events', () => {
    expect(TYPE_LABELS).toMatchSnapshot();
  });
});

describe('Topic Map', () => {
  it('should create an topic map based on the entity types and actions with all topics set to fals', () => {
    expect(createMap(false)).toEqual(defaultTopicMap);
  });

  it('should check if an action is disabled for a given type', () => {
    expect(isActionDisabled('ContentType', 'unarchive')).toBe(true);
  });

  it('should return true if all given actions are checked for an entity type', () => {
    const topicMap = {
      ...defaultTopicMap,
      Asset: {
        archive: true,
        create: true,
        delete: true,
        publish: true,
        save: true,
        unarchive: true,
        unpublish: true,
      },
    };

    expect(areAllActionsChecked(topicMap, 'Asset')).toBe(true);
  });

  it('should return false if not all actions for an entity type are checked', () => {
    const topicMap = {
      ...defaultTopicMap,
      Asset: {
        archive: true,
        create: true,
        delete: true,
        publish: true,
        save: true,
        unarchive: false,
        unpublish: true,
      },
    };

    expect(areAllActionsChecked(topicMap, 'Asset')).toBe(false);
  });

  it('should return true if an action is checked in all entity types', () => {
    const topicMap = {
      ...defaultTopicMap,
      Asset: {
        archive: true,
      },
      ContentType: {
        archive: true,
      },
      Entry: {
        archive: true,
      },
    };

    expect(areAllEntityTypesChecked(topicMap, 'archive')).toBe(true);
  });
  it('should return false if an action is not checked in all entity types', () => {
    const topicMap = {
      ...defaultTopicMap,
      Asset: {
        publish: true,
      },
      ContentType: {
        publish: false,
      },
      Entry: {
        publish: true,
      },
    };

    expect(areAllEntityTypesChecked(topicMap, 'publish')).toBe(false);
  });
});

describe('transformMapToTopics', () => {
  it('should transform a topic map to an topic array', () => {
    const expectedTopicsArray = ['Entry.archive'];
    const topicMap = {
      ...defaultTopicMap,
      Entry: {
        archive: true,
      },
    };
    expect(transformMapToTopics(topicMap)).toEqual(expectedTopicsArray);
  });

  it('should transform an empty topics array', () => {
    const expectedTopicsArray = [];
    expect(transformMapToTopics(defaultTopicMap)).toEqual(expectedTopicsArray);
  });

  it('should not show a wildcard even though all actions for an entity are checked', () => {
    const topicMap = {
      ...defaultTopicMap,
      Asset: {
        archive: true,
        create: true,
        delete: true,
        publish: true,
        save: true,
        unarchive: true,
        unpublish: true,
      },
    };
    const topicArray = [
      'Asset.create',
      'Asset.save',
      'Asset.archive',
      'Asset.unarchive',
      'Asset.publish',
      'Asset.unpublish',
      'Asset.delete',
    ];
    expect(transformMapToTopics(topicMap)).toEqual(topicArray);
  });
});

describe('transformTopicsToMap', () => {
  it('should transform a topic array to a topic map', () => {
    const topicArray = ['Entry.archive', 'Entry.publish'];
    const expectedMap = {
      ...defaultTopicMap,
      Entry: {
        ...defaultTopicMap.Entry,
        archive: true,
        publish: true,
      },
    };
    expect(transformTopicsToMap(topicArray)).toEqual(expectedMap);
  });

  it('should handle an empty array', () => {
    const topicArray = [];
    expect(transformTopicsToMap(topicArray)).toEqual(defaultTopicMap);
  });
});
