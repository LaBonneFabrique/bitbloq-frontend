'use strict';

/**
 * @ngdoc function
 * @name bitbloqApp.controller:InfoTabCtrl
 * @description
 * # InfoTabCtrl
 * Controller of the bitbloqApp
 */
angular.module('bitbloqApp')
    .controller('InfoTabCtrl', function($scope, $rootScope, $log, alertsService, _, utils, projectService) {

        $scope.setTheme = function(theme) {
            projectService.project.defaultTheme = theme;
            projectService.startAutosave();
        };

        $scope.uploadImageTrigger = function(type) {
            $log.debug('uploadImageTrigger');
            if (type === 'main') {
                $log.debug($('.main-image--input'));
                $('.main-image--input').click();
            } else {
                $('.other-image--input').click();
            }
        };

        $scope.uploadImage = function(e) {
            var properties = {
                minWidth: 600,
                minHeight: 400,
                containerDest: 'projectImage',
                without: /image.gif/
            };
            utils.uploadImage(e, properties).then(function(response) {
                projectService.tempImage.blob = response.blob;
                projectService.tempImage.file = response.file;
                projectService.tempImage.img = response.img;
                projectService.tempImage.generate = false;
                projectService.project.image = 'custom';
                projectService.startAutosave();
            }).catch(function(response) {
                switch (response.error) {
                    case 'heavy':
                        alertsService.add({
                            text: 'info-tab-image-heavy-error',
                            id: 'info-tab-image',
                            type: 'warning'
                        });
                        break;
                    case 'small':
                        alertsService.add({
                            text: 'info-tab-image-small-error',
                            id: 'info-tab-image',
                            type: 'warning'
                        });
                        break;
                    case 'no-image':
                        alertsService.add({
                            text: 'info-tab-image-read-error',
                            id: 'info-tab-image',
                            type: 'warning'
                        });
                        break;
                }
            });
        };

        $scope.getTimes = function(n) {
            return new Array(n);
        };

        $scope.addTag = function(tag, event) {
            if (!event || event.keyCode === 13) {
                if (!!tag) {
                    var tagArray = tag.split(',');
                    tagArray.forEach(function(item) {
                        item = item.trim();
                        if (item && projectService.project.userTags.indexOf(item) === -1) {
                            projectService.project.userTags.push(item);
                        }
                    });
                    projectService.startAutosave();
                    $scope.form.tag = '';
                }
            }
        };
        $scope.removeTag = function(tag) {
            var indexTag = projectService.project.userTags.indexOf(tag);
            if (indexTag > -1) {
                projectService.project.userTags.splice(indexTag, 1);
                projectService.startAutosave();
            }
        };

        function composeImage() {
            var canvas = document.getElementById('testcanvas');
            var context = canvas.getContext('2d');
            $log.debug('context', context);
            var imageObj = new Image();
            canvas.width = 775;
            canvas.height = 411;
            if (projectService.project.hardware.board) {
                if (projectService.project.hardware.robot) {
                    var robotRef = projectService.getRobotMetaData();
                    var robotIcon = robotRef.id;
                    imageObj.src = '/images/robots/' + robotIcon + '.png';
                } else {
                    var boardRef = projectService.getBoardMetaData();
                    var boardIcon = boardRef.id;
                    imageObj.src = '/images/boards/' + boardIcon + '.png';
                }
            }
            var components = projectService.project.hardware.components;

            imageObj.onload = function() {
                if (projectService.project.hardware.robot) {
                    setMainImage(canvas, context, imageObj, projectService.project.hardware.robot);
                } else {
                    setMainImage(canvas, context, imageObj, false);
                }
                setComponentsImage(canvas, context, components);
            };
        }

        function setComponentsImage(canvas, context, components) {

            var limitedComponents = components.slice(0, 4);
            var counter = 0;
            limitedComponents.forEach(function(component) {
                var componentImage = new Image();
                componentImage.src = '/images/components/' + component.id + '.png';
                componentImage.onload = function() {
                    setComponentImage(canvas, context, componentImage, counter);
                    counter++;
                    generateImage(canvas);
                };
            });
        }

        function setComponentImage(canvas, context, imageObj, componentPosition) {
            $log.debug('Set component Image');

            var imageAspectRatio = imageObj.width / imageObj.height;
            var renderableHeight, renderableWidth, xStart, yStart;

            if (componentPosition > 0) {
                xStart = 105 + (componentPosition * 125);
            } else {
                xStart = 105;
            }
            renderableHeight = 120;
            renderableWidth = 120;
            if (imageAspectRatio < 1) {
                renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
                yStart = canvas.height - renderableHeight - 25;
            } else if (imageAspectRatio > 1) {
                renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
                yStart = canvas.height - renderableHeight - 25;
            } else {
                yStart = canvas.height - renderableHeight;
            }
            context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);

        }

        function setMainImage(canvas, context, imageObj, robot) {

            $log.debug('Set board Image');
            var xStart = (canvas.width - 530) / 2;
            context.fillStyle = '#f3f3f3';
            context.fillRect(0, 0, canvas.width, canvas.height);
            if (robot) {
                switch (robot) {
                    case 'mbot':
                        context.drawImage(imageObj, xStart, 30, 542, 348);
                        break;
                    case 'evolution':
                        context.drawImage(imageObj, xStart, 60, 542, 325);
                        break;
                    default:
                        context.drawImage(imageObj, xStart, -60, 542, 542);
                }
            } else {
                context.drawImage(imageObj, xStart, -120, 530, 380);
            }
            generateImage(canvas);

        }

        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {
                type: contentType
            });
            return blob;
        }

        function generateImage(canvas) {
            var pngUrl = canvas.toDataURL();
            var base64String = pngUrl.substr(pngUrl.indexOf(',') + 1);
            $log.debug('Generando imagen...');
            $('#projectImage').attr('src', pngUrl);

            projectService.tempImage.blob = b64toBlob(base64String, 'image/png');
            projectService.tempImage.file = projectService.tempImage.blob;
            projectService.tempImage.generate = true;

            projectService.startAutosave();
        }

        $scope.imagesToUpload = [];
        $scope.projectImages = [0, 1, 2, 3];
        $scope.availableThemes = ['infotab_option_grayTheme', 'infotab_option_colorTheme'];

        $('#textarea').autogrow({
            onInitialize: true
        });

        /*************************************************
         WATCHERS
         *************************************************/

        var generateImageEvent = $rootScope.$on('generate:image', function() {
            $log.debug('composing image');
            composeImage();
        });

        $scope.$on('$destroy', function() {
            generateImageEvent();
        });
    });