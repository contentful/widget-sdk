import { addUserOrgSpace } from './Decorators';

/**
 * Exports a function that transforms data for the app open event.
 */
export default addUserOrgSpace((_eventName, _data) => ({ data: {} }));
