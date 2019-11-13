/**
 * @description
 * A utility function to dynamically load the react-joyride chunk
 *
 * @return {Promise<ReactComponent>}
 */
export const getReactJoyride = () =>
  new Promise(res => {
    require.ensure(
      ['react-joyride'],
      require => res(require('react-joyride').default),
      'react-joyride'
    );
  });
