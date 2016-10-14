(function(angular) {
   angular.module('routeSecurity', [])
      .run(['$injector', '$location', '$rootScope', 'loginRedirectPath', function($injector, $location, $rootScope, loginRedirectPath) {
         if( $injector.has('$route') ) {
            new RouteSecurityManager($location, $rootScope, $injector.get('$route'), loginRedirectPath);
         }
      }]);

   function RouteSecurityManager($location, $rootScope, $route, path) {
	/*	var ref = $rootScope.ref = new Firebase('https://canchat.firebaseio.com');
		$rootScope.auth = $firebaseAuth
		$rootScope.auth = new FirebaseSimpleLogin(ref, function(error, user){
			if (error) {
				// an error occurred while attempting login
				$rootScope.$emit("auth:error",[error]);
			} else if (user) {
				// user logged in
				$rootScope.$emit("auth:login",[user]);
	console.log("---------");
	console.log($rootScope.auth);
			} else {
				// user is logged out
				$rootScope.$emit("auth:logout",[]);
			}
		});*/
      this._route = $route;
      this._location = $location;
      this._rootScope = $rootScope;
      this._loginPath = path;
      this._redirectTo = null;
//	console.log("1:"+$rootScope.auth);
      this._authenticated = !!($rootScope.auth && $rootScope.auth.user);
      this._init();
   }

   RouteSecurityManager.prototype = {
      _init: function() {
         var self = this;
         this._checkCurrent();

         // Set up a handler for all future route changes, so we can check
         // if authentication is required.
         self._rootScope.$on("$routeChangeStart", function(e, next) {
            self._authRequiredRedirect(next, self._loginPath);
         });
		 // ADDED
         self._rootScope.$on("$stateChangeStart", function(e, toState, toParams, fromState, fromParams) {
//	console.log(toState);
            self._authRequiredRedirect(toState, self._loginPath);
         });

         self._rootScope.$on('$firebaseSimpleLogin:login', angular.bind(this, this._login));
         self._rootScope.$on('$firebaseSimpleLogin:logout', angular.bind(this, this._logout));
         self._rootScope.$on('$firebaseSimpleLogin:error', angular.bind(this, this._error));
      //   self._rootScope.$on('$firebaseAuth:login', angular.bind(this, this._login));
      //   self._rootScope.$on('$firebaseAuth:logout', angular.bind(this, this._logout));
      //   self._rootScope.$on('$firebaseAuth:error', angular.bind(this, this._error));
      },

      _checkCurrent: function() {
         // Check if the current page requires authentication.
         if (this._route.current) {
            this._authRequiredRedirect(this._route.current, this._loginPath);
         }
      },

      _login: function() {
//console.log("route security LOGGED IIN");
         this._authenticated = true;
         if( this._redirectTo ) {
//console.log("1");
            this._redirect(this._redirectTo);
            this._redirectTo = null;
         }
         else if( this._location.path() === this._loginPath ) {
//console.log("2");
            this._location.replace();
            this._location.path('/feed');
         }
      },

      _logout: function() {
//console.log("LOGOUT");
         this._authenticated = false;
         this._checkCurrent();
      },

      _error: function() {
         if( !this._rootScope.auth || !this._rootScope.auth.user ) {
            this._authenticated = false;
         }
         this._checkCurrent();
      },

      _redirect: function(path) {
         this._location.replace();
         this._location.path(path);
      },

      // A function to check whether the current path requires authentication,
      // and if so, whether a redirect to a login page is needed.
      _authRequiredRedirect: function(route, path) {
	//console.log(this._authenticated);
	//console.log(path);
         if (route.authRequired && !this._authenticated){
			this._redirect(path);
        //    if (route.pathTo === undefined) {
        //       this._redirectTo = this._location.path();
        //    } else {
        //       this._redirectTo = route.pathTo === path ? "/" : route.pathTo;
        //    }
	//console.log("going to: " + this._redirectTo);
         //   this._redirect(path);
         }
         else if( this._authenticated && this._location.path() === this._loginPath ) {
	//console.log("going to home");
            this._redirect('/');
         }
      }
   };
})(angular);