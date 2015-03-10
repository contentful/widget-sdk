#!/usr/bin/env node
"use strict";

var fs = require('fs');
var JSAPI = require('../node_modules/svgo/lib/svgo/jsAPI');
var svg2js = require('../node_modules/svgo/lib/svgo/svg2js');
var js2svg = require('../node_modules/svgo/lib/svgo/js2svg');

if(process.argv.length < 5){
  console.log('Usage is: '+process.argv[0]+process.argv[1]+' <inputfile> <outputfile> <cssfile>');
  process.exit(1);
}

var inputFile = process.argv[2];
var outputFile = process.argv[3];
var cssFile = process.argv[4];

console.log('Preparing SVG!\n');
console.log('Reading ', inputFile);

var iconsSvg = fs.readFileSync(inputFile, 'utf-8');
var css = fs.readFileSync(cssFile, 'utf-8');

svg2js(iconsSvg, parseContent);

function parseContent(root){
  var artboardContent;
  var svg = root.content[1];
  svg.attrs.width.value = '30px';
  svg.attrs.height.value = '26px';
  svg.attrs.viewBox.value = '0 0 30 26';
  // Look for the icons container
  svg.content.forEach(function (node) {
    if(nodeIsElAndId(node, 'g', 'Page-1'))
      node.content.forEach(function (node) {
        if(nodeIsElAndId(node, 'g', 'ContentfulIcons'))
          artboardContent = parseArtboard(node.content);
      });
  });
  // Inject CSS in a style tag
  console.log('Injecting css from ', cssFile);
  svg.content = artboardContent;
  svg.content.unshift(0, new JSAPI({
    elem: 'style',
    local: 'style',
    prefix: '',
    content: [
      {text: css}
    ]
  }));
  // Output the modified file
  root.content = [svg];
  fs.writeFileSync(
    outputFile,
    js2svg(root, {pretty: true}).data
  );
  console.log('Output written to ', outputFile);
  process.exit(0);
}

function parseArtboard(content) {
  content.forEach(function (node) {
    console.log('Adding styling class to', node.attrs.id.value);
    // Adds icon class for styling
    node.attrs.class = {
      name: 'class',
      local: 'class',
      value: 'icon',
      prefix: ''
    };
    console.log('Removing transforms from', node.attrs.id.value);
    // Changes transform so we can stack the icons
    node.attrs.transform = {
      name: 'transform',
      local: 'transform',
      prefix: '',
      value: 'translate(1 1)'
    };
  });
  return content;
}

function nodeIsElAndId(node, el, id) {
  return node &&
    node.elem && node.elem === el &&
    node.attrs && node.attrs.id && node.attrs.id.value === id;
}
