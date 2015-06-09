#!/usr/bin/env node
"use strict";

/**
 * This script reads a directory full of svg icon files, extracts the content,
 * performs some cleanup and conversions, combines them all and outputs them
 * into one single JS file.
 *
 * Usage:
 * ./prepare_svg.js <inputDir> <jsOutputFile>
 *
*/

var JS_OUTPUT_START = "'use strict'; angular.module('contentful').constant('icons',";
var JS_OUTPUT_END = ");";

var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var svg2js = require('../node_modules/svgo/lib/svgo/svg2js');
var js2svg = require('../node_modules/svgo/lib/svgo/js2svg');

if(process.argv.length < 4){
  console.log('Usage is: '+process.argv[0]+process.argv[1]+' <inputDir> <jsOutputFile>');
  process.exit(1);
}

var inputDir = process.argv[2];
var jsOutputFile = process.argv[3];

console.log('Preparing SVG!\n');

var rawSVGIcons = filterSVGFiles(fs.readdirSync(inputDir))
.map(function (fileName) {
  return {
    fileName: fileName,
    contents: fs.readFileSync(path.join(inputDir, fileName), 'utf-8')
  };
});

var parsedSVGIcons = rawSVGIcons
.map(function (rawIcon) {
  return stringToSVG(rawIcon.fileName, rawIcon.contents)
  .then(expandViewbox)
  .then(SVGToString)
  .catch(errorCatcher);
});

Promise.all(parsedSVGIcons)
.then(function (parsedIcons) {
  var icons = {};
  parsedIcons.forEach(function (icon) {
    icons[icon.fileName.replace('.svg', '')] = icon.contents;
  });
  fs.writeFileSync(jsOutputFile, JS_OUTPUT_START + JSON.stringify(icons) + JS_OUTPUT_END);
});

function errorCatcher(err) {
  console.log(err, err.stack);
  process.exit(1);
}

/**
 * Converts a given string to an SVG JS tree
*/
function stringToSVG(fileName, content) {
  return new Promise(function (resolve, reject) {
    svg2js(content, function (root) {
      if(root.error){
        reject({
          message: 'Error converting to JS',
          fileName: fileName,
          error: root.error
        });
      } else {
        resolve({
          fileName: fileName,
          svgTree: root
        });
      }
    });
  });
}

/**
 * Adds some padding to the viewBox to prevent icon clipping issues
*/
function expandViewbox(icon) {
  var el = icon.svgTree.content[0];
  var viewBox = el.attrs.viewBox.value.split(' ').map(function (coord) {
    return parseInt(coord, 10);
  });
  viewBox[0] = -1;
  viewBox[1] = -1;
  viewBox[2] = viewBox[2] + 2;
  viewBox[3] = viewBox[3] + 2;
  setAttrOnEl(el, 'viewBox', viewBox.join(' '));
  return icon;
}

/**
 * Converts the icon's svgTree back into a string
*/
function SVGToString(icon) {
  try {
    return {
      fileName: icon.fileName,
      contents: js2svg(icon.svgTree).data
    };
  } catch(e) {
    return Promise.reject(e);
  }
}
/**
 * Attributes on SVG elements require certain parameters.
 * This helper sets what's necessary.
*/
function setAttrOnEl(el, name, value){
  el.attrs[name] = {
    name: name,
    local: name,
    prefix: '',
    value: value
  };
}

/**
 * Filters the .svg files out of a list of files
*/
function filterSVGFiles(list) {
  return list.filter(function (name) {
    return /\.svg$/g.test(name);
  });
}
