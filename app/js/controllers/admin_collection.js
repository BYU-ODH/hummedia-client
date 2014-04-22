'use strict';
function AdminCollectionCtrl($scope, Collection, Video, $routeParams, $location, Course, $http, user) {
    
    //Simple display logic
    
    $scope.user = user;

    $scope.toggleModal = function(modal_id){
        $('#blur-box').toggle();
        $(modal_id).toggle();
    }
    
    //Set variables
    $scope.collections = Collection.query();
    $scope.semesters = Course.getSemesterArray();
    $scope.course_departments = Course.getCourseDepartments();
    $scope.videos = [];
    $scope.selected_videos = {};
    $scope.selected_courses = {};
    
    var updateCollectionData = function(){
        $scope.collection_data = Collection.get({identifier:$routeParams.id}, function getCoursesAsReadableStrings(){
            $scope.collection_data.courses = Course.getReadableStringsFromArray($scope.collection_data['dc:relation']);
        });    
    };
    
    //Watch Functions
    
    //Watch the route params and keep $scope.collection_data updated
    $scope.$watch(function(){return $routeParams.id;}, function(){
        $scope.id = $routeParams.id;
        if($scope.id){
            updateCollectionData();
        }
    });
    
    $scope.$watch("selected_videos", function(){
        $scope.selected_videos_count = getCount($scope.selected_videos);
    },true);
    
    //Helper Functions
    
    var getCount = function(checkbox_object){
        var count = 0;
        for(var prop in checkbox_object){
            if(checkbox_object[prop]==true){
                count++;
            }
        }
        return count;
    };
    
    
    
    
    $scope.toggleCreateCollection = function(){
        $scope.createMode = true;
        $scope.collection_data = {};
        $location.search({'create':'true'});
    }
    
    $scope.inCreateOrEditMode = function(){
        if($scope.collection_data || $scope.createMode){
            return true;
        }else{
            return false;
        }
    }
    
    $scope.showCollection = function(pid){
        $location.search({'id':pid});
        $scope.createMode = false;
    };    
    
    $scope.annotate = function(pid, collection_pid) {
        $location.path('/video/annotate/' + pid).search({'collection': collection_pid});
    }

    $scope.deleteCollection = function(pid){
        // using bracket notation to enable minification with the word "delete" 
        Collection['delete']({"identifier":pid});
        $scope.collection_data = null;
        $scope.collections = $scope.collections.filter(function(a){return a.pid !== pid;});
        $location.search({});
    };
    
    var createCollection = function(){
        
        $scope.course_string = Course.courseFieldsToString($scope.course_department, $scope.course_number, $scope.section_number, $scope.collection_data.semester);

        
        var params = new Object();
            params['dc:title'] = $scope.collection_data['dc:title'];
            params['dc:description'] = $scope.collection_data['dc:description'];
            params['authorized'] = $scope.collection_data['authorized'];
            params['semester'] = $scope.collection_data['semester'];
        Collection.save(params, function(data){
            params['pid'] = data.pid;
            $scope.collections.push(params);
            $scope.showCollection(data.pid);
        });        
    };
    
    var updateCollection = function(){
        var pid = $scope.collection_data.pid;
        var newtitle = $('#collectioninfo_title').prop("value"),
            newdescription = $scope['collection_data']['dc:description'];
        var params = new Object();
            params['dc:title'] = newtitle;
            params['dc:description'] = newdescription;
            params['authorized'] = $scope.collection_data['authorized'];
            params['dc:creator'] = $scope.collection_data['dc:creator'];
            params['dc:rights'] = $scope.collection_data['dc:rights'];
        
        Collection.update({"identifier":pid}, params);
        for(var i=0; i<$scope.collections.length; i++) {
                if(pid===$scope.collections[i]['pid']){
                    $scope.collections[i]['dc:title'] = newtitle;
                    $scope.collections[i]['dc:description'] = newdescription;
                }
        }
        $scope['collection_data']['dc:title'] = newtitle;
    }
    
    $scope.saveChanges = function(){
        if($scope.collection_data.pid){
            updateCollection();
        }else{
            createCollection();
        }
    };
    $scope.addVideo = function(collectionid, videoid){
        var video_data=Video.get({identifier:videoid}, function(){
            var isMemberOfs = video_data['ma:isMemberOf'];
            var newcollection = {"@id": collectionid};
            isMemberOfs.push(newcollection);
            var params = new Object();
                params['ma:isMemberOf'] = isMemberOfs;            
            Video.update({"identifier":videoid}, params);
            //Update scope
            var vid_already_there=false;
            for (var i = 0; i < $scope.collection_data.videos.length; i++) {
                if($scope['collection_data']['videos'][i]['pid']===video_data.pid){
                    vid_already_there=true;
                };
            }
            if(vid_already_there===false){
                $scope['collection_data']['videos'].push(video_data);
            }
        });
    };
    $scope.deleteVideo = function(pid, collectionid){
        var video_data=Video.get({identifier:pid}, function(){
            var isMemberOfs = video_data['ma:isMemberOf'];
            var i;
            var newisMemberOfs = new Array();
            for(i=0; i<isMemberOfs.length; i++) {
                if(collectionid!==isMemberOfs[i]['@id']){
                    newisMemberOfs.push(isMemberOfs[i]);
                }
            }
            var params = new Object();
                params['ma:isMemberOf'] = newisMemberOfs;
            Video.update({"identifier":pid}, params);
            //Remove video from scope
            for (var i = 0; i < $scope.collection_data.videos.length; i++) {
                if($scope['collection_data']['videos'][i]['pid']===pid){
                    $scope['collection_data']['videos'].splice(i,1);
                };
            }
            
        });
    };
    
    $scope.getVideos = function(){
        $scope.videos =  Video.query();
    };

    $scope.addVideosToCollection = function(){
        $scope.videos_to_add=[];
        
        for(var i in $scope.selected_videos){
            if($scope.selected_videos[i]==true){
                $scope.videos_to_add.push(i);
            }
        }        
        var packet = [
            {"collection":
                {"id": $scope.collection_data['pid'],"title": $scope.collection_data['dc:title']},
             "videos": $scope.videos_to_add} //this is an array of pids
        ];        
        
        $http.post('/api/v2/batch/video/membership', packet).success(function(data){
        });
         
        $scope.selected_videos = {};
                
        updateCollectionData();
        
        $scope.toggleModal('#modal-add-video');
        
    };
    
    $scope.deleteCourses = function(){
        var confirmed = confirm('Are you sure you want to delete the selected courses?');
        if(confirmed){
            var courses_to_delete = [];
            
            for(var i in $scope.selected_courses){
                if(!$scope.selected_courses.hasOwnProperty(i)){
                    return;
                }else{
                    if($scope.selected_courses[i]==true){
                        courses_to_delete.push(i);
                    }
                }    
            }
            
            $scope.collection_data['dc:relation'] = $scope.collection_data['dc:relation'].filter(function(el){
                return (courses_to_delete.indexOf(el)<0);
            });
            
            //Update the api
            var params = new Object();
            params['dc:relation'] = $scope.collection_data['dc:relation'];
            Collection.update({"identifier":$scope.collection_data.pid}, params);
            
            //Update the scope
            $scope.collection_data.courses = Course.getReadableStringsFromArray($scope.collection_data['dc:relation']);
        }        
    };

    $scope.addCourse = function(){
        //Validate input
        if($scope.course_department==undefined){
            alert("Please select a department.");
            return;
        }
        if($scope.collection_data.semester==undefined){
            alert("Please select a term.")
            return;
        }
        //Create a course_string
        var course_string = Course.courseFieldsToString($scope.course_department, $scope.course_number, $scope.section_number, $scope.collection_data.semester);

        $scope.collection_data['dc:relation'].push(course_string);
        
        //Update the api
        var params = new Object();
            params['dc:relation'] = $scope.collection_data['dc:relation'];
        Collection.update({"identifier":$scope.collection_data.pid}, params);
        
        //Update the current scope
        var readable_string = Course.courseStringToReadableString(course_string);
        
        var course_object = {
            "readable_string" : readable_string,
            "string" : course_string
        };
        
        $scope.collection_data.courses.push(course_object);
        
        //Close out of the modal
        $scope.toggleModal('#modal-add-course');

    };
}
// always inject this in so we can later compress this JavaScript
AdminCollectionCtrl.$inject = ['$scope', 'Collection', 'Video', '$routeParams', '$location', 'Course', '$http', 'user'];
