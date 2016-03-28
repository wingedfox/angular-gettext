/**
 * @ngdoc factory
 * @module gettext
 * @name gettextCatalog
 * @requires gettextPlurals
 * @requires gettextFallbackLanguage
 * @requires ng.service.$http
 * @requires ng.service.$cacheFactory
 * @requires ng.service.$interpolate
 * @requires ng.type.$rootScope.Scope
 * @description Provides set of method to translate stings
 * @example
 * This example shows translations behaviour with different settings.
  <example module="gettextExample" name="gettextExample">
    <file name="index.html">
      <div ng-controller="GettextController as gtx">
        <section class="left">
          <label>
            <span>Translation:</span>
            <select
              aria-label="current language"
              ng-model="gtx.options.currentLanguage"
              ng-change="gtx.options.setCurrentLanguage(gtx.options.currentLanguage)">
              <option ng-repeat="(k, lang) in gtx.options.strings" value="{{k}}">{{k}}</option>
            </select>
          </label>
          <label>
          <span>Debug mode:</span>
            <input type="checkbox"
              ng-model="gtx.options.debug"
              ng-change="gtx.update()"
              aria-label="debug mode"/></label>
          <label>
            <span>Debug prefix:</span>
            <input type="text"
              ng-model="gtx.options.debugPrefix"
              ng-change="gtx.update()"
              placeholder="non-translated string prefix"
              aria-label="debug prefix for untranslated strings" /></label>
          <label>
            <span>Show translated markers:</span>
            <input type="checkbox"
              ng-model="gtx.options.showTranslatedMarkers"
              ng-change="gtx.update()"
              aria-label="debug mode" /></label>
          <label>
            <span>Translated marker prefix:</span>
            <input type="text"
              ng-model="gtx.options.translatedMarkerPrefix"
              ng-change="gtx.update()"
              placeholder="translated string prefix"
              aria-label="translated strings prefix for debug mode" /></label>
          <label>
            <span>Translated marker suffix:</span>
            <input type="text"
              ng-model="gtx.options.translatedMarkerSuffix"
              ng-change="gtx.update()"
              placeholder="translated string suffix"
              aria-label="translated strings prefix for debug mode" /></label>
        </section>
        <section class="right">
          <label>
            <span>Your name:</span>
            <input type="text" ng-model="gtx.name" placeholder="enter your name" aria-label="your name"/></label>
          <label>
            <span>"Hello" string</span>
            <input type="text"
              ng-change="gtx.update()"
              ng-model="gtx.options.strings[gtx.options.currentLanguage]['Hi, \{\{gtx.name\}\}!'].$$noContext[0]" placeholder="{{'Hi, {{gtx.name}\}!'}}" aria-label="Hello string"/></label>
          <label>
            <span>"Bye" string</span>
            <input type="text"
              ng-change="gtx.update()"
              ng-model="gtx.options.strings[gtx.options.currentLanguage]['Bye, \{\{gtx.name\}\}!'].$$noContext[0]" placeholder="{{'Bye, {{gtx.name}\}!'}}" aria-label="Bye string"/></label>
        </section>
        <ul>
          <li class="translation">
            <span>Translation: {{gtx.options.currentLanguage}}</span>
            <ul>
              <li>
                <span translate>Hi, {{gtx.name}}!</span>
              </li>
              <li>
                <span translate>Bye, {{gtx.name}}!</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </file>
    <file name="script.js">
      angular.module('gettextExample', ['gettext']).controller('GettextController', function($scope, gettextCatalog) {
        gettextCatalog.debug = true;
        gettextCatalog.showTranslatedMarkers = true;
        gettextCatalog.translatedMarkerPrefix = '->';
        gettextCatalog.translatedMarkerSuffix = '<-';
        gettextCatalog.currentLanguage = 'nl';
        gettextCatalog.setStrings('en-US', {
          'Hi, {{gtx.name}}!': 'Hello, {{gtx.name}}!',
          'Bye, {{gtx.name}}!': '',
        });
        gettextCatalog.setStrings('es-ES', {
          'Hi, {{gtx.name}}!': '',
          'Bye, {{gtx.name}}!': '¡Adious, {{gtx.name}}!',
        })
        gettextCatalog.setStrings('nl', {
          'Hi, {{gtx.name}}!': 'Halo, {{gtx.name}}!',
          'Bye, {{gtx.name}}!': 'Doei, {{gtx.name}}!',
        });

        this.name = 'Ruben';
        this.options = gettextCatalog;

        this.update = function () {
          // a kind of hack, service settings are not tracked for real time changes
          $scope.$root.$broadcast('gettextLanguageChanged');
        }
      });
    </file>
    <file name="style.css">
      select,
      input[type=text] {
          width: 200px;
      }
      .translation {
        display: inline-block;
        list-style: none;
      }
      label {
        display: block;
      }
      label > span {
        display: inline-block;
        width: 250px;
      }
      section {
        display: inline-block;
        padding: 5px;
      }
      section.right > label > span {
        width: 120px;
      }
    </file>
    </example>
 */
angular.module('gettext').factory('gettextCatalog', function gettextCatalog (gettextPlurals, gettextFallbackLanguage, $http, $cacheFactory, $interpolate, $rootScope) {
    var catalog;
    var noContext = '$$noContext';

    // IE8 returns UPPER CASE tags, even though the source is lower case.
    // This can causes the (key) string in the DOM to have a different case to
    // the string in the `po` files.
    // IE9, IE10 and IE11 reorders the attributes of tags.
    var test = '<span id="test" title="test" class="tested">test</span>';
    var isHTMLModified = (angular.element('<span>' + test + '</span>').html() !== test);

    function prefixDebug (string) {
        if (catalog.debug && catalog.currentLanguage !== catalog.baseLanguage) {
            return catalog.debugPrefix + string;
        } else {
            return string;
        }
    };

    function addTranslatedMarkers (string) {
        if (catalog.showTranslatedMarkers) {
            return catalog.translatedMarkerPrefix + string + catalog.translatedMarkerSuffix;
        } else {
            return string;
        }
    };

    function broadcastUpdated() {
        /**
         * @ngdoc event
         * @name gettextCatalog#gettextLanguageChanged
         * @eventType broadcast on $rootScope
         * @description Fires language change notification without any additional parameters.
         */
        $rootScope.$broadcast('gettextLanguageChanged');
    }

    catalog = {
        /**
         * @ngdoc property
         * @name gettextCatalog#debug
         * @public
         * @type {Boolean} false
         * @see gettextCatalog#debug
         * @description Whether or not to prefix untranslated strings with `[MISSING]:` or a custom prefix.
         */
        debug: false,
        /**
         * @ngdoc property
         * @name gettextCatalog#debugPrefix
         * @public
         * @type {String} [MISSING]:
         * @description Custom prefix for untranslated strings when {@link gettextCatalog#debug gettextCatalog#debug} set to `true`.
         */
        debugPrefix: '[MISSING]: ',
        /**
         * @ngdoc property
         * @name gettextCatalog#showTranslatedMarkers
         * @public
         * @type {Boolean} false
         * @description Whether or not to wrap all processed text with markers.
         *
         * Example output: `[Welcome]`
         */
        showTranslatedMarkers: false,
        /**
         * @ngdoc property
         * @name gettextCatalog#translatedMarkerPrefix
         * @public
         * @type {String} [
         * @description Custom prefix to mark strings that have been run through {@link module:gettext angular-gettext}.
         */
        translatedMarkerPrefix: '[',
        /**
         * @ngdoc property
         * @name gettextCatalog#translatedMarkerSuffix
         * @public
         * @type {String} ]
         * @description Custom suffix to mark strings that have been run through {@link module:gettext angular-gettext}.
         */
        translatedMarkerSuffix: ']',
        /**
         * @ngdoc property
         * @name gettextCatalog#strings
         * @private
         * @type {Object}
         * @description An object of loaded translation strings. Shouldn't be used directly.
         */
        strings: {},
        /**
         * @ngdoc property
         * @name gettextCatalog#baseLanguage
         * @protected
         * @deprecated
         * @since 2.0
         * @type {String} en
         * @description The default language, in which you're application is written.
         *
         * This defaults to English and it's generally a bad idea to use anything else:
         * if your language has different pluralization rules you'll end up with incorrect translations.
         */
        baseLanguage: 'en',
        /**
         * @ngdoc property
         * @name gettextCatalog#currentLanguage
         * @public
         * @type {String}
         * @description Active language.
         */
        currentLanguage: 'en',
        /**
         * @ngdoc property
         * @name gettextCatalog#cache
         * @public
         * @type {String} en
         * @description Language cache for lazy load
         */
        cache: $cacheFactory('strings'),

        /**
         * @ngdoc method
         * @name gettextCatalog#setCurrentLanguage
         * @public
         * @param {String} lang language name
         * @description Sets the current language and makes sure that all translations get updated correctly.
         */
        setCurrentLanguage: function (lang) {
            this.currentLanguage = lang;
            broadcastUpdated();
        },

        /**
         * @ngdoc method
         * @name gettextCatalog#getCurrentLanguage
         * @public
         * @returns {String} current language
         * @description Returns the current language.
         */
        getCurrentLanguage: function () {
            return this.currentLanguage;
        },

        /**
         * @ngdoc method
         * @name gettextCatalog#setStrings
         * @public
         * @param {String} language language name
         * @param {Object.<String>} strings set of strings where the key is the translation `key` and `value` is the translated text
         * @description Processes an object of string definitions. {@link docs:manual-setstrings More details here}.
         */
        setStrings: function (language, strings) {
            if (!this.strings[language]) {
                this.strings[language] = {};
            }

            for (var key in strings) {
                var val = strings[key];

                if (isHTMLModified) {
                    // Use the DOM engine to render any HTML in the key (#131).
                    key = angular.element('<span>' + key + '</span>').html();
                }

                if (angular.isString(val) || angular.isArray(val)) {
                    // No context, wrap it in $$noContext.
                    var obj = {};
                    obj[noContext] = val;
                    val = obj;
                }

                // Expand single strings for each context.
                for (var context in val) {
                    var str = val[context];
                    val[context] = angular.isArray(str) ? str : [str];
                }
                this.strings[language][key] = val;
            }

            broadcastUpdated();
        },

        /**
         * @ngdoc method
         * @name gettextCatalog#getStringFormFor
         * @protected
         * @param {String} language language name
         * @param {String} string translation key
         * @param {Number=} n number to build sting form for
         * @param {String=} context translation key context, e.g. {@link docs:context Verb, Noun}
         * @returns {String|Null} translated or annotated string or null if language is not set
         * @description Translate a string with the given language, count and context.
         */
        getStringFormFor: function (language, string, n, context) {
            if (!language) {
                return null;
            }
            var stringTable = this.strings[language] || {};
            var contexts = stringTable[string] || {};
            var plurals = contexts[context || noContext] || [];
            return plurals[gettextPlurals(language, n)];
        },

        /**
         * @ngdoc method
         * @name gettextCatalog#getString
         * @public
         * @param {String} string translation key
         * @param {ng.type.$rootScope.Scope=} scope scope to do interpolation against
         * @param {String=} context translation key context, e.g. {@link docs:context Verb, Noun}
         * @returns {String} translated or annotated string
         * @description Translate a string with the given scope and context.
         *
         * First it tries {@link gettextCatalog#currentLanguage gettextCatalog#currentLanguage} (e.g. `en-US`) then {@link gettextFallbackLanguage fallback} (e.g. `en`).
         *
         * When `scope` is supplied it uses Angular.JS interpolation, so something like this will do what you expect:
         * ```js
         * var hello = gettextCatalog.getString("Hello {{name}}!", { name: "Ruben" });
         * // var hello will be "Hallo Ruben!" in Dutch.
         * ```
         * Avoid using scopes - this skips interpolation and is a lot faster.
         */
        getString: function (string, scope, context) {
            var fallbackLanguage = gettextFallbackLanguage(this.currentLanguage);
            string = this.getStringFormFor(this.currentLanguage, string, 1, context) ||
                     this.getStringFormFor(fallbackLanguage, string, 1, context) ||
                     prefixDebug(string);
            string = scope ? $interpolate(string)(scope) : string;
            return addTranslatedMarkers(string);
        },

        /**
         * @ngdoc method
         * @name gettextCatalog#getPlural
         * @public
         * @param {Number} n number to build sting form for
         * @param {String} string translation key
         * @param {String} stringPlural plural translation key
         * @param {ng.type.$rootScope.Scope=} scope scope to do interpolation against
         * @param {String=} context translation key context, e.g. {@link docs:context Verb, Noun}
         * @returns {String} translated or annotated string
         * @see {@link gettextCatalog#getString gettextCatalog#getString} for details
         * @description Translate a plural string with the given context.
         */
        getPlural: function (n, string, stringPlural, scope, context) {
            var fallbackLanguage = gettextFallbackLanguage(this.currentLanguage);
            string = this.getStringFormFor(this.currentLanguage, string, n, context) ||
                     this.getStringFormFor(fallbackLanguage, string, n, context) ||
                     prefixDebug(n === 1 ? string : stringPlural);
            if (scope) {
                scope.$count = n;
                string = $interpolate(string)(scope);
            }
            return addTranslatedMarkers(string);
        },

        /**
         * @ngdoc method
         * @name gettextCatalog#loadRemote
         * @public
         * @param {String} url location of the translations
         * @description Load a set of translation strings from a given URL.
         *
         * This should be a JSON catalog generated with [angular-gettext-tools](https://github.com/rubenv/angular-gettext-tools).
         * {@link docs:lazy-loading More details here}.
         */
        loadRemote: function (url) {
            return $http({
                method: 'GET',
                url: url,
                cache: catalog.cache
            }).then(function (response) {
                var data = response.data;
                for (var lang in data) {
                    catalog.setStrings(lang, data[lang]);
                }
                return response;
            });
        }
    };

    return catalog;
});
