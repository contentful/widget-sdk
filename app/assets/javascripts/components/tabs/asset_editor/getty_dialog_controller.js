'use strict';

angular.module('contentful').controller('GettyDialogController', function($scope, gettyImagesFactory) {

  var IMAGES_PER_PAGE = 6;

  function makeFileNameRe() {
    return (/\/([\d|\w]*.(\w{3}))\?/g);
  }

  var gettyImages = gettyImagesFactory($scope.spaceContext.space);

  $scope.getty = {
    families: {
      creative: false,
      editorial: false
    },
    licensing: {},
    creative: {},
    offerings: {},
    editorial: null
  };

  $scope.imageFamilies = [];
  $scope.editorialImages = null;

  $scope.$watch('getty.search', function (search) {
    if(!_.isEmpty(search)){
      searchForImages($scope.getty);
    }
  });

  $scope.showImageDetail = function (image) {
    $scope.imageDetail = image;
  };

  function searchForImages (params, offset) {
    var searchParams = {
      Filter: {
        FileTypes: ['jpg'],
        ProductOfferings: objectToArray(params.offerings),
        ImageFamilies: objectToArray(params.families),
        LicensingModels: objectToArrayIf(params.families.creative, params.licensing),
        GraphicStyles: objectToArrayIf(params.families.creative, params.graphicsStyle)
      },
      ResultOptions: {
        ItemCount: IMAGES_PER_PAGE,
        ItemStartNumber: offset || 0,
      },
      Query: {
        SearchPhrase: params.search
      }
    };

    if(params.editorial) searchParams.Filter.EditorialSegments = [ capitalize(params.editorial) ];
    if(params.excludeNudity) searchParams.Filter.ExcludeNudity = true;
    if(params.vectorIllustrations) searchParams.Filter.FileTypes.push('eps');

    gettyImages.searchForImages(searchParams).then(saveResults);
  }

  function saveResults(res) {
    $scope.imageResults = res && res.data && res.data.Images ? res.data.Images : [];
  }

  function objectToArrayIf(condition, obj) {
    return condition ? objectToArray(obj) : [];
  }

  function objectToArray(obj) {
    return _.reduce(obj, pushExistingKey, []);
  }

  function pushExistingKey(res, val, key) {
    if(val) res.push(capitalize(key));
    return res;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.substr(1, str.length);
  }

  $scope.productOfferings = function (key) {
    return {
      EasyAccess: 'Easy Access'
    }[key];
  };

  $scope.licensingModel = function (key) {
    return {
      RoyaltyFree: 'Royalty Free',
      RightsManaged: 'Rights Managed'
    }[key];
  };

  $scope.augmentImagesAsFiles = function (images) {
    return _.map(images, function (image) {
      var fileName = makeFileNameRe().exec(image.UrlPreview);
      if(fileName){
        image.fileName = fileName[1];
        image.url = image.UrlPreview;
        image.contentType = extensionsToMimetypes(fileName[2]);
        image.details = {
          image: calculateDimensions(image)
        };
      }
      return image;
    });
  };

  function extensionsToMimetypes(extension) {
    return {
      jpg: 'image/jpeg',
      eps: 'application/postscript'
    }[extension];
  }

  function calculateDimensions(file) {
    var sourceDims = {
      width: parseInt(file.MaxImageResolutionWidth, 10),
      height: parseInt(file.MaxImageResolutionHeight, 10)
    };

    var baseDim = sourceDims.width >= sourceDims.height ? 'width' : 'height';
    var relativeDim = sourceDims.width < sourceDims.height ? 'width' : 'height';
    var dims = {};
    dims[baseDim] = 300;
    var ratio = (dims[baseDim]*100)/sourceDims[baseDim];
    dims[relativeDim] = Math.ceil(sourceDims[relativeDim]*(ratio*0.01));
    return dims;
  }

});
