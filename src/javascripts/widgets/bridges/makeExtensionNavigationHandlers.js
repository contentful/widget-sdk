import checkDependencies from './checkDependencies';
import * as entityCreator from 'components/app_container/entityCreator';
import * as Navigator from 'states/Navigator';
import get from 'lodash/get';
import * as SlideInNavigatorWithPromise from 'navigation/SlideInNavigator/withPromise';
import * as SlideInNavigator from 'navigation/SlideInNavigator';

export default function makeExtensionNavigationHandlers(dependencies, handlerOptions = {}) {
  const { cma } = checkDependencies('ExtensionNavigationHandlers', dependencies, ['cma']);

  return async function navigate(options) {
    if (!['Entry', 'Asset'].includes(options.entityType)) {
      throw new Error('Unknown entity type.');
    }

    if (handlerOptions.disableSlideIn === true && options.slideIn) {
      throw new Error('Cannot open the slide-in editor from the current location.');
    }

    // open existing entity
    if (typeof options.id === 'string') {
      return openExistingEntity(options);
    }

    let entity;
    try {
      entity = await createEntity(options);
    } catch (e) {
      throw new Error('Failed to create an entity.');
    }

    return openExistingEntity(
      {
        ...options,
        id: entity.sys.id,
      },
      entity
    );
  };

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
      return cma.getAsset(options.id);
    } else {
      return cma.getEntry(options.id);
    }
  }

  async function openExistingEntity({ id, entityType, slideIn = false }, entity) {
    try {
      if (slideIn) {
        if (get(slideIn, ['waitForClose'], false) === true) {
          await SlideInNavigatorWithPromise.goToSlideInEntityWithPromise({
            id,
            type: entityType,
          });
        } else {
          await SlideInNavigator.goToSlideInEntity({
            id,
            type: entityType,
          });
        }
        entity = await getEntity({
          entityType,
          id,
        });
      } else {
        entity = await getEntity({ id, entityType });
        await Navigator.go(Navigator.makeEntityRef(entity));
      }
    } catch (err) {
      throw new Error('Failed to navigate to the entity.');
    }

    return { navigated: true, entity };
  }
}
