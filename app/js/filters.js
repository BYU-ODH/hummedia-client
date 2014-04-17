'use strict';

/* Filters */

angular.module('hummedia.filters', [])
.filter('language', ['language', function (language) {
    return function(n){
        return language.nameFromCode(n)
    };
}])
// translates strings into the user's current locale
.filter('tr', function () {
    return function(n) {
	    return n;
    }
})
// enables ordering objects by keys that have colons
.filter('orderColon', function(){
    return function(items, field, reverse) {
      items.sort(function(a, b) {
        // localeCompare is sloooowwww, so don't use it.
        if(!reverse) {
          return (a[field] > b[field]) ? 1 : ((a[field] < b[field]) ? -1 : 0);
        }
        else
        {
          return (a[field] < b[field]) ? 1 : ((a[field] > b[field]) ? -1 : 0);
        }
      });
      return items;
    }
});
