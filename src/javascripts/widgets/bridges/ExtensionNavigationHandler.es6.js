export default function makeExtensionNavigationHandler({
  spaceContext,
  entityCreator,
  Navigator,
  SlideInNavigator
}) {
  return async function navigate(options) {
    if (!['Entry', 'Asset'].includes(options.entityType)) {
      throw new Error('Unknown entity type.');
    }

    const entity = await makeEntity(options);

    try {
      await navigateToEntity(entity, options.slideIn);
    } catch (err) {
      throw new Error('Failed to navigate to the entity.');
    }

    // Right now we're returning this object with a single `navigated`
    // property. In the future we could grow the API, for example by
    // adding a method to listen to close events of the slide-in editor.
    return { navigated: true };
  };

  async function makeEntity(options) {
    if (typeof options.id === 'string') {
      // A valid ID is given, create a stub entity that can be used for navigation.
      return makeStubEntity(options);
    } else {
      try {
        return await createEntity(options);
      } catch (err) {
        throw new Error('Failed to create an entity.');
      }
    }
  }

  function makeStubEntity(options) {
    return {
      sys: {
        type: options.entityType,
        id: options.id,
        space: { sys: { id: spaceContext.getId() } },
        environment: { sys: { id: spaceContext.getEnvironmentId() } }
      }
    };
  }

  async function createEntity(options) {
    // Important note:
    // `entityCreator` returns legacy client entities, we need to extract `entity.data`.

    if (options.entityType === 'Entry' && typeof options.contentTypeId === 'string') {
      const created = await entityCreator.newEntry(options.contentTypeId);
      return created.data;
    } else if (options.entityType === 'Asset') {
      const created = await entityCreator.newAsset();
      return created.data;
    }

    throw new Error('Could not determine how to create the requested entity.');
  }

  async function navigateToEntity(entity, slideIn = false) {
    if (slideIn) {
      // This method is sync but the URL change is an async side-effect.
      SlideInNavigator.goToSlideInEntity(entity.sys);
    } else {
      await Navigator.go(Navigator.makeEntityRef(entity));
    }
  }
}
