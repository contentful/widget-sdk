/**
 * @description
 * A utility function to dynamically load the @typeform/embed chunk
 *
 * @return {Promise<Module>}
 */
export const getTypeformEmbedLib = () =>
  new Promise(res => {
    require.ensure(
      ['@typeform/embed'],
      require => res(require('@typeform/embed')),
      'typeform-embed'
    );
  });
