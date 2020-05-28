import { addUserOrgSpace, omitMetadata } from './Decorators';

export default addUserOrgSpace((_, data) => {
  return { data: omitMetadata(data) };
});
