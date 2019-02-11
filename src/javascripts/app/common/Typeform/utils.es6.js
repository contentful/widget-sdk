import * as typeformEmbed from '@typeform/embed';

/**
 * @description
 * A utility function to dynamically load the @typeform/embed chunk
 *
 * @return {Promise<Module>}
 */
export const getTypeformEmbedLib = () => Promise.resolve(typeformEmbed);
