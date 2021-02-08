///<reference path="../../bower_components/DefinitelyTyped/angularjs/angular.d.ts"/>

angular.module('microprofileio-projects', ['microprofileio-contributors', 'microprofileio-text'])

    .factory('microprofileioProjectsService', [
        '$http',
        '$q',
        function ($http, $q) {
            return {
                getProjects: function () {
                    return $http.get('api/project');
                },
                getProjectsHydrated: function () {
                    return $http.get('api/projectHydrated');
                },
                getProject: function (configFile) {
                    if (!configFile) {
                        return {
                            then: function () {
                            }
                        };
                    } else {
                        return $http.get('api/project/' + configFile);
                    }
                },
                getProjectPage: function (configFile, resource) {
                    if (resource === null || resource === undefined) {
                        return $http.get('api/project/page/' + configFile + '/');
                    } else {
                        return $http.get('api/project/page/' + configFile + '/' + resource);
                    }
                },
                getAppPage: function (resource) {
                    return $http.get('api/application/page/' + resource);
                }
            };
        }
    ])

    .directive('microprofileioProjectsShortlist', [function () {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'app/templates/dir_projects_projects_shortlist.html',
            controller: ['$scope', '$timeout', 'microprofileioProjectsService', function ($scope, $timeout, projectsService) {
                projectsService.getProjectsHydrated().then(function (response) {
                    $timeout(function () {
                        $scope.$apply(function () {
                            $scope.projects = response.data;
                        });
                    });
                });
            }]
        };
    }])

    .directive('microprofileioProjectCardContributors', [function () {
        return {
            restrict: 'A',
            scope: {
                project: '='
            },
            templateUrl: 'app/templates/dir_projects_project_card_contributors.html',
            controller: ['$scope', '$timeout', function ($scope, $timeout) {
                $scope.$watch('project', () => {
                    if ($scope.project && $scope.project.contributors) {
                        $timeout(() => {
                            $scope.$apply(() => {
                                $scope.hasMore = $scope.project.contributors.length > 6;
                                $scope.contributors = $scope.project.contributors.slice(0, 6);
                            });
                        });
                    }
                });
            }]
        };
    }])

    .directive('microprofileioProjectCardContributor', [function () {
        return {
            restrict: 'A',
            scope: {
                contributor: '='
            },
            templateUrl: 'app/templates/dir_projects_project_card_contributor.html',
            controller: ['$scope', '$timeout', 'microprofileioContributorsService', function ($scope, $timeout, contributorService) {
                $scope.contributor = $scope.contributor.info;
            }]
        };
    }])

    .directive('microprofileioProjectCard', [function () {
        return {
            restrict: 'A',
            scope: {
                projectData: '='
            },
            templateUrl: 'app/templates/dir_projects_project_card.html',
            controller: ['$scope', '$timeout', 'microprofileioProjectsService', function ($scope, $timeout, projectsService) {
                    let project = $scope.projectData;
                    $scope.project = project;
                    let normalizeName = (name: String) => {
                        return name.split(':')[0];
                    };
                    $scope.name = project.info.friendlyName ? project.info.friendlyName : normalizeName(project.info.name);
            }]
        };
    }])

    .directive('microprofileioProjectNameDescription', [function () {
        return {
            restrict: 'E',
            scope: {
                configFile: '='
            },
            templateUrl: 'app/templates/dir_projects_project_name_description.html',
            controller: ['$scope', '$timeout', '$sce', 'microprofileioProjectsService',
                function ($scope, $timeout, $sce, projectsService) {
                    $scope.project = {};
                    projectsService.getProject($scope.configFile).then(function (response) {
                        $timeout(function () {
                            $scope.$apply(function () {
                                $scope.project.detail = response.data;
                            });
                        });
                    });
                }
            ]
        };
    }])

    .directive('microprofileioProjectDoc', [function () {
        return {
            restrict: 'E',
            scope: {
                configFile: '=',
                resource: '='
            },
            templateUrl: 'app/templates/dir_projects_project_doc.html',
            controller: ['$scope', '$timeout', '$sce', 'microprofileioProjectsService', 'microprofileioProjectsDocService',
                function ($scope, $timeout, $sce, projectsService, docService) {
                    $scope.project = {};
                    let normalizeName = (name: String) => {
                        return name.split(':')[0];
                    };
                    let normalizeVersion = (name: String) => {
                        let values = name.split(':');
                        if (values.length > 1) {
                            return values[1];
                        }
                        return '';
                    };
                    projectsService.getProject($scope.configFile).then(function (response) {
                        $timeout(function () {
                            $scope.$apply(function () {
                                $scope.project.detail = response.data;
                                $scope.name = normalizeName(response.data.info.name);
                                $scope.version = normalizeVersion(response.data.info.name);
                            });
                        });
                    });
                    projectsService.getProjects().then(function (response) {
                        $timeout(function () {
                            $scope.$apply(function () {
                                $scope.otherProjects = response.data.filter((item) => { return item !== $scope.configFile});
                            });
                        });
                    });
                    projectsService.getProjectPage($scope.configFile, $scope.resource).then(function (response) {
                        $timeout(function () {
                            $scope.$apply(function () {
                                $scope.project.doc = $sce.trustAsHtml(docService.normalizeResources(
                                    response.data.content
                                ));
                            });
                        });
                    });
                }
            ]
        };
    }])

    .directive('microprofileioProjectDocRelated', [function () {
        return {
            restrict: 'E',
            scope: {
                configFile: '='
            },
            templateUrl: 'app/templates/dir_projects_project_doc_related.html',
            controller: ['$scope', '$timeout', 'microprofileioProjectsService',
                function ($scope, $timeout, projectsService) {
                    $scope.related = {};
                    projectsService.getProject($scope.configFile).then(function (response) {
                        $timeout(function () {
                            $scope.$apply(function () {
                                $scope.related = response.data;
                            });
                        });
                    });
                }
            ]
        };
    }])

    .directive('microprofileioShareProject', ['$window', function ($window) {
        return {
            restrict: 'A',
            scope: {
                project: "=",
                media: "@"
            },
            link: function ($scope, $element) {
                $element.bind('click', function () {
                    var url;
                    if ('twitter' === $scope.media) {
                        url = 'https://twitter.com/intent/tweet?text=Check out '
                            + window.location.origin + '/projects/' + $scope.project.info.name;
                    } else if ('facebook' === $scope.media) {
                        url = 'http://www.facebook.com/sharer/sharer.php?u='
                            + window.location.origin + '/projects/' + $scope.project.info.name;
                    }
                    if (url) {
                        $window.open(url, 'name', 'width=600,height=400');
                    }
                });
            }
        };
    }])

    .run(function () {
        // placeholder
    });
