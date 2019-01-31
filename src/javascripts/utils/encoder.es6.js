import htmlEncoder from 'node-html-encoder';

const encoder = htmlEncoder.Encoder();

export const htmlEncode = encoder.htmlEncode.bind(encoder);
export const htmlDecode = encoder.htmlDecode.bind(encoder);
