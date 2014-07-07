#!/bin/sh
pegjs --extra-options "{\"optimize\": \"size\"}" app/assets/commonjs_modules/user_interface/search.pegjs 
touch app/assets/commonjs_modules/user_interface/index.js
