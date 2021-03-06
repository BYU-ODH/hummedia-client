/**
 * Populates a language multiple-selection menu.
 * 
 * @author Ian Hunter
 * @see selectLanguage and selectLanguageHelper
 * 
 * Attributes:
 *  lang-exists - whether or not we select our languages from languages that we have translations for
 *                do not include this attribute if you want a selection of all available languages
 *
 *  lang-callback - a scope-defined callback function to run once the elements have been added to the dom
 */
"use strict";
HUMMEDIA_DIRECTIVES.
    directive('selectLanguageMulti', ['selectLanguageHelper', function(SLH) {
        return {
            link: SLH.linkFn,
            scope: false,
            template: '<select multiple data-ng-options="lang.value as lang.label for lang in __languages"></select>',
            replace: true
        };
    }]);
