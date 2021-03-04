/**
 * @description
 * A utility function to dynamically load the react-joyride chunk
 *
 * @return {Promise<ReactComponent>}
 */
export const getReactJoyride = () => import('react-joyride').then((m) => m.default);
