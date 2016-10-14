angular.module('todo.service.login', ['firebase', 'todo.service.firebase'])

   .factory('loginService', ['$rootScope', '$firebaseAuth', 'firebaseRef', 'profileCreator', '$timeout',
      function($rootScope, $firebaseAuth, firebaseRef, profileCreator, $timeout) {
         var auth = null;
         return {
            init: function() {
               return auth = new FirebaseSimpleLogin(firebaseRef, function(error, user) {
				  if (error) {
					// an error occurred while attempting login
					console.log(error);
				  } else if (user) {
					// user authenticated with Firebase
					console.log('User ID: ' + user.uid + ', Provider: ' + user.provider);
				  } else {
					// user is logged out
				  }
			   });
            },

            /**
             * @param {string} email
             * @param {string} pass
             * @param {Function} [callback]
             * @returns {*}
             */
            login: function(email, pass, callback) {
               assertAuth();
               var j = auth.login('password', {
                  email: email,
                  password: pass,
                  rememberMe: true
               }).then(function(user) {
			   console.log(user);
                     if( callback ) {
                        callback(null, user);
                     }
                  }, callback);
console.log(j);
            },

            logout: function() {
               assertAuth();
               auth.$logout();
            },

            changePassword: function(opts) {
               assertAuth();
               var cb = opts.callback || function() {};
               if( !opts.oldpass || !opts.newpass ) {
                  $timeout(function(){ cb('Please enter a password'); });
               }
               else if( opts.newpass !== opts.confirm ) {
                  $timeout(function() { cb('Passwords do not match'); });
               }
               else {
                  auth.$changePassword(opts.email, opts.oldpass, opts.newpass).then(function() { cb && cb(null) }, cb);
               }
            },

            createAccount: function(email, pass, callback) {
               assertAuth();
               auth.$createUser(email, pass).then(function(user) { callback && callback(null, user) }, callback);
            },

            createProfile: profileCreator
         };

         function assertAuth() {
            if( auth === null ) { throw new Error('Must call loginService.init() before using its methods'); }
         }
      }])

   .factory('profileCreator', ['firebaseRef', '$timeout', function(firebaseRef, $timeout) {
      return function(id, email, callback) {
         firebaseRef('users/'+id).set({email: email, name: firstPartOfEmail(email)}, function(err) {
            //err && console.error(err);
            if( callback ) {
               $timeout(function() {
                  callback(err);
               })
            }
         });

         function firstPartOfEmail(email) {
            return ucfirst(email.substr(0, email.indexOf('@'))||'');
         }

         function ucfirst (str) {
            // credits: http://kevin.vanzonneveld.net
            str += '';
            var f = str.charAt(0).toUpperCase();
            return f + str.substr(1);
         }
      }
   }]);