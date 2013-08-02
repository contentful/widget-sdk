'use strict';

angular.module('contentful').factory('mimetypeGroups', function () {

  var fileGroups = {
    plaintext: [
      { ext: '.log', type: 'text/plain' },
      { ext: '.rt', type: 'text/richtext' },
      { ext: '.rt', type: 'text/vnd.rn-realtext' },
      { ext: '.rtf', type: 'application/rtf' },
      { ext: '.rtf', type: 'application/x-rtf' },
      { ext: '.rtf', type: 'text/richtext' },
      { ext: '.rtx', type: 'application/rtf' },
      { ext: '.rtx', type: 'text/richtext' },
      { ext: '.text', type: 'application/plain' },
      { ext: '.text', type: 'text/plain' },
      { ext: '.txt', type: 'text/plain' },
    ],
    image: [
      { ext: '.bm', type: 'image/bmp', preview: true },
      { ext: '.bmp', type: 'image/bmp', preview: true },
      { ext: '.bmp', type: 'image/x-windows-bmp', preview: true },
      { ext: '.fif', type: 'application/fractals' },
      { ext: '.fif', type: 'image/fif' },
      { ext: '.gif', type: 'image/gif', preview: true },
      { ext: '.ico', type: 'image/x-icon' },
      { ext: '.ief', type: 'image/ief' },
      { ext: '.iefs', type: 'image/ief' },
      { ext: '.jfif', type: 'image/jpeg' },
      { ext: '.jfif', type: 'image/pjpeg' },
      { ext: '.jfif-tbnl', type: 'image/jpeg' },
      { ext: '.jpe', type: 'image/jpeg', preview: true },
      { ext: '.jpe', type: 'image/pjpeg', preview: true },
      { ext: '.jpeg', type: 'image/jpeg', preview: true },
      { ext: '.jpeg', type: 'image/pjpeg', preview: true },
      { ext: '.jpg', type: 'image/jpeg', preview: true },
      { ext: '.jpg', type: 'image/pjpeg', preview: true },
      { ext: '.jps', type: 'image/x-jps', preview: true },
      { ext: '.nap', type: 'image/naplps' },
      { ext: '.naplps', type: 'image/naplps' },
      { ext: '.nif', type: 'image/x-niff' },
      { ext: '.niff', type: 'image/x-niff' },
      { ext: '.pbm', type: 'image/x-portable-bitmap' },
      { ext: '.pct', type: 'image/x-pict' },
      { ext: '.pcx', type: 'image/x-pcx' },
      { ext: '.pic', type: 'image/pict' },
      { ext: '.pict', type: 'image/pict' },
      { ext: '.png', type: 'image/png', preview: true },
      { ext: '.qif', type: 'image/x-quicktime' },
      { ext: '.qti', type: 'image/x-quicktime' },
      { ext: '.qtif', type: 'image/x-quicktime' },
      { ext: '.ras', type: 'image/cmu-raster' },
      { ext: '.ras', type: 'image/x-cmu-raster' },
      { ext: '.rast', type: 'image/cmu-raster' },
      { ext: '.tif', type: 'image/tiff', preview: true },
      { ext: '.tif', type: 'image/x-tiff', preview: true },
      { ext: '.tiff', type: 'image/tiff', preview: true },
      { ext: '.tiff', type: 'image/x-tiff', preview: true },
      { ext: '.xbm', type: 'image/x-xbitmap' },
      { ext: '.xbm', type: 'image/x-xbm' },
      { ext: '.xbm', type: 'image/xbm' },
      { ext: '.xpm', type: 'image/x-xpixmap' },
      { ext: '.xpm', type: 'image/xpm' },
      { ext: '.x-png', type: 'image/png', preview: true },
      { ext: '.xwd', type: 'image/x-xwd' },
      { ext: '.xwd', type: 'image/x-xwindowdump' },
      { ext: '.psd', type: 'application/octet-stream' },
      { ext: '.ps', type: 'application/postscript' },
      { ext: '.eps', type: 'application/postscript' }
    ],
    audio: [
      { ext: '.aif', type: 'audio/aiff' },
      { ext: '.aif', type: 'audio/x-aiff' },
      { ext: '.aifc', type: 'audio/aiff' },
      { ext: '.aifc', type: 'audio/x-aiff' },
      { ext: '.aiff', type: 'audio/aiff' },
      { ext: '.aiff', type: 'audio/x-aiff' },
      { ext: '.gsd', type: 'audio/x-gsm' },
      { ext: '.gsm', type: 'audio/x-gsm' },
      { ext: '.it', type: 'audio/it' },
      { ext: '.kar', type: 'audio/midi' },
      { ext: '.kar', type: 'music/x-karaoke' },
      { ext: '.lma', type: 'audio/nspaudio' },
      { ext: '.lma', type: 'audio/x-nspaudio' },
      { ext: '.mod', type: 'audio/mod' },
      { ext: '.mod', type: 'audio/x-mod' },
      { ext: '.mp2', type: 'audio/mpeg' },
      { ext: '.mp2', type: 'audio/x-mpeg' },
      { ext: '.mp3', type: 'audio/mpeg3' },
      { ext: '.mp3', type: 'audio/x-mpeg-3' },
      { ext: '.mpa', type: 'audio/mpeg' },
      { ext: '.mpg', type: 'audio/mpeg' },
      { ext: '.mpga', type: 'audio/mpeg' },
      { ext: '.m3u', type: 'audio/x-mpequrl' },
      { ext: '.mid', type: 'application/x-midi' },
      { ext: '.mid', type: 'audio/midi' },
      { ext: '.mid', type: 'audio/x-mid' },
      { ext: '.mid', type: 'audio/x-midi' },
      { ext: '.mid', type: 'music/crescendo' },
      { ext: '.mid', type: 'x-music/x-midi' },
      { ext: '.midi', type: 'application/x-midi' },
      { ext: '.midi', type: 'audio/midi' },
      { ext: '.midi', type: 'audio/x-mid' },
      { ext: '.midi', type: 'audio/x-midi' },
      { ext: '.midi', type: 'music/crescendo' },
      { ext: '.midi', type: 'x-music/x-midi' },
      { ext: '.my', type: 'audio/make' },
      { ext: '.pfunk', type: 'audio/make' },
      { ext: '.pfunk', type: 'audio/make.my.funk' },
      { ext: '.ra', type: 'audio/x-pn-realaudio' },
      { ext: '.ra', type: 'audio/x-pn-realaudio-plugin' },
      { ext: '.ra', type: 'audio/x-realaudio' },
      { ext: '.ram', type: 'audio/x-pn-realaudio' },
      { ext: '.ras', type: 'application/x-cmu-raster' },
      { ext: '.sid', type: 'audio/x-psid' },
      { ext: '.tsi', type: 'audio/tsp-audio' },
      { ext: '.voc', type: 'audio/voc' },
      { ext: '.voc', type: 'audio/x-voc' },
      { ext: '.vos', type: 'video/vosaic' },
      { ext: '.vox', type: 'audio/voxware' },
      { ext: '.vqe', type: 'audio/x-twinvq-plugin' },
      { ext: '.vqf', type: 'audio/x-twinvq' },
      { ext: '.vql', type: 'audio/x-twinvq-plugin' },
      { ext: '.wav', type: 'audio/wav' },
      { ext: '.wav', type: 'audio/x-wav' },
      { ext: '.xm', type: 'audio/xm' },
      { ext: '.aac', type: 'audio/aac' },
      { ext: '.mp4', type: 'audio/mp4' },
      { ext: '.m4a', type: 'audio/mp4' },
      { ext: '.mp1', type: 'audio/mpeg' },
      { ext: '.oga', type: 'audio/ogg' },
      { ext: '.ogg', type: 'audio/ogg' },
      { ext: '.webm', type: 'audio/webm' }
    ],
    video: [
      { ext: '.asf', type: 'video/x-ms-asf' },
      { ext: '.asx', type: 'application/x-mplayer2' },
      { ext: '.asx', type: 'video/x-ms-asf' },
      { ext: '.asx', type: 'video/x-ms-asf-plugin' },
      { ext: '.avi', type: 'application/x-troff-msvideo' },
      { ext: '.avi', type: 'video/avi' },
      { ext: '.avi', type: 'video/msvideo' },
      { ext: '.avi', type: 'video/x-msvideo' },
      { ext: '.avs', type: 'video/avs-video' },
      { ext: '.dif', type: 'video/x-dv' },
      { ext: '.dl', type: 'video/dl' },
      { ext: '.dl', type: 'video/x-dl' },
      { ext: '.dv', type: 'video/x-dv' },
      { ext: '.fli', type: 'video/fli' },
      { ext: '.fli', type: 'video/x-fli' },
      { ext: '.gl', type: 'video/gl' },
      { ext: '.gl', type: 'video/x-gl' },
      { ext: '.m1v', type: 'video/mpeg' },
      { ext: '.m2a', type: 'audio/mpeg' },
      { ext: '.m2v', type: 'video/mpeg' },
      { ext: '.mjpg', type: 'video/x-motion-jpeg' },
      { ext: '.moov', type: 'video/quicktime' },
      { ext: '.mov', type: 'video/quicktime' },
      { ext: '.movie', type: 'video/x-sgi-movie' },
      { ext: '.mp2', type: 'video/mpeg' },
      { ext: '.mp2', type: 'video/x-mpeg' },
      { ext: '.mp2', type: 'video/x-mpeq2a' },
      { ext: '.mp3', type: 'video/mpeg' },
      { ext: '.mp3', type: 'video/x-mpeg' },
      { ext: '.mpe', type: 'video/mpeg' },
      { ext: '.mpeg', type: 'video/mpeg' },
      { ext: '.mpa', type: 'video/mpeg' },
      { ext: '.mpg', type: 'video/mpeg' },
      { ext: '.mv', type: 'video/x-sgi-movie' },
      { ext: '.qt', type: 'video/quicktime' },
      { ext: '.qtc', type: 'video/x-qtc' },
      { ext: '.rv', type: 'video/vnd.rn-realvideo' },
      { ext: '.swf', type: 'application/x-shockwave-flash' },
      { ext: '.viv', type: 'video/vivo' },
      { ext: '.viv', type: 'video/vnd.vivo' },
      { ext: '.vivo', type: 'video/vivo' },
      { ext: '.vivo', type: 'video/vnd.vivo' },
      { ext: '.xdr', type: 'video/x-amt-demorun' },
      { ext: '.xmz', type: 'xgl/movie' },
      { ext: '.mp4', type: 'video/mp4' },
      { ext: '.m4v', type: 'video/mp4' },
      { ext: '.ogv', type: 'video/ogg' },
      { ext: '.webm', type: 'video/webm' }
    ],
    document: [
      { ext: '.doc', type: 'application/msword' },
      { ext: '.dot', type: 'application/msword' },
      { ext: '.eps', type: 'application/postscript' },
      { ext: '.pot', type: 'application/mspowerpoint' },
      { ext: '.pot', type: 'application/vnd.ms-powerpoint' },
      { ext: '.ppa', type: 'application/vnd.ms-powerpoint' },
      { ext: '.pps', type: 'application/mspowerpoint' },
      { ext: '.pps', type: 'application/vnd.ms-powerpoint' },
      { ext: '.ppt', type: 'application/mspowerpoint' },
      { ext: '.ppt', type: 'application/powerpoint' },
      { ext: '.ppt', type: 'application/vnd.ms-powerpoint' },
      { ext: '.ppt', type: 'application/x-mspowerpoint' },
      { ext: '.ppz', type: 'application/mspowerpoint' },
      { ext: '.pwz', type: 'application/vnd.ms-powerpoint' },
      { ext: '.vsd', type: 'application/x-visio' },
      { ext: '.vst', type: 'application/x-visio' },
      { ext: '.vsw', type: 'application/x-visio' },
      { ext: '.w60', type: 'application/wordperfect6.0' },
      { ext: '.w61', type: 'application/wordperfect6.1' },
      { ext: '.w6w', type: 'application/msword' },
      { ext: '.wiz', type: 'application/msword' },
      { ext: '.word', type: 'application/msword' },
      { ext: '.wp', type: 'application/wordperfect' },
      { ext: '.wp5', type: 'application/wordperfect' },
      { ext: '.wp5', type: 'application/wordperfect6.0' },
      { ext: '.wp6', type: 'application/wordperfect' },
      { ext: '.wpd', type: 'application/wordperfect' },
      { ext: '.wpd', type: 'application/x-wpwin' },
      { ext: '.wq1', type: 'application/x-lotus' },
      { ext: '.wri', type: 'application/mswrite' },
      { ext: '.xl', type: 'application/excel' },
      { ext: '.xla', type: 'application/excel' },
      { ext: '.xla', type: 'application/x-excel' },
      { ext: '.xla', type: 'application/x-msexcel' },
      { ext: '.xlb', type: 'application/excel' },
      { ext: '.xlb', type: 'application/vnd.ms-excel' },
      { ext: '.xlb', type: 'application/x-excel' },
      { ext: '.xlc', type: 'application/excel' },
      { ext: '.xlc', type: 'application/vnd.ms-excel' },
      { ext: '.xlc', type: 'application/x-excel' },
      { ext: '.xld', type: 'application/excel' },
      { ext: '.xld', type: 'application/x-excel' },
      { ext: '.xlk', type: 'application/excel' },
      { ext: '.xlk', type: 'application/x-excel' },
      { ext: '.xll', type: 'application/excel' },
      { ext: '.xll', type: 'application/vnd.ms-excel' },
      { ext: '.xll', type: 'application/x-excel' },
      { ext: '.xlm', type: 'application/excel' },
      { ext: '.xlm', type: 'application/vnd.ms-excel' },
      { ext: '.xlm', type: 'application/x-excel' },
      { ext: '.xls', type: 'application/excel' },
      { ext: '.xls', type: 'application/vnd.ms-excel' },
      { ext: '.xls', type: 'application/x-excel' },
      { ext: '.xls', type: 'application/x-msexcel' },
      { ext: '.xlt', type: 'application/excel' },
      { ext: '.xlt', type: 'application/x-excel' },
      { ext: '.xlv', type: 'application/excel' },
      { ext: '.xlv', type: 'application/x-excel' },
      { ext: '.xlw', type: 'application/excel' },
      { ext: '.xlw', type: 'application/vnd.ms-excel' },
      { ext: '.xlw', type: 'application/x-excel' },
      { ext: '.xlw', type: 'application/x-msexcel' },
    ],
    pdfdocument: [
      { ext: '.pdf', type: 'application/pdf' },
    ],
    archive: [
      { ext: '.arj', type: 'application/arj' },
      { ext: '.boz', type: 'application/x-bzip2' },
      { ext: '.bz', type: 'application/x-bzip' },
      { ext: '.bz2', type: 'application/x-bzip2' },
      { ext: '.gz', type: 'application/x-compressed' },
      { ext: '.gz', type: 'application/x-gzip' },
      { ext: '.gzip', type: 'application/x-gzip' },
      { ext: '.gzip', type: 'multipart/x-gzip' },
      { ext: '.tar', type: 'application/x-tar' },
      { ext: '.tgz', type: 'application/gnutar' },
      { ext: '.tgz', type: 'application/x-compressed' },
      { ext: '.z', type: 'application/x-compress' },
      { ext: '.z', type: 'application/x-compressed' },
      { ext: '.zip', type: 'application/x-compressed' },
      { ext: '.zip', type: 'application/x-zip-compressed' },
      { ext: '.zip', type: 'application/zip' },
      { ext: '.zip', type: 'multipart/x-zip' },
    ],
    code: [
      { ext: '.asp', type: 'text/asp' },
      { ext: '.c', type: 'text/plain' },
      { ext: '.c', type: 'text/x-c' },
      { ext: '.c++', type: 'text/plain' },
      { ext: '.cc', type: 'text/plain' },
      { ext: '.cc', type: 'text/x-c' },
      { ext: '.conf', type: 'text/plain' },
      { ext: '.cpp', type: 'text/x-c' },
      { ext: '.csh', type: 'application/x-csh' },
      { ext: '.csh', type: 'text/x-script.csh' },
      { ext: '.css', type: 'application/x-pointplus' },
      { ext: '.css', type: 'text/css' },
      { ext: '.cxx', type: 'text/plain' },
      { ext: '.el', type: 'text/x-script.elisp' },
      { ext: '.f', type: 'text/plain' },
      { ext: '.f', type: 'text/x-fortran' },
      { ext: '.f77', type: 'text/x-fortran' },
      { ext: '.f90', type: 'text/plain' },
      { ext: '.f90', type: 'text/x-fortran' },
      { ext: '.for', type: 'text/plain' },
      { ext: '.for', type: 'text/x-fortran' },
      { ext: '.htm', type: 'text/html' },
      { ext: '.html', type: 'text/html' },
      { ext: '.htmls', type: 'text/html' },
      { ext: '.jav', type: 'text/plain' },
      { ext: '.jav', type: 'text/x-java-source' },
      { ext: '.java', type: 'text/plain' },
      { ext: '.java', type: 'text/x-java-source' },
      { ext: '.js', type: 'application/x-javascript' },
      { ext: '.js', type: 'application/javascript' },
      { ext: '.js', type: 'application/ecmascript' },
      { ext: '.js', type: 'text/javascript' },
      { ext: '.js', type: 'text/ecmascript' },
      { ext: '.ksh', type: 'application/x-ksh' },
      { ext: '.ksh', type: 'text/x-script.ksh' },
      { ext: '.latex', type: 'application/x-latex' },
      { ext: '.lsp', type: 'application/x-lisp' },
      { ext: '.lsp', type: 'text/x-script.lisp' },
      { ext: '.lst', type: 'text/plain' },
      { ext: '.ltx', type: 'application/x-latex' },
      { ext: '.pas', type: 'text/pascal' },
      { ext: '.pl', type: 'text/plain' },
      { ext: '.pl', type: 'text/x-script.perl' },
      { ext: '.py', type: 'text/x-script.phyton' },
      { ext: '.s', type: 'text/x-asm' },
      { ext: '.sh', type: 'application/x-bsh' },
      { ext: '.sh', type: 'application/x-sh' },
      { ext: '.sh', type: 'application/x-shar' },
      { ext: '.sh', type: 'text/x-script.sh' },
      { ext: '.shtml', type: 'text/html' },
      { ext: '.shtml', type: 'text/x-server-parsed-html' },
      { ext: '.tcl', type: 'application/x-tcl' },
      { ext: '.tcl', type: 'text/x-script.tcl' },
      { ext: '.tcsh', type: 'text/x-script.tcsh' },
      { ext: '.tex', type: 'application/x-tex' },
      { ext: '.texi', type: 'application/x-texinfo' },
      { ext: '.texinfo', type: 'application/x-texinfo' },
      { ext: '.xml', type: 'application/xml' },
      { ext: '.xml', type: 'text/xml' },
      { ext: '.zsh', type: 'text/x-script.zsh' }
    ]
  };

  function addToGroupListBy(group, groupList, index) {
    if(groupList[index])
      groupList[index].push(group);
    else
      groupList[index] = [group];
  }

  var extensionList = {};
  var mimetypeList = {};
  _.each(fileGroups, function (group, groupName) {
    _.each(group, function (typeDef) {

      addToGroupListBy({
        type: typeDef.type,
        preview: typeDef.preview,
        group: groupName
      }, extensionList, typeDef.ext);

      addToGroupListBy({
        ext: typeDef.ext,
        preview: typeDef.preview,
        group: groupName
      }, mimetypeList, typeDef.type);

    });
  });

  function lookupPropertyInLists(ext, type, property) {
    ext = (ext && /^\./.test(ext)) ? ext : '.'+ext;

      if(ext){
        var extensions = extensionList[ext];
        if(type){
          var extByType = _.where(extensions, {type: type});
          if(extByType && extByType.length > 0){
            return extByType[0][property];
          }
        } else if(extensions && extensions.length > 0) {
          return extensions[0][property];
        }
      }

      if(type){
        var types = mimetypeList[type];
        var typesByExt = _.where(types, {ext: ext});
        if(typesByExt && typesByExt.length > 0){
          return typesByExt[0][property];
        } else if(types && types.length > 0){
          return types[0][property];
        }
      }

      return;
  }


  return {

    getName: function (ext, type) {
      var group = lookupPropertyInLists(ext, type, 'group');
      return group ? group : 'attachment';
    },

    hasPreview: function (ext, type) {
      return !!lookupPropertyInLists(ext, type, 'preview');
    },

    getGroupNames: function () {
      return _.keys(fileGroups).concat(['attachment']);
    }

  };
});
