import createLocaleStore from './createLocaleStore';
import { getStore } from 'TheStore/index';

/**
 * @description
 * This service holds information about the locales for the current
 * space. When space is changed the `init` method should be called
 * from the `spaceContext`.
 *
 * This service also stores locale preferences in localStorage.
 *
 * TODO attach it to `spaceContext` instead of being global
 * TODO figure out the balance between store and repo
 */
export default createLocaleStore(getStore);
