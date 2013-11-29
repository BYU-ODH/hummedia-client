/**
 * This is for use with the vagrant bootstrap
 */
db.assets.find().forEach(function(a){ if(a["@graph"]["ma:locator"][0]["@id"]){ print(a["@graph"]["ma:locator"][0]["@id"])}})
