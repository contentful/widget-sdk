import checkDependencies from './checkDependencies.es6';
import * as entityCreator from 'components/app_container/entityCreator.es6';

export default function makeExtensionNavigationHandlers(dependencies, handlerOptions = {}) {
  const { spaceContext, Navigator, SlideInNavigator } = checkDependencies(
    'ExtensionNavigationHandlers',
    dependencies,
    ['spaceContext', 'Navigator', 'SlideInNavigator']
  );

  return async function navigate(options) {
    if (!['Entry', 'Asset'].includes(options.entityType)) {
      throw new Error('Unknown entity type.');
    }

    if (handlerOptions.disableSlideIn === true && options.slideIn) {
      throw new Error('Cannot open the slide-in editor from the current location.');
    }

    const entity = await makeEntity(options);

    try {
      await navigateToEntity(entity, options.slideIn);
    } catch (err) {
      throw new Error('Failed to navigate to the entity.');
    }

    // In the future we could grow the API, for example by
    // adding a method to listen to close events of the slide-in editor.
    return { navigated: true, entity };
  };

  async function makeEntity(options) {
    if (typeof options.id === 'string') {
      try {
        return await getEntity(options);
      } catch (err) {
        throw new Error(`Failed to fetch an entity with the following ID: ${options.id}`);
      }
    } else {
      try {
        return await createEntity(options);
      } catch (err) {
        throw new Error('Failed to create an entity.');
      }
    }
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

  function getEntity(options) {
    if (options.entityType === 'Asset') {
      return spaceContext.cma.getAsset(options.id);
    } else {
      return spaceContext.cma.getEntry(options.id);
    }
  }
}
