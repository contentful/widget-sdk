import FetchEntity from './FetchEntity.es6';
const ServicesConsumer = require('../../../../../../reactServiceContext').default;

export default ServicesConsumer('EntityHelpers', {
  from: 'data/CMA/EntityState.es6',
  as: 'EntityState'
})(FetchEntity);
