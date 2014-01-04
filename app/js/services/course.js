/**
 * 
 */

HUMMEDIA_SERVICES.factory('Course', ['$q', '$http', 'appConfig', function($q, $http, appConfig) {
    //Semester Functions
    var getSemesterObject = function(month, year){
        var value;
        var name;
        
        if(month>=0 && month<=3){
            value = year*10+1;
            name = "Winter " + year;
        }else if(month>=4 && month<=5){
            value = year*10+3;
            name = "Spring " + year;
        }else if(month>=6 && month<=7){
            value = year*10+4;
            name = "Summer " + year;
        }else if(month>=8 && month<=11){
            value = year*10+5;
            name = "Fall " + year;
        }
        return {value: value, name: name};
    };
    
    var getNextTerm = function(semester){//Takes a semester object and returns a semester object for the next term
        var value;
        var name;
        
        //Turn the semester value valueo a string
        var i = semester.value + "";
        //Get the last digit of the semester value
        var term = i.substring(i.length-1);
        term = parseInt(term);
        //Get the first digits for the yar
        var year = (semester.value-term)/10;        
        
        var new_term = term+1;
        
        if(new_term==2){
            value = semester.value+2;
            name = "Spring " + year;
        }else if(new_term==4){
            value = semester.value+1;
            name = "Summer " + year;
        }else if(new_term==5){
            value = semester.value+1;
            name = "Fall " + year;
        }else if(new_term==6){
            value = (year+1)*10 + 1;
            name = "Winter " + (year+1);
        }
        return {value: value, name: name};
    };
    
    var getSemesterArray = function(){//returns an array of 4 semester objects starting from the current term
        var d = new Date();
        var year = d.getFullYear();
        var month = d.getMonth();
        
        var semesters = [];        
        var semester = getSemesterObject(month, year);
        
        for(var i=0; i<4; i++){
            semesters.push(semester);
            semester=getNextTerm(semester);
        }
        return semesters;
    };
    
    //Course Department Functions
    //lazily loads the department list from the server
    var getCourseDepartments = (function(){
        var departments = $q.defer(),
            checked = false;

        return function() {
            if(!checked) {
                checked = true;
                $http.get(appConfig.apiBase + 'courseDepartments').success(function(data) {
                    departments.resolve(data);   
                });
            }
            return departments.promise;
        }
    })();
    
    //Conversion functions
    
    var courseFieldsToString = function(course_department, course_number, section_number, semester){
        //Pad the section number with 0s
        section_number = ("000"+section_number).slice(-3);
        course_string = course_department + ' ' + course_number + ' ' + section_number + ' ' + semester;
        return course_string;
    };
    
    var termNumberToString = function(term){
        if(term==1 || term==2){
            return "Winter";
        }else if(term==3){
            return "Spring";
        }else if(term==4){
            return "Summer";
        }else if(term==5 || term==6){
            return "Fall";
        }
    };
    
    var courseStringToReadableString = function(course_string){
        
        var matches = course_string.match(/([a-zA-Z\ ]+?)\ +([0-9]{3}[A-Z]?)\ +([0-9]{3})\ +([0-9]{4})([0-9])/);
        if(matches){
            var department = matches[1];
            var course_number = matches[2];
            var section_number = matches[3];
            var year = matches[4];
            var term = matches[5];

            term = termNumberToString(term);

            return department+course_number+' - Section '+section_number+' - '+term+' '+year;
        }else{
            return '';
        }
    };
    
    var getReadableStringsFromArray = function(course_strings){
        if(course_strings==null){
            return [];
        }
        var readable_strings = [];
        for(var i=0; i<course_strings.length; i++){
            var readable_string = courseStringToReadableString(course_strings[i]);
            var course_object = {'string':course_strings[i],
                                 'readable_string':readable_string
            };
            readable_strings.push(course_object);
        }
        return readable_strings;
    };
    
    //Return Course object
    
    var Course = {getSemesterArray: getSemesterArray,
                  getCourseDepartments: getCourseDepartments,
                  courseFieldsToString: courseFieldsToString,
                  courseStringToReadableString: courseStringToReadableString,
                  getReadableStringsFromArray: getReadableStringsFromArray
    };
    
    Object.seal(Course);
    Object.freeze(Course);
    
    return Course;
}]);
