'use strict';

angular.module('contentful').controller('GettyDialogController', function($scope, gettyImagesFactory, PromisedLoader, Paginator) {

  var IMAGES_PER_PAGE = 6;

  var entryLoader = new PromisedLoader();

  $scope.paginator = new Paginator();
  $scope.paginator.pageLength = IMAGES_PER_PAGE;

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
      searchForImages($scope.getty).then(saveResults);
    }
  });

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
        ItemStartNumber: offset+1 || 0
      },
      Query: {
        SearchPhrase: params.search
      }
    };

    if(params.editorial) searchParams.Filter.EditorialSegments = [ capitalize(params.editorial) ];
    if(params.excludeNudity) searchParams.Filter.ExcludeNudity = true;
    if(params.vectorIllustrations) searchParams.Filter.FileTypes.push('eps');
    if(params.sorting) {
      if(params.families.editorial && !params.families.creative)
        searchParams.ResultOptions.EditorialSortOrder = params.sorting;
      if(!params.families.editorial && params.families.creative)
        searchParams.ResultOptions.CreativeSortOrder = params.sorting;
    }

    return gettyImages.searchForImages(searchParams);
  }

  function saveResults(res) {
    $scope.paginator.numEntries = res && res.data && res.data.ItemTotalCount;
    $scope.imageResults = parseResult(res);
  }

  function parseResult(res) {
    // TODO better handling of null results or error conditions
    return res && res.data && res.data.Images ? res.data.Images : [];
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

  $scope.loadMore = function() {
    if ($scope.paginator.atLast() ||
        $scope.imageResults.length === 0 ||
        $scope.imageDetail
       ) return;
    $scope.paginator.page++;
    entryLoader.loadPromise(
      searchForImages, $scope.getty, $scope.paginator.skipItems()
    ).
    then(function (res) {
      /*
      if(!entries){
        sentry.captureError('Failed to load more entries', {
          data: {
            entries: entries
          }
        });
        return;
      }
      */
      $scope.paginator.numEntries = res && res.data && res.data.ItemTotalCount;
      var images = _.difference(parseResult(res), $scope.imageResults);
      $scope.imageResults.push.apply($scope.imageResults, images);
    }, function () {
      $scope.paginator.page--;
    });
  };

  $scope.sortBy = function (sorting) {
    $scope.getty.sorting = sorting == 'default' ? null : sorting;
    searchForImages($scope.getty).then(saveResults);
  };

  $scope.showImageDetail = function (image) {
    gettyImages.getImageDetails({
      ImageIds: [image.ImageId]
    }).then(function (res) {
      $scope.imageDetail = res.data.Images[0];
    });
  };

});
