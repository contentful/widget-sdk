import mitt from 'mitt';

// TODO: Use a better React solution for that, like Provider, after the Angular refactoring is done
export const emitter = mitt();
export const showPersistentNotification = (event) => emitter.emit('show', event);
export const hidePersistentNotification = () => emitter.emit('hide');
