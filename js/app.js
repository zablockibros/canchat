/**
 *	Pre app forge
 */

var app = angular.module('todo', ['todo.config','todo.controller.root','todo.controller.login','todo.controller.facebook','todo.controller.feed','todo.controller.comments','todo.controller.friends','todo.controller.settings','todo.controller.verify','ionic', 'ngRoute', 'routeSecurity', 'waitForAuth', 'firebase']);

app.config(['$compileProvider', function($compileProvider) {
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|content|blob):|data:image|/);
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel|content|http)/);
	// note: you'll also have to do imgSrcSanitizationWhitelist if you want to use general links as well as ng-src on images.
}]);

app.filter('fromNow', function() {
  return function(date) {
    return moment(date).fromNow(true);
  }
});

app.filter('reverse', function() {
  function toArray(list) {
	 var k, out = [];
	 if( list ) {
		if( angular.isArray(list) ) {
		   out = list;
		}
		else if( typeof(list) === 'object' ) {
		   for (k in list) {
			  if (list.hasOwnProperty(k)) { out.push(list[k]); }
		   }
		}
	 }
	 return out;
  }
  return function(items) {
	 return toArray(items).slice().reverse();
  };
});
   
app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
	$stateProvider
//	.state('tabs', {
//		url: "/tab",
//		abstract: true,
//		templateUrl: "templates/tabs.html"
//	})
	.state('login', {
		url: "/login",
		templateUrl: "templates/login.html",
		controller: 'LoginCtrl',
		resolve: {
			auth: 'waitForAuth'
		}
	})
	.state('facebook', {
		url: "/facebook",
		templateUrl: "templates/facebook.html",
		controller: 'FacebookCtrl',
	//	authRequired: true,
	//	resolve: {
	//		auth: 'waitForAuth'
	//	}
	})
	.state('feed', {
		url: "/feed",
	//	views: {
	//		'main-tab': {
				templateUrl: "templates/feeder.html",
				controller: 'FeedTabCtrl',
	//		}
	//	},
		authRequired: true,
		resolve: {
			auth: 'waitForAuth'
		}
	})
	.state('comments', {
		url: "/comments/:randid",
	//	views: {
	//		'main-tab': {
				templateUrl: "templates/comments.html",
				controller: 'CommentsCtrl',
	//		}
	//	},
		authRequired: true,
		resolve: {
			auth: 'waitForAuth'
		}
	})
	.state('friends', {
		url: "/friends",
	//	views: {
	//		'main-tab': {
				templateUrl: "templates/friends.html",
				controller: 'FriendsTabCtrl',
	//		}
	//	},
		authRequired: true,
		resolve: {
			auth: 'waitForAuth'
		}
	})
	.state('settings', {
		url: "/settings",
	//	views: {
	//		'main-tab': {
				templateUrl: "templates/settings.html",
				controller: 'SettingsTabCtrl',
	//		}
	//	},
		authRequired: true,
		resolve: {
			auth: 'waitForAuth'
		}
	})
	.state('tabs.facts', {
		url: "/facts",
		views: {
			'friends-tab': {
				templateUrl: "facts.html"
			}
		},
		resolve: {
			auth: 'waitForAuth'
		}
	})
	.state('tabs.navstack', {
		url: "/navstack",
		
	});
	//$urlRouterProvider.otherwise("/tab/feed");
}]);

app.controller('ContentCtrl', function($scope, $ionicSideMenuDelegate) {
	$scope.toggleLeft = function() {
		$ionicSideMenuDelegate.toggleLeft();
	};
});

app.run(['$ionicPlatform','$rootScope','$location','$state', '$routeParams','$ionicPopup', 'waitForAuth','$firebase','$firebaseSimpleLogin',
function($ionicPlatform, $rootScope, $location, $state, $routeParams, $ionicPopup, waitForAuth, $firebase, $firebaseSimpleLogin) {
	
	var offlinePopup,
		connected = true,
		paused = false;
		
	/*
	 *	Initial stuff
	 */
	$rootScope.afterLogin = "feed";
	$rootScope.afterLoginOnce = null;
	$rootScope.$state = $state;
	
	Parse.initialize("87lHoEIBLypXbUthdUMInBJbN5Zry2ZxfdKiJUIv", "W2M1hntegobAtZY8skrdzZKvmhSAScwvnOmf1wff");
	forge.notification.showLoading("Starting", "Please wait for CanChat ;)", function(){}, function(err){});
	
	/*
	 *	Router and back button
	 */
	$rootScope.history = [];
	$rootScope.shownModal = null;
	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
		var isBack = ("isBack" in toParams) ? toParams["isBack"] : false;
		if (!isBack || 1 == 1) {
			$rootScope.history.push({
				to: toState,
				params: toParams
			});
			forge.logging.info("History success: "+JSON.stringify($rootScope.history[$rootScope.history.length-1]));
		}
	});
	forge.event.backPressed.preventDefault(function(){
		forge.logging.info("back prevented");
	},
	function(){});
	forge.event.backPressed.addListener(function(){
		forge.logging.info("back now");
		if ($rootScope.history.length > 1 && !$rootScope.shownModal) {
			forge.logging.info("going back in url");
			$rootScope.history.pop();
			var hist = $rootScope.history.pop();
			hist.params.isBack = true;
			forge.logging.info("History pop: "+JSON.stringify(hist));
			$state.transitionTo(hist.to, hist.params);
		}
		else if ($rootScope.shownModal) {	
			forge.logging.info("modal shown back");
			$rootScope.shownModal.hide();
			$rootScope.shownModal = null;
		}
	},
	function(){});
	
	 
	/*
	 *	Events for tracking firebase
	 */
	var firebaseRef = new Firebase('https://canchat.firebaseio.com');
	
	$rootScope.feed = null;
	$rootScope.friends = null;
	$rootScope.badges = {
		feed: 0
	};
	
	/**
	 *	Setup auth
	 */
	var ref = $rootScope.ref = new Firebase('https://canchat.firebaseio.com');
	$rootScope.auth = $firebaseSimpleLogin(ref);
	$rootScope.token = null;
	
	/**
	 *	On login
	 */
	$rootScope.$on("$firebaseSimpleLogin:login", function(evt, user) {

		forge.logging.info("MAIN APP LOGIN EVENT");
		forge.logging.info(JSON.stringify(user));
		$rootScope.token = user.firebaseAuthToken;
		
			/*forge.request.ajax({
				type: 'POST',
				url: 'http://still-garden-8974.herokuapp.com/get_verify',
				data: {token: user.firebaseAuthToken, number: '9892054240'},
				dataType: 'json',
				//headers: {
				//	'X-Header-Name': 'header value',
				//},
				success: function(data, headers) {
					forge.logging.info('VERIFY CALL SUCCESS: '+JSON.stringify(data));
					//trigger.logging.info('Response headers: ' + JSON.stringify(headers));
				},
				error: function(error) {
					forge.logging.info('VERIFY CALL FAILED: '+JSON.stringify(error));
				}
			});*/
	
		/*
		 *	Set feed and friends data
		 */
		var friendRef = new Firebase('https://canchat.firebaseio.com/friends/'+$rootScope.auth.user.uid);
		$rootScope.friends = $firebase(friendRef);
	
		$rootScope.feedLastSeenTime = new Date().getTime();
		$rootScope.feedLimit = 100;
		$rootScope.feedRef = new Firebase('https://canchat.firebaseio.com/feed/'+$rootScope.auth.user.uid).limit(100);
		$rootScope.feed = $firebase($rootScope.feedRef);
		$rootScope.feed.$on("child_added",function(snap){
			//forge.logging.info("Received feed: "+JSON.stringify(snap));
			//forge.logging.info(paused);
			if ($state.current.name != "feed")
				$rootScope.badges.feed += 1;
			if (paused) {
				forge.notification.create("CanChat Alert", snap.content, function(){}, function(err){});
			}
		});
		$rootScope.feed.$on("loaded",function(snap){
			$rootScope.feedLastSeenTime = new Date().getTime();
		});

		// redirect after login
		forge.logging.info($rootScope.afterLoginOnce);
		if ($rootScope.afterLoginOnce) {
			$rootScope.history = [];
			$state.transitionTo($rootScope.afterLoginOnce);
			$rootScope.afterLoginOnce = null;
		} else if ($rootScope.afterLogin) {
			$rootScope.history = [];
			$state.transitionTo($rootScope.afterLogin);
			$rootScope.afterLogin = null;
		}
		
		// subscribe to the channel you're alread in
		$rootScope.setPushChannels();
		
	});
	/**
	 *	On logout
	 */
	$rootScope.$on("$firebaseSimpleLogin:logout", function(evt) {
		$rootScope.token = null;
	
		forge.logging.error("THIS IS THE LOGGING OUT EVENT");
	
		$rootScope.history = [];
		$state.transitionTo('login');
		$rootScope.afterLogin = "feed";
		
		if ($rootScope.feed) {
			$rootScope.feed.$off();
			$rootScope.friends.$off();
		}

	});
	
	$state.transitionTo('login');
	
	
	$ionicPlatform.ready(function () {
		// hide initial loading
		waitForAuth.then(function(){
			forge.notification.hideLoading(function(){}, function(err){});
		});
		
		// hide image
		forge.launchimage.hide(function(val){}, function(err){});
	});
		
	/**
	 *	Forge event hookups
	 */
	
	forge.parse.installationInfo(function (info) {
		forge.logging.info("installation: "+JSON.stringify(info));
	});

	// only called when push is clicked on
	forge.event.messagePushed.addListener(function (msg) {
		forge.logging.info("Push received: "+msg.alert);
	});

	// App is paused
	forge.event.appPaused.addListener(function(data){
		paused = true;
		forge.logging.error("APP PAUSED");
		//Firebase.goOffline();
	}, function(){});
	
	// App resumes
	forge.event.appResumed.addListener(function(data){
		Firebase.goOffline();
		paused = false;
		forge.logging.error("APP RESUMED");
		Firebase.goOnline();
		
		/**
		 *	Reset firebase root auth
		 */
		
		var ref = $rootScope.ref = new Firebase('https://canchat.firebaseio.com');
		$rootScope.auth = $firebaseSimpleLogin(ref);
		$rootScope.auth.$getCurrentUser().then(function(user){
			forge.logging.info(JSON.stringify(user));
			if (user) {
				var friendRef = new Firebase('https://canchat.firebaseio.com/friends/'+$rootScope.auth.user.uid);
				$rootScope.friends = $firebase(friendRef);
			
				$rootScope.feedLastSeenTime = new Date().getTime();
				$rootScope.feedLimit = 100;
				$rootScope.feedRef = new Firebase('https://canchat.firebaseio.com/feed/'+$rootScope.auth.user.uid).limit(100);
				$rootScope.feed = $firebase($rootScope.feedRef);
				$rootScope.feed.$on("child_added",function(snap){
					if ($state.current.name != "feed")
						$rootScope.badges.feed += 1;
					if (paused) {
						forge.loggging.info("Received feed: "+JSON.stringify(snap.val()));
						forge.notification.create("CanChat Alert", snap.val().content, function(){}, function(err){});
					}
				});
				$rootScope.feed.$on("loaded",function(snap){
					$rootScope.feedLastSeenTime = new Date().getTime();
					forge.logging.info("new feed loaded");
				});
				
				// if user is logged in prior to pause and not reload
				if (!$rootScope.afterLogin)
					$state.reload();
			}
		});
	}, function(){});
	
	// this never happens
	forge.event.messagePushed.addListener(function(msg){
		forge.logging.info("Forge push: "+JSON.stringify(msg));
		//alert(msg.alert);
		if (paused) {
		//	forge.notification.create("CanChat Alert", msg.alert, function(){}, function(err){});
		}
	}, function(err){
	
	});
	
	forge.event.connectionStateChange.addListener(function(data){
	
		connect = forge.is.connection.connected();
		
		if (forge.is.connection.connected()) {
			if (offlinePopup)
				offlinePopup.close();
			offlinePopup = null;
			Firebase.goOnline();
		} else {
			offlinePopup = $ionicPopup.show({
				template: '',
				title: 'You have lost connection',
				subTitle: 'Please wait until you have a strong connection',
				buttons: [
					//{ text: 'Cancel' },
					{
						text: '<b>Try again</b>',
						type: 'button-positive',
						onTap: function(e) {
							if (!connected) {
								//don't allow the user to close unless he enters wifi password
								e.preventDefault();
							}
						}
					},
				]
			});
		}
		
	}, function(){});
	
	
	
	$rootScope.setPushChannels = function() {
		$rootScope.ref.child("users/"+$rootScope.auth.user.uid).once("value",function(snap){
			if (snap.val()) {
				forge.parse.push.subscribe("user_"+$rootScope.auth.user.uid.replace(":","_"), function () {
					forge.logging.info("subscribed to user_"+$rootScope.auth.user.uid.replace(":","_"));
				}, function (err) {
					forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
				});
			/*	
				var user = snap.val();
				if (user.push_new) {
					forge.parse.push.subscribe("user_new_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("subscribed to user_new_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				} else {
					forge.parse.push.unsubscribe("user_new_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("NOT ubscribed to user_new_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				}
				if (user.push_pm) {
					forge.parse.push.subscribe("user_pm_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("subscribed to user_pm_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				} else {
					forge.parse.push.unsubscribe("user_pm_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("NOT subscribed to user_pm_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				}
				if (user.push_new_comments) {
					forge.parse.push.subscribe("user_new_comments_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("subscribed to user_new_comments_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				} else {
					forge.parse.push.unsubscribe("user_new_comments_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("NOT subscribed to user_new_comments_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				}
				if (user.push_pm_comments) {
					forge.parse.push.subscribe("user_pm_comments_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("subscribed to user_pm_comments_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				} else {
					forge.parse.push.unsubscribe("user_pm_comments_"+$rootScope.auth.user.uid.replace(":","_"), function () {
						forge.logging.info("NOT subscribed to user_pm_comments_"+$rootScope.auth.user.uid.replace(":","_"));
					}, function (err) {
						forge.logging.error("error subscribing to beta-tester notifications: "+ JSON.stringify(err));
					});
				}
			*/
			}
		});
	}
	
}]);