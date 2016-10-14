'use strict';
angular.module('todo.controller.settings', [])
.controller('SettingsTabCtrl', function($scope, $rootScope, $firebase, $ionicPopup) {

	$scope.hasSettings = false;
	$scope.yourName = false;
	
	var meRef = new Firebase('https://canchat.firebaseio.com/users/'+$rootScope.auth.user.uid);
	$scope.me = $firebase(meRef);
	$scope.me.$on("loaded", function(){
		$scope.hasSettings = true;
		$scope.me.$on("change",function(){
			//$rootScope.setPushChannels();
		});
	});
	meRef.once("value",function(snap){
		if (snap.val()) {
			$scope.yourName = snap.val().name;
		}
	});
	$scope.me.$bind($scope, "settings");
	
	
	$scope.checkingFB = true;
	$scope.fbinfo = null;
	function getFBInfo() {
		forge.facebook.api('me', function (data) {
			if (data['id']) {
				$scope.checkingFB = false;
				//$('#results_me').text(data['first_name']+' '+data['last_name']);
				forge.logging.info(JSON.stringify(data));
				$scope.fbinfo = data;
				var meref = new Firebase('https://canchat.firebaseio.com/users/'+$rootScope.auth.user.uid);
				meref.child("fb_id").set(data.id);
				meref.child("fb_email").set(data.email);
				meref.child("fb_name").set(data.name);
				meref.parent().parent().child("people/"+$rootScope.auth.user.uid+"/name").once("value",function(snap){
					if (snap.val()) {
						meref.parent().parent().child("facebook_people").child(data.id).setWithPriority({
							fb_id: data.id,
							fb_name: data.name,
							uid: $rootScope.auth.user.uid,
							name: snap.val()
						}, data.id);
					}
				});
				$scope.$apply();
			} else {
				// error
				$scope.$apply();
			}
		}, function () {
			// error
			$scope.$apply();
		});
	}
	
	// facebook connection
	forge.facebook.hasAuthorized(
		['email','user_likes','user_friends','public_profile'],
		'everyone',
		function(token_information){
			forge.logging.info(JSON.stringify(token_information));
			getFBInfo();
		},
		function(content){
			forge.logging.info(JSON.stringify(content));
			$scope.checkingFB = false;
			$scope.$apply();
		}
	);
	
	$scope.facebooklogin = function() {
		forge.facebook.authorize(
			['email','user_likes','user_friends','public_profile'],
			'everyone',
			function(token_information){
				forge.logging.info(JSON.stringify(token_information));
				getFBInfo();
			},
			function(content){
				forge.logging.info(JSON.stringify(content));
				$scope.$apply();
			}
		);
	};
	
	$scope.facebookdisconnect = function() {
		forge.facebook.logout(function(){
			$scope.fbinfo = null;
			$scope.$apply();
		}, function(content){
			forge.logging.error(JSON.stringify(content));
		});
	};
	
	$scope.logoutNow = function() {
		var confirmPopup = $ionicPopup.confirm({
			title: 'Logout',
			template: 'Are you sure you want to logout?'
		});
		confirmPopup.then(function(res) {
			if(res) {
				$rootScope.auth.$logout();
				forge.facebook.logout(function(){}, function(content){});
				// unsubscribe from all previous channels
				forge.parse.push.subscribedChannels(
					function (channels) {
						forge.logging.error("LOGGED OUT AND SUBSCRIBED TO: "+JSON.stringify(channels));
						for (var i in channels) {
							if (channels[i])
								forge.parse.push.unsubscribe(channels[i], function () {
									forge.logging.error("LOGOUT UNSUBSCRIBER: "+channels[i]);
								}, function (err) { });
						}
					},
					function (err) { }
				);
			} else {
				// no logout
			}
		});
	}
});