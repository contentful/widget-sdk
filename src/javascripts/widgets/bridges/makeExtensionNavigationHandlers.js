import checkDependencies from './checkDependencies';
import * as entityCreator from 'components/app_container/entityCreator';
import * as Navigator from 'states/Navigator';
import get from 'lodash/get';
import * as SlideInNavigatorWithPromise from 'navigation/SlideInNavigator/withPromise';
import * as SlideInNavigator from 'navigation/SlideInNavigator';

export default function makeExtensionNavigationHandlers(dependencies, handlerOptions = {}) {
  const { spaceContext } = checkDependencies('ExtensionNavigationHandlers', dependencies, [
    'spaceContext'
  ]);

  return async function navigate(options) {
    if (!['Entry', 'Asset'].includes(options.entityType)) {
      throw new Error('Unknown entity type.');
    }

    if (handlerOptions.disableSlideIn === true && options.slideIn) {
      throw new Error('Cannot open the slide-in editor from the current location.');
    }

    let entity = await makeEntity(options);

    try {
      const slideIn = options.slideIn || false;
      if (slideIn) {
        if (get(slideIn, ['waitForClose'], false) === true) {
          await SlideInNavigatorWithPromise.goToSlideInEntityWithPromise(entity.sys);
          entity = await getEntity({
            entityType: options.entityType,
            id: entity.sys.id
          });
        } else {
          await SlideInNavigator.goToSlideInEntity(entity.sys);
        }
      } else {
        await Navigator.go(Navigator.makeEntityRef(entity));
      }
    } catch (err) {
      throw new Error('Failed to navigate to the entity.');
    }

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

  function getEntity(options) {
    if (options.entityType === 'Asset') {
      return spaceContext.cma.getAsset(options.id);
    } else {
      return spaceContext.cma.getEntry(options.id);
    }
  }
}
