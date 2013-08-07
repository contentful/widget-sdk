'use strict';

describe('Mimetype groups', function () {
  var mimetypeGroups;
  beforeEach(function () {
    module('contentful/test');
    inject(function (_mimetypeGroups_) {
      mimetypeGroups = _mimetypeGroups_;
    });
  });

  it('gets group for an mp3 file by extension and type', function () {
    expect(mimetypeGroups.getName('.mp3', 'audio/mpeg3')).toBe('audio');
  });

  it('gets group for an mp3 file by type', function () {
    expect(mimetypeGroups.getName(null, 'audio/mpeg3')).toBe('audio');
  });

  it('gets group for an mp3 file by extension', function () {
    expect(mimetypeGroups.getName('mp3')).toBe('audio');
  });

  it('gets group for an mp3 video file by extension and type', function () {
    expect(mimetypeGroups.getName('mp3', 'video/mpeg')).toBe('video');
  });

  it('gets default group for an unrecognized file type', function () {
    expect(mimetypeGroups.getName('random', 'random/random')).toBe('attachment');
  });

  it('gets positive preview setting for a png file', function () {
    expect(mimetypeGroups.hasPreview('png', 'image/png')).toBe(true);
  });

  it('gets negative preview setting for a js file', function () {
    expect(mimetypeGroups.hasPreview('js', 'application/x-javascript')).toBe(false);
  });

  it('gets group for a binary with wrong extension', function () {
    expect(mimetypeGroups.getName('log', 'application/octet-stream')).toBe('attachment');
  });

  it('gets group for a binary with existing extension', function () {
    expect(mimetypeGroups.getName('.pages', 'application/octet-stream')).toBe('richtext');
  });





});
