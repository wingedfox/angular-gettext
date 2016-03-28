/**
 * @ngdoc module
 * @name gettext
 * @module gettext
 * @packageName angular-gettext
 * @description Super simple Gettext for Angular.JS
 *
 * A sample application can be found at https://github.com/rubenv/angular-gettext-example.
 * This is an adaptation of the [TodoMVC](http://todomvc.com/) example. You can use this as a guideline while adding {@link module:gettext angular-gettext} to your own application.
 */
/**
 * @ngdoc factory
 * @module gettext
 * @name gettextPlurals
 * @param {String} [langCode=en] language code
 * @param {Number} [n=0] number to calculate form for
 * @returns {Number} plural form number
 * @description Provides correct plural form id for the given language
 *
 * Example
 * ```js
 * gettextPlurals('ru', 10); // 1
 * gettextPlurals('en', 1);  // 0
 * gettextPlurals();         // 1
 * ```
 */
angular.module('gettext', [])
/**
 * @ngdoc function
 * @module gettext
 * @name gettext
 * @param {String} str annotation key
 * @description Gettext constant function for annotating strings.
 *
 * This function does nothing but it is used by [angular-gettext-tools](https://github.com/rubenv/angular-gettext-tools) for building of a list of strings {@link guide:annotate annotated} in JavaScript code.
 *
 * ```js
 * angular.module('myApp', ['gettext']).config(function(gettext) {
 *   /// MyApp document title
 *   gettext('my-app.title');
 *   ...
 * })
 * ```
 */
.constant('gettext', function gettext(str) {
    /*
     * Does nothing, simply returns the input string.
     *
     * This function serves as a marker for `grunt-angular-gettext` to know that
     * this string should be extracted for translations.
     */
    return str;
});
