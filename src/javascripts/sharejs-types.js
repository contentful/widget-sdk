/*
  This defines the types that are required for sharejs/client

  This used to be built by the gulp task, which processed a superset
  of these files through Babel and concatenated them. This accomplishes
  the same thing, but using webpack directly.

  This should be included before prelude.js in Webpack.
 */

import text from '@contentful/sharejs/lib/types/text';
import '@contentful/sharejs/lib/types/text-api';
import json from '@contentful/sharejs/lib/types/json';
import '@contentful/sharejs/lib/types/json-api';

window.sharejs = {
  types: {
    text,
    json
  }
};
