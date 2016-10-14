'use strict';
angular.module('todo.controller.facebook', [])
.controller('FacebookCtrl', function($scope, $rootScope, $state, $firebase, $ionicPopup, $ionicSlideBoxDelegate) {
	
	$scope.slideHasChanged = function(index) {
		
	};
	
	$scope.goToFeed = function() {
		forge.notification.showLoading("Initializing", "Going to your CanChat ;)", function(){}, function(err){});
		$state.transitionTo('tabs.feed');
	};
	
	$scope.goToLast = function() {
		$ionicSlideBoxDelegate.slide(2);
	};
	
	$ionicSlideBoxDelegate.enableSlide(false);
	
	$scope.checkingFB = true;
	$scope.fbinfo = null;
	$scope.gettingFriends = false;
	$scope.fbfriends = {};
	
	function getFBInfo() {
		forge.facebook.api('me', function (data) {
			if (data['id']) {
				$scope.checkingFB = false;
				//$('#results_me').text(data['first_name']+' '+data['last_name']);
				forge.logging.info(JSON.stringify(data));
				$scope.fbinfo = data;
				$scope.$apply();
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
				getFriends();
				$scope.$apply();
				$ionicSlideBoxDelegate.slide(1);
			} else {
				// error
				$ionicSlideBoxDelegate.slide(0);
			}
		}, function () {
			// error
		});
	}
	

	function getFriends() {
		$scope.fbfriends = {};
		$scope.gettingFriends = true;
		forge.facebook.api('me/friends', function (data) {
			forge.logging.info("Got friends: "+JSON.stringify(data));
			if (data['data']) {
				var peepref = new Firebase('https://canchat.firebaseio.com/facebook_people');
				for (var i in data['data']) {
					// search for person in facebook_people
					peepref.child(data['data'][i].id).once("value",function(snap){
						if (snap.val()) {
							var person = snap.val();
							// try to see if person is a friend
							peepref.parent().child("friends/"+$rootScope.auth.user.uid).child(person.uid).once("value",function(hasThem){
								if (hasThem.val()) {
									person.isFriend = true;
								} else {
									person.isFriend = false;
								}
								$scope.gettingFriends = false;
								$scope.fbfriends[person.uid] = person;
								$scope.$apply();
							});
						}
					});
				}
				$scope.$apply();
			} else {
				// error
				$scope.fbfriends = {};
				$scope.gettingFriends = false;
				$scope.$apply();
			}
		}, function () {
			// error
			$scope.fbfriends = {};
			$scope.gettingFriends = false;
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
	
	$scope.facebookshare = function() {
		forge.facebook.ui(
			{
				method: 'share',
				href: 'http://www.canchat.co',
			},
			function(res){
				$scope.goToFeed();
			},
			function(err){
				$scope.goToFeed();
			}
		);
	};
	
	$scope.deleteFriend = function(id) {
		$rootScope.friends.$remove(id);
	};
	
  $scope.confirmFBDelete2 = function(id, name) {
     var confirmPopup = $ionicPopup.confirm({
       title: 'Are you sure?',
       template: 'Do you really want to delete ' + name + '?'
     });
     confirmPopup.then(function(res) {
       if(res) {
		 $scope.fbfriends[id].isFriend = false;
         $scope.deleteFriend(id);
       } else {
         
       }
     });
   };
   
   $scope.addFBContact = function(id, name){
		$rootScope.friends.$child(id).$set({ name : name, uid : id});
		$scope.fbfriends[id].isFriend = true;
   }
	
});