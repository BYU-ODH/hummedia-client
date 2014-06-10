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

    // ignore these articles at the beginning of titles
    var ignore = /^(The|Der|Das|Die|Le|La|El|Il|Los|Las|Les|Gli|Le)(?:\s)/i;

    return function(items, field, reverse) {
      if(items === undefined) {
        return;
      }
      items.sort(function(item1, item2) {
        var a = item1[field].replace(ignore,'').toLowerCase(),
            b = item2[field].replace(ignore,'').toLowerCase();
        
        var aDigits = a.match(/\d+/),
            bDigits = b.match(/\d+/);

        // Performs a natural sort with numeric titles, if applicable
        if(aDigits && bDigits) {
          var lastA = aDigits[aDigits.length-1],
              lastB = bDigits[bDigits.length-1];

          var aIdx = a.lastIndexOf(lastA),
              bIdx = b.lastIndexOf(lastB);

          var aSansDigits = a.slice(0, aIdx) + a.slice(aIdx + lastA.length),
              bSansDigits = b.slice(0, bIdx) + b.slice(bIdx + lastB.length);

          if(aSansDigits === bSansDigits) {
            var intA = parseInt(lastA,10),
                intB = parseInt(lastB,10);

            return intA > intB ? 1 : intA < intB ? -1 : 0;
          }
        }

        // localeCompare is sloooowwww, so don't use it.
        if(!reverse) {
          return (a > b) ? 1 : ((a < b) ? -1 : 0);
        }
        else
        {
          return (a < b) ? 1 : ((a > b) ? -1 : 0);
        }
      });
      return items;
    }
});
