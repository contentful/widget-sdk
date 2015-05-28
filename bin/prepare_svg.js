#!/usr/bin/env node
"use strict";

/**
 * This script reads a directory full of svg icon files, extracts the content,
 * performs some cleanup and conversions, combines them all and outputs them
 * into one single file.
 *
 * The files are assumed to have been generated and exported with Sketch.app
 * (see getGroupsFromSVG for specifics and the SVG_TEMPLATE_FILE for definitions
 * of Sketch.app namespaces).
 *
 * Usage:
 * ./prepare_svg.js <input dir> <svgoutputfile> <metadataoutputfile>
 *
*/

// Prefix for the ID generated for each icon
var ICON_ID_PREFIX = 'icon-';

var SKETCH_PAGE_ID = 'Page-1';

// We use this as a template to generate the final file
// because we want to parse the final file with SVGO and it will
// complain if the definitions for the Sketch namespaces are not there.
var SVG_TEMPLATE_FILE =
  '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'+
  '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">'+
  '</svg>';

var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var svg2js = require('../node_modules/svgo/lib/svgo/svg2js');
var js2svg = require('../node_modules/svgo/lib/svgo/js2svg');

if(process.argv.length < 5){
  console.log('Usage is: '+process.argv[0]+process.argv[1]+' <inputdir> <svgoutputfile> <metadataoutputfile>');
  process.exit(1);
}

var inputDir = process.argv[2];
var svgOutputFile = process.argv[3];
var metadataOutputFile = process.argv[4];

console.log('Preparing SVG!\n');

// Read the files for each icon,
// extract the content groups,
// convert them to symbols,
// clean up the xml code
var iconsSVG = filterSVGFiles(fs.readdirSync(inputDir))
.map(function (fileName) {
  return stringToSVG(fileName, fs.readFileSync(path.join(inputDir, fileName), 'utf-8'))
  .then(getGroupsFromSVG)
  .then(turnGroupsIntoSymbols)
  .then(prefixIconIds)
  .then(cleanupAttrs)
  .catch(errorCatcher);
});

// When all icons are ready,
// add the viewBox and transform attributes to all icons,
// generate the xml with all the icons,
// write it to the output file
Promise.all(iconsSVG)
.then(function (icons) {
  icons.forEach(function (icon) {
    return addViewbox(icon);
  });
  return icons;
})
.then(function (icons) {
  return generateSVGData(icons.map(function (icon) { return icon.content; }))
         .then(function (iconsOutput) {
           fs.writeFileSync(svgOutputFile, iconsOutput);
           fs.writeFileSync(metadataOutputFile, generateIconsMetadata(icons));
           process.exit(0);
         });
})
.catch(errorCatcher);


function errorCatcher(err) {
  console.log(err, err.stack);
  process.exit(1);
}


/* ----------------------------------------------------------- */



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
          root: root
        });
      }
    });
  });
}

/**
 * Gets the group tags from the SVG tree for each icon file
 * together with the information about the viewBox which is
 * stored on the SVG tag for each file
*/
function getGroupsFromSVG(data) {
  var root = data.root;
  var SVG = root.content[1];
  return new Promise(function (resolve) {
    SVG.content.forEach(function (node) {
      // Sketch always exports a group item for the page with a standard ID
      if(nodeIsElAndId(node, 'g', SKETCH_PAGE_ID)) {
        resolve({
          content: node.content[0],
          viewBox: SVG.attrs.viewBox.value
        });
      }
    });
  });
}

/**
 * Turns the group tags into symbol tags
*/
function turnGroupsIntoSymbols(icon) {
  icon.content.elem = 'symbol';
  icon.content.local = 'symbol';
  return icon;
}

function prefixIconIds(icon) {
  icon.content.attrs.id.value = ICON_ID_PREFIX+icon.content.attrs.id.value;
  return icon;
}

/**
 * Cleans up unnecessary attributes
*/
function cleanupAttrs(icon) {
  delete icon.content.attrs['sketch:type'];
  delete icon.content.attrs.transform;
  return icon;
}

/**
 * Adds the viewBox information to the actual icon symbol tag
 * Also adds some padding to the viewBox to prevent icon clipping issues
*/
function addViewbox(icon) {
  var viewBox = icon.viewBox.split(' ').map(function (coord) {
    return parseInt(coord, 10);
  });
  viewBox[0] = -1;
  viewBox[1] = -1;
  viewBox[2] = viewBox[2] + 2;
  viewBox[3] = viewBox[3] + 2;
  icon.viewBox = viewBox;
  setAttrOnEl(icon.content, 'viewBox', viewBox.join(' '));
  return icon;
}

/**
 * Generates the actual SVG data from the SVG JS tree
*/
function generateSVGData(icons) {
  // This file name only matters for error reporting
  return stringToSVG('template.svg', SVG_TEMPLATE_FILE)
  .then(function (data) {
    data.root.content[1].content = icons;
    try{
      return js2svg(data.root, {pretty: true}).data;
    } catch(e) {
      return Promise.reject(e);
    }
  });
}

function generateIconsMetadata(icons) {
  var metadata = {};
  icons.forEach(function (icon) {
    metadata[icon.content.attrs.id.value] = icon.viewBox;
  });
  return JSON.stringify(metadata);
}

/**
 * Checks if node is of a given element type and has the required id
*/
function nodeIsElAndId(node, el, id) {
  return node &&
    node.elem && node.elem === el &&
    node.attrs && node.attrs.id && node.attrs.id.value === id;
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
