import { template as loDashTemplate } from 'lodash';
export const template = (message, args) => loDashTemplate(message)(args);
