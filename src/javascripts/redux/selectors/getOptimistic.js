import { get } from 'lodash/fp';

// get optimistically created items whose server request didn't return yet
export default get('optimistic');
