'use strict';
function SiteCtrl($scope, $http, appConfig) {
    function getRandomInt (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    var tag = document.createElement("img");
    var img_url;
    tag.onload = function() {
        setTimeout(function(){
            $scope.style = {
                "background-image": "url(" + img_url + ")",
                "opacity": 1
            };
            $scope.$digest();
        }, 500);
    };
    
    var domain = location.protocol === 'https:' ? "https://secure.flickr.com" : "http://api.flickr.com";
    
    // sets up a default background image if something breaks with Flickr
    var defaultImage = function() {
        img_url = tag.src = 'img/beetle-rock.jpg';
        $scope.image_title = "Beetle Rock Sunset #1, Sequoia National Park";
        $scope.img_profile = "//www.flickr.com/photos/flatworldsedge/7874109806/";
        $scope.img_username = "H Matthew Howarth";
        $scope.license = "Attribution-ShareAlike License";
        $scope.copyright = "http:\/\/creativecommons.org\/licenses\/by-sa\/2.0\/";
    };
    
    var photo_ids = [
    '510175383', // unripe strawberry
    '2685376029', // yellow "Fresh Flower" piece of architecture
    '5803011292', // cactus
    '3814815269', // Lombard St.
    '202917381', // Versailles
    '3438611399', // Beach
    '5912999510', // Mountains
    '6026030129', // Windmill's leg
    '6231476868', // Fish swimmin' around
    '537896598', // Cylindrical paper lamps
    '6159637428', // Boat sittin' around on a foggy, green lake
    '3958348428', // Pipe in a junkyard
    '101363489', // German subway
    '366959006', // Eiffel Tower ground-up shot
    '1171187321', // some river valley place
    '259669867', // fall leaves
    '8580742715', // blossoming tree branch
    '9270932324', // seagulls at the pier
    '2094464365', // dog running in from ocean
    '333248753', // frosty-looking field
    '3266055425', // cottage garden
    '6811476562', // snowy, New-England-looking suburb
    '994551622', // ocean cityscape
    '5484698286', // Lake Titicaca
    '9697199115', // Austrian mountains
    '10032796135', // Big horn sheep
    '3334136414', // Rabbit islands
    '10040023903' // Tahoe sunrise
    ];

    //var photo_ids = ['7608871682'];
    var imagecount = photo_ids.length;
    var num = getRandomInt(0,imagecount-1);
    var photo_id = photo_ids[num];
    $http.jsonp(domain + "/services/rest/?method=flickr.photos.getInfo&api_key="+appConfig.flickrKey+"&photo_id="+photo_id+"&format=json&jsoncallback=JSON_CALLBACK")
    .success(function(data){
        try {
            var photo = data.photo;
            var farm_id = photo.farm;
            var server_id = photo.server;
            var id = photo.id;
            var secret = photo.secret;
            img_url = "//farm"+ farm_id + ".staticflickr.com/" + server_id + "/" + id +"_" + secret + "_b.jpg";
            
            tag.src = img_url;
            
            $scope.image_title = photo['title']['_content'];
            $scope.img_profile = photo['urls']['url']['0']['_content'];
            
            var license_request = $http.jsonp(domain + "/services/rest/?method=flickr.photos.licenses.getInfo&api_key="+appConfig.flickrKey+"&format=json&jsoncallback=JSON_CALLBACK");
            
            license_request.success(function(data){
               data.licenses.license.forEach(function(license){
                   if(license.id === photo.license) {
                       $scope.license = license.name;
                       $scope.copyright = license.url;
                   }
               });
            });
            
            var owner = photo.owner;
            if(owner.hasOwnProperty('realname') && owner.realname !==''){
                    $scope.img_username = owner.realname;
                }
                else{
                    $scope.img_username = owner.username;
                };
        }catch(error){
            defaultImage();
            throw error;
        }
    }).error(defaultImage);

    
}
// always inject this in so we can later compress this JavaScript
SiteCtrl.$inject = ['$scope', '$http', 'appConfig'];
