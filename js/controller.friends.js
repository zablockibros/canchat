'use strict';
angular.module('todo.controller.friends', [])
.controller('FriendsTabCtrl', function($scope, $rootScope, $ionicPopup, $location, $firebase, $ionicLoading, $timeout) {
	
	$scope.addFriend = function(id) {
		//$scope.friendObj.$child(id).$set({
		//	name : 
		//});
	};
	
	$scope.deleteFriend = function(id) {
		$rootScope.friends.$remove(id);
	};
	
	$scope.getFriends = function() {
		
	};
	$scope.clearSearch = function() {
		$scope.query = '';
	};
	$scope.getPeople = function(query) {
		 
	};
	
	$scope.confirmDelete = function(id, name) {
     var confirmPopup = $ionicPopup.confirm({
       title: 'Are you sure?',
       template: 'Do you really want to delete ' + name + '?'
     });
     confirmPopup.then(function(res) {
       if(res) {
        $scope.deleteFriend(id);
       } else {
         
       }
     });
   };
   
  $scope.confirmDelete2 = function(id, name) {
     var confirmPopup = $ionicPopup.confirm({
       title: 'Are you sure?',
       template: 'Do you really want to delete ' + name + '?'
     });
     confirmPopup.then(function(res) {
       if(res) {
		 $scope.isFriend = false;
         $scope.deleteFriend(id);
       } else {
         
       }
     });
   };
   
   $scope.addContact = function(id, name){
		$rootScope.friends.$child(id).$set({ name : name, uid : id});
		$scope.isFriend = true;
   }

   	// Close the new friend modal, here to clear it
	$scope.closeNewFriend = function() {
		$scope.searchP = "";
		$scope.found = false;
		$scope.noneFound = false;
		$rootScope.friendModal.hide().then(function(){
			$rootScope.friendModal.remove();
		});
	};
	
	$scope.searchPeople = function(name){
		//console.log(name);
		new Firebase("https://canchat.firebaseio.com/people")
		.startAt(name)
		.endAt(name)
		.once('value', function(snap) {
			//console.log(snap.val());
		   if(snap.val()){
			//check if they are already a contact
			var key;
			for ( key in snap.val() ){
				//console.log(key);
				if($rootScope.auth.user.uid == key){
					//it is them
					$scope.noneFound = true;
					$scope.$apply();
				}
				else{
					$scope.noneFound = false;
					$scope.found = name;
					$scope.friendID = key;
					new Firebase("https://canchat.firebaseio.com/friends/"+$rootScope.auth.user.uid+"/"+key).once('value', function(friend) {
						if(friend.val()){
							//is contact
							$scope.isFriend = true;
							$scope.$apply();
						}
						else{
							$scope.isFriend = false;
							$scope.$apply();
						}
					});
				}
			}
		   }
		   else{
				//this user does not exist
				$scope.noneFound = true;
				$scope.$apply();
		   }
		});
	}
	
	$scope.data = {};
	$scope.data.checkingFB = true;
	$scope.data.gettingFriends = false;
	$scope.data.fbinfo = null;
	$scope.data.fbfriends = {};

	function getFBInfo() {
		forge.facebook.api('me', function (data) {
			forge.logging.info(JSON.stringify(data));
			if (data['first_name']) {
				$scope.data.checkingFB = false;
				//$('#results_me').text(data['first_name']+' '+data['last_name']);
				forge.logging.info(JSON.stringify(data));
				$scope.data.fbinfo = data;
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
			} else {
				// error
				$scope.data.fbinfo = null;
				$scope.data.fbfriends = {};
				$scope.$apply();
			}
		}, function () {
			// error
			$scope.data.fbinfo = null;
			$scope.data.fbfriends = {};
			$scope.$apply();
		});
	}
	function getFriends() {
		$scope.data.fbfriends = {};
		$scope.data.gettingFriends = true;
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
								$scope.data.gettingFriends = false;
								$scope.data.fbfriends[person.uid] = person;
								$scope.$apply();
							});
						}
					});
				}
				$scope.$apply();
			} else {
				// error
				$scope.data.fbfriends = {};
				$scope.data.gettingFriends = false;
				$scope.$apply();
			}
		}, function () {
			// error
			$scope.data.fbfriends = {};
			$scope.data.gettingFriends = false;
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
			forge.logging.error(JSON.stringify(content));
			$scope.data.checkingFB = false;
			$scope.data.fbinfo = null;
			$scope.data.fbfriends = {};
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
			}
		);
	};
	
	$scope.facebookdisconnect = function() {
		forge.facebook.logout(function(){
			$scope.data.checkingFB = false;
			$scope.data.fbinfo = null;
			$scope.data.fbfriends = {};
			$scope.$apply();
		}, function(content){
			forge.logging.error(JSON.stringify(content));
		});
	};
	
  $scope.confirmFBDelete2 = function(id, name) {
     var confirmPopup = $ionicPopup.confirm({
       title: 'Are you sure?',
       template: 'Do you really want to delete ' + name + '?'
     });
     confirmPopup.then(function(res) {
       if(res) {
		 $scope.data.fbfriends[id].isFriend = false;
         $scope.deleteFriend(id);
       } else {
         
       }
     });
   };
   
   $scope.addFBContact = function(id, name){
		$rootScope.friends.$child(id).$set({ name : name, uid : id});
		$scope.data.fbfriends[id].isFriend = true;
   }
   
   
   
	$scope.contacts = [];
	$scope.syncContacts = function() {
		$ionicLoading.show({
			template: 'Syncing contacts...'
		});
		$scope.contacts = [];
		forge.contact.selectAll(["phoneNumbers"],function(list){
			forge.logging.info(JSON.stringify(list));
			var contacts = [];
			for (var i in list) {
				if (list[i].phoneNumbers) {
					//$scope.contacts.push(list[i]);
				/*	$rootScope.friends.$child(formatNumber(list[i].phoneNumbers[0].value)).$set({
						number: formatNumber(list[i].phoneNumbers[0].value),
						name: list[i].displayName,
						uid: formatNumber(list[i].phoneNumbers[0].value)
					});*/
					contacts.push({
						number: formatNumber(list[i].phoneNumbers[0].value),
						name: list[i].displayName,
					});
				}
			}
			if (contacts.length > 0) {
				forge.request.ajax({
					type: 'POST',
					url: 'http://still-garden-8974.herokuapp.com/save_contacts',
					data: { token: $rootScope.token, contacts: contacts },
					dataType: 'json',
					success: function(data, headers) {
						forge.logging.info('contacts SUCCESS: '+JSON.stringify(data));
						$scope.$apply();
						$ionicLoading.hide();
						$scope.closeNewFriend();
					},
					error: function(error) {
						forge.logging.info('contacts FAILED: '+JSON.stringify(error));
						$scope.$apply();
						$ionicLoading.hide();
						$scope.closeNewFriend();
					}
				});
			} else {
				$scope.$apply();
				$ionicLoading.hide();
				$scope.closeNewFriend();
			}
		},
		function(){
			$ionicLoading.hide();
			$scope.closeNewFriend();
		});

	};
	
	//$scope.syncContacts();
	
//	$scope.addContact = function(number, name) {
//		
//	};
	
	
	function formatNumber(number) {
		return formatE164("US", number);
		var num = number.replace(/[^\d]/g,'');
		num = num.replace("+1","");
		num = "+1"+num;
		return num;
	}
	function validateNumber(number) {
		var num = number.replace(/[^\d]/g,'');
		num = num.replace("+1","");
		if(num.length != 10) {
			return false;                 
		} else {
			return true;
		}
	}
   
});