'use strict';

angular.module('todo.routes', ['ngRoute'])
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
	$stateProvider
	.state('tabs', {
		url: "/tab",
		abstract: true,
		templateUrl: "tabs.html"
	})
	.state('tabs.feed', {
		url: "/feed",
		views: {
			'feed-tab': {
				templateUrl: "feed.html"
			}
		}
	})
	.state('tabs.friends', {
		url: "/friends",
		views: {
			'friends-tab': {
				templateUrl: "friends.html",
				controller: 'FriendsTabCtrl'
			}
		}
	})
	.state('tabs.facts', {
		url: "/facts",
		views: {
			'friends-tab': {
				templateUrl: "facts.html"
			}
		}
	})
	.state('tabs.navstack', {
		url: "/navstack",
		views: {
			'about-tab': {
				templateUrl: "nav-stack.html"
			}
		}
	})
	.state('tabs.settings', {
		url: "/settings",
		views: {
			'settings-tab': {
				templateUrl: "settings.html"
			}
		}
	});
	$urlRouterProvider.otherwise("/tab/feed");
}]);