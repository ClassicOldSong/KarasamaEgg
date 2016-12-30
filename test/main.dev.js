(function () {
'use strict';

function __$styleInject(css, returnValue) {
  if (typeof document === 'undefined') {
    return returnValue;
  }
  css = css || '';
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
  return returnValue;
}
var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var loglevel = createCommonjsModule(function (module) {
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(definition);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.log = definition();
    }
}(commonjsGlobal, function () {
    "use strict";
    var noop = function() {};
    var undefinedType = "undefined";

    function realMethod(methodName) {
        if (typeof console === undefinedType) {
            return false; // We can't build a real method without a console to log to
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // these private functions always need `this` to be set properly

    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    function replaceLoggingMethods(level, loggerName) {
        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this[methodName] = (i < level) ?
                noop :
                this.methodFactory(methodName, level, loggerName);
        }
    }

    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public API
       *
       */

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Package-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    return defaultLogger;
}));
});

var appName = '[' + "K-Egg" + ']';
var log = console.log.bind(null, appName);
var trace = loglevel.trace.bind(null, appName);
var debug = loglevel.debug.bind(null, appName);
var info = loglevel.info.bind(null, appName);
var warn = loglevel.warn.bind(null, appName);
var error = loglevel.error.bind(null, appName);

{
	loglevel.setLevel('trace');
}

info('Debug logging enabled!');

var content = "<canvas class=\"egg\"></canvas>\n";

var img = new Image();img.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTkyMCIKICAgaGVpZ2h0PSIxMDgwIgogICB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIgogICBpZD0ic3ZnMiIKICAgdmVyc2lvbj0iMS4xIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkxIHIxMzcyNSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZWdnLWJnLnN2ZyIKICAgaW5rc2NhcGU6ZXhwb3J0LWZpbGVuYW1lPSIvbWVkaWEveXVraW5vL0RvY3VtZW50cy9Xb3Jrcy9QYWludHMvV2FsbHBhcGVycy9LYXJhc2FtYUVnZy5wbmUiCiAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSI5MCIKICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjkwIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzNCIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjNGY1MTc4IgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjAuMzUzNTUzMzkiCiAgICAgaW5rc2NhcGU6Y3g9IjQzNy40MzQyOSIKICAgICBpbmtzY2FwZTpjeT0iMzMzLjA1NTY1IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIHVuaXRzPSJweCIKICAgICBib3JkZXJsYXllcj0iZmFsc2UiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9InRydWUiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwNTIiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjU5NSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIHNob3dndWlkZXM9InRydWUiCiAgICAgaW5rc2NhcGU6Z3VpZGUtYmJveD0idHJ1ZSI+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSI5NjAsMTE3Ni41IgogICAgICAgb3JpZW50YXRpb249IjEsMCIKICAgICAgIGlkPSJndWlkZTQxNTAiIC8+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSItMTI1NS4xODc1LDU0MCIKICAgICAgIG9yaWVudGF0aW9uPSIwLDEiCiAgICAgICBpZD0iZ3VpZGU0MTUyIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTciPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaW5rc2NhcGU6bGFiZWw9IkxheWVyIDEiCiAgICAgaW5rc2NhcGU6Z3JvdXBtb2RlPSJsYXllciIKICAgICBpZD0ibGF5ZXIxIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjcuNjM3ODA4KSI+CiAgICA8ZwogICAgICAgaWQ9Imc1NTE2IgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC45MTQ4NDY3MywwLDAsMC45MTQ4NDY3Myw5NC40Mjg4Myw5MS4xMDY1NjQpIj4KICAgICAgPHBhdGgKICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjc3NjY3Nzc3Nzc3NjYyIKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgZD0ibSAxMzI5LjkxMTcsNjQwLjYxOTczIGMgNjAuODY2Miw0OC4zMTAzMSA0OS45OTU3LDExNi4wMTA1NyAtMS4wNjE0LDE0MC42NTg4MiAtNy4yNSwzLjUgLTQ3LjQ3NTIsMTguNjcxMDUgLTk1Ljk1NjIsOC4xOTc3MSAtMzcuNjQ0OCwtOC4xMzI0MSAtNDAuNTUzMiwtMTMuNzY1NzcgLTcxLjk4MTUsLTE0LjYwMTc2IC05LjY2MTUsMC4wOTY2IC0xNy4xODU4LDEuMTA4NiAtMjUuNTMyNywzLjk1MTUgLTQ4Ljk3NzMsMTUuOTgxMzQgLTEzNS4xNTcsMzguNzg0OTYgLTE4OS4wMDc1OCwzOC43ODQ5NiAtMTEwLjEzMDgyLDAgLTIyMC4xMjMzLC0zNS4zMjA3NSAtMjk3Ljk5NzU1LC05OC4xOTIwOSAtNzcuODc0MjUsLTYyLjg3MTM1IC0xMjEuNjIzNTUsLTE0OC4xNDMxOSAtMTIxLjYyMzU1LC0yMzcuMDU2NjkgMCwtODguOTEzNSA0My43NDkzLC0xNzQuMTg1MzQgMTIxLjYyMzU1LC0yMzcuMDU2NjggNzcuODc0MjYsLTYyLjg3MTM1IDE4Ny44NjY3MywtOTguMTkyMSAyOTcuOTk3NTUsLTk4LjE5MjEgMTEwLjEzMDc4LDAgMjExLjM3ODY4LDM1LjMyMDc1IDI4OS4yNTI4OCw5OC4xOTIwOSA3Ny44NzQzLDYyLjg3MTM0IDEyMS42MjM2LDE0OC4xNDMxOCAxMjEuNjIzNiwyMzcuMDU2NjkgMCw1Mi40MzA5IC00LjYyNzEsNjkuODA2OTIgLTMzLjA3OTMsMTE1Ljg1ODcxIC05LjQ0OTcsMTguMTE1MjcgLTcuMjI0LDMyLjAwOTc1IDUuNzQyMiw0Mi4zOTg4NCB6IgogICAgICAgICBzdHlsZT0iZmlsbDojZjVkOGMwO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojNGU0YzYxO3N0cm9rZS13aWR0aDozO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIgogICAgICAgICBpZD0icGF0aDQ1MjAtNSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjc3NzY3Nzc3Nzc3NjYyIKICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgZD0ibSAxMzI3Ljk1NTUsNjQxLjA0MDA1IGMgNTQuNDg1MSw0Mi40NzIxOCA1MC4yNDI4LDk3LjY4MzM0IC0xLjYzNTUsMTIxLjIzODUxIC03LjI5ODcsMy4zMTM5MyAtNDcuMjIyMiwxNi40ODQ4OSAtOTUuNDQ1LDYuMDExNTUgLTM3LjQ0NDIsLTguMTMyNDEgLTUxLjcwMiwtMTguNDE1NzMgLTc1LjMwMDcsLTE2Ljg5MTQgLTUuMTQ4NiwwLjMzMjU3IC0xMC41MDk3LDAuNzIyMTMgLTEzLjk0MywyLjAyODkgLTQ4LjcxNjQsMTUuOTgxMzQgLTE0Mi4xNjQ2OCw0Mi45OTcyIC0xOTUuNzI4NDMsNDIuOTk3MiAtMTA5LjU0NDEzLDAgLTIyNS45NTI3NywtNDUuMjEyNTUgLTI5Ni40MzMzNCwtOTYuMDA1OTMgQyA1NzUuNjY2MSw2NDcuMjMwODEgNTI4LjQ5Mzg5LDU0Mi41MTgxMiA1MjguNDkzODksNDgzLjM2MjE5IGMgMCwtODguOTEzNSA0My41MTYyNCwtMTc0LjE4NTM0IDEyMC45NzU2NCwtMjM3LjA1NjY3IDc3LjQ1OTQsLTYyLjg3MTM1IDE4Ni44ODkyMSwtOTguMTkyMSAyOTYuNDMzMzQsLTk4LjE5MjEgMTA5LjU0NDEzLDAgMjEwLjIyOTMzLDM1LjMyMDc1IDI4Ny42ODg3Myw5OC4xOTIwOSA3Ny40NTk0LDYyLjg3MTMzIDEyMC45NzU3LDE0OC4xNDMxNyAxMjAuOTc1NywyMzcuMDU2NjggMCw1Mi40MzA5IC0xMC42MTQ0LDUzLjYzMjcgLTM4LjkxNSw5OS42ODQ0OSAtMTAuOTc0MiwyNC42MDg5MSAtOC44MjI4LDM4LjUzODUyIDEyLjMwMzIsNTcuOTkzMzcgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6I2YzZjFlNTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgaWQ9InBhdGg0NTIwLTUtMyIgLz4KICAgIDwvZz4KICAgIDxnCiAgICAgICBpZD0iZzU1MTIiCiAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjkxNDg0NjczLDAsMCwwLjkxNDg0NjczLDg4LjU5OTEzLDc5Ljc4Nzc5MSkiPgogICAgICA8ZWxsaXBzZQogICAgICAgICByeT0iNDguNDE4OTIyIgogICAgICAgICByeD0iNTIuNjYxNTY0IgogICAgICAgICBjeT0iODA4LjMwNjI3IgogICAgICAgICBjeD0iMTQyOS4wNTkyIgogICAgICAgICBpZD0icGF0aDQ1MjAiCiAgICAgICAgIHN0eWxlPSJmaWxsOiNmNWQ4YzA7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjM7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0ic3Nzc3MiCiAgICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICAgIGlkPSJwYXRoNDUyMC01NiIKICAgICAgICAgZD0ibSAxNDc5LjMwOCw4MDYuOTc2MzYgYyAwLDI1LjI1MTEzIC0yMi40ODkyLDMxLjQzNDI0IC01MC4yMzA5LDMxLjQzNDIyIC0yNy43NDE3LDJlLTUgLTUwLjIzMDksLTYuMTgzMDkgLTUwLjIzMDksLTMxLjQzNDIyIDAsLTI1LjI1MTEyIDIyLjQ4OTIsLTQ1LjcyMTIgNTAuMjMwOSwtNDUuNzIxMTggMjcuNzQxNywtMmUtNSA1MC4yMzA5LDIwLjQ3MDA2IDUwLjIzMDksNDUuNzIxMTggeiIKICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOiNmM2YxZTU7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjA7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K';

var img$1 = new Image();img$1.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTkyMCIKICAgaGVpZ2h0PSIxMDgwIgogICB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIgogICBpZD0ic3ZnMiIKICAgdmVyc2lvbj0iMS4xIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjkxIHIxMzcyNSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iZWdnLWNvcmUuc3ZnIgogICBpbmtzY2FwZTpleHBvcnQtZmlsZW5hbWU9Ii9tZWRpYS95dWtpbm8vRG9jdW1lbnRzL1dvcmtzL1BhaW50cy9XYWxscGFwZXJzL0thcmFzYW1hRWdnLnBuZSIKICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjkwIgogICBpbmtzY2FwZTpleHBvcnQteWRwaT0iOTAiPgogIDxkZWZzCiAgICAgaWQ9ImRlZnM0Ij4KICAgIDxmaWx0ZXIKICAgICAgIGlua3NjYXBlOmNvbGxlY3Q9ImFsd2F5cyIKICAgICAgIHN0eWxlPSJjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM6c1JHQiIKICAgICAgIGlkPSJmaWx0ZXI1NDYzIgogICAgICAgeD0iLTAuMTgwMTI3NiIKICAgICAgIHdpZHRoPSIxLjM2MDI1NTIiCiAgICAgICB5PSItMC4xODAxMjc2IgogICAgICAgaGVpZ2h0PSIxLjM2MDI1NTIiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIKICAgICAgICAgaW5rc2NhcGU6Y29sbGVjdD0iYWx3YXlzIgogICAgICAgICBzdGREZXZpYXRpb249IjE4LjQxNzI4NSIKICAgICAgICAgaWQ9ImZlR2F1c3NpYW5CbHVyNTQ2NSIgLz4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjNGY1MTc4IgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCIKICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnpvb209IjAuMzUzNTUzMzkiCiAgICAgaW5rc2NhcGU6Y3g9IjQzNy40MzQyOSIKICAgICBpbmtzY2FwZTpjeT0iMzMzLjA1NTY1IgogICAgIGlua3NjYXBlOmRvY3VtZW50LXVuaXRzPSJweCIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJsYXllcjEiCiAgICAgc2hvd2dyaWQ9ImZhbHNlIgogICAgIHVuaXRzPSJweCIKICAgICBib3JkZXJsYXllcj0iZmFsc2UiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9InRydWUiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxOTIwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEwNTIiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjU5NSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIHNob3dndWlkZXM9InRydWUiCiAgICAgaW5rc2NhcGU6Z3VpZGUtYmJveD0idHJ1ZSI+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSI5NjAsMTE3Ni41IgogICAgICAgb3JpZW50YXRpb249IjEsMCIKICAgICAgIGlkPSJndWlkZTQxNTAiIC8+CiAgICA8c29kaXBvZGk6Z3VpZGUKICAgICAgIHBvc2l0aW9uPSItMTI1NS4xODc1LDU0MCIKICAgICAgIG9yaWVudGF0aW9uPSIwLDEiCiAgICAgICBpZD0iZ3VpZGU0MTUyIiAvPgogIDwvc29kaXBvZGk6bmFtZWR2aWV3PgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTciPgogICAgPHJkZjpSREY+CiAgICAgIDxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj4KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4KICAgICAgICA8ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+CiAgICAgICAgPGRjOnRpdGxlPjwvZGM6dGl0bGU+CiAgICAgIDwvY2M6V29yaz4KICAgIDwvcmRmOlJERj4KICA8L21ldGFkYXRhPgogIDxnCiAgICAgaW5rc2NhcGU6bGFiZWw9IkxheWVyIDEiCiAgICAgaW5rc2NhcGU6Z3JvdXBtb2RlPSJsYXllciIKICAgICBpZD0ibGF5ZXIxIgogICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjcuNjM3ODA4KSI+CiAgICA8ZwogICAgICAgaWQ9Imc1NDk2IgogICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC45MTQ4NDY3MywwLDAsMC45MTQ4NDY3Myw4Ny42ODQyOSw1OS40ODE1MDkpIgogICAgICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9IjkwIgogICAgICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9IjkwIj4KICAgICAgPGcKICAgICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIyLDgpIgogICAgICAgICBpZD0iZzUyMTAiPgogICAgICAgIDxjaXJjbGUKICAgICAgICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6I2ZmYjQzZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgICBpZD0icGF0aDQ1ODMiCiAgICAgICAgICAgY3g9Ijk3NSIKICAgICAgICAgICBjeT0iNDcxLjM2MjE4IgogICAgICAgICAgIHI9IjE2MyIgLz4KICAgICAgICA8cGF0aAogICAgICAgICAgIHNvZGlwb2RpOm5vZGV0eXBlcz0ic3Nzc3MiCiAgICAgICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgICAgICBpZD0icGF0aDQ1ODMtMiIKICAgICAgICAgICBkPSJtIDExMzgsNDcxLjM2MjE4IGMgMCw5MC4wMjI0MSAtNzIuOTc3NiwxMzcgLTE2MywxMzcgLTkwLjAyMjQxLDAgLTE2MywtNDYuOTc3NTkgLTE2MywtMTM3IDAsLTkwLjAyMjQxIDcyLjk3NzU5LC0xNjMgMTYzLC0xNjMgOTAuMDIyNCwwIDE2Myw3Mi45Nzc1OSAxNjMsMTYzIHoiCiAgICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOiNmMWQ2NjE7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjA7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICAgIDwvZz4KICAgICAgPGcKICAgICAgICAgaWQ9Imc1NDkwIj4KICAgICAgICA8Y2lyY2xlCiAgICAgICAgICAgcj0iMTIyLjY5NDkyIgogICAgICAgICAgIGN5PSI0NjYuMTcwNjUiCiAgICAgICAgICAgY3g9Ijk3NS4xMDAyOCIKICAgICAgICAgICBpZD0icGF0aDQ1ODMtMCIKICAgICAgICAgICBzdHlsZT0ib3BhY2l0eTowLjU0MDAwMDA1O2ZpbGw6I2ZmYjQzZjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MTtmaWx0ZXI6dXJsKCNmaWx0ZXI1NDYzKSIKICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgxLjI3MTIwNzgsMCwwLDEuMTc4OTk3OCwtMjg2LjQ1NDg0LC03NS40NDM1MDUpIiAvPgogICAgICAgIDxnCiAgICAgICAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC45NjI4MTkxMSwtMC4yNzAxNDY5NCwwLjI3MDE0Njk0LDAuOTYyODE5MTEsMzIyLjU4MzcyLC04Ljg1MDk5ODkpIgogICAgICAgICAgIGlkPSJnNTIxMC05IgogICAgICAgICAgIGlua3NjYXBlOnRyYW5zZm9ybS1jZW50ZXIteD0iOS41NzUzNTk4IgogICAgICAgICAgIGlua3NjYXBlOnRyYW5zZm9ybS1jZW50ZXIteT0iLTEwOS4wMjMxNiI+CiAgICAgICAgICA8cGF0aAogICAgICAgICAgICAgc3R5bGU9Im9wYWNpdHk6MTtmaWxsOiNmNWUzOTM7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOiM0ZTRjNjE7c3Ryb2tlLXdpZHRoOjA7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICAgICAgICBkPSJtIDU2Ni41MDAxNCw1MzcuMTMxNTUgYyAwLDI0LjMwNjA1IC00MC4yNTkzMSw4Ljk5IC04OS45MjE2Nyw4Ljk5IC00OS42NjIzNywwIC04OS45MjE2NywxNS4zMTYwNSAtODkuOTIxNjcsLTguOTkgMCwtMjQuMzA2MDYgNDAuMjU5MywtNDQuMDEgODkuOTIxNjcsLTQ0LjAxIDQ5LjY2MjM2LDAgODkuOTIxNjcsMTkuNzAzOTQgODkuOTIxNjcsNDQuMDEgeiIKICAgICAgICAgICAgIGlkPSJwYXRoNDU4My0yLTYiCiAgICAgICAgICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIgogICAgICAgICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJzc3NzcyIgLz4KICAgICAgICAgIDxlbGxpcHNlCiAgICAgICAgICAgICBzdHlsZT0ib3BhY2l0eToxO2ZpbGw6I2Y1ZTM5MztmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6IzRlNGM2MTtzdHJva2Utd2lkdGg6MDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIKICAgICAgICAgICAgIGlkPSJwYXRoNTQ4OCIKICAgICAgICAgICAgIGN4PSI3OTMuMTk4NzkiCiAgICAgICAgICAgICBjeT0iMTU1LjY5NjIzIgogICAgICAgICAgICAgcng9IjEzLjUwMDAwMiIKICAgICAgICAgICAgIHJ5PSIxMi4yNTAwMDIiCiAgICAgICAgICAgICB0cmFuc2Zvcm09Im1hdHJpeCgwLjg0MzY4Nzc1LDAuNTM2ODM0MjIsLTAuNTM2ODM0MjIsMC44NDM2ODc3NSwwLDApIiAvPgogICAgICAgIDwvZz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==';

__$styleInject("html, body {\n\theight: 100%;\n\twidth: 100%;\n\toverflow: hidden;\n\tbackground-color: #4f5178;\n}\n\n.egg {\n\theight: 100%;\n\twidth: 100%;\n\tposition: absolute;\n\tleft: 0;\n\ttop: 0;\n\tbackground-position: center;\n\tbackground-size: contain;\n\tbackground-repeat: no-repeat;\n}\n", undefined);

var props = {
	fps: 0,
	tg: 0
};

var $ = function $(selector) {
	return document.querySelector(selector);
};

window.wallpaperPropertyListener = {
	applyGeneralProperties: function applyGeneralProperties(up) {
		if (up.fps) {
			props.fps = up.fps;
			props.tg = 1000 / up.fps;
			info('FPS limitation updated, current FPS limitation is', props.fps, 'timegap is', props.tg);
		}
	}
};

var init = function init() {
	document.removeEventListener('DOMContentLoaded', init, false);

	$('body').insertAdjacentHTML('afterbegin', content);
	var pr = window.devicePixelRatio || 1,
	    c = $('.egg'),
	    wW = window.innerWidth,
	    wH = window.innerHeight;
	var bL = 0,
	    bT = 0,
	    bS = 1;
	c.width = wW * pr;
	c.height = wH * pr;
	if (wW / wH > img.width / img.height) {
		bS = wH / img.height;
		bL = (wW - bS * img.width) / 2;
	} else {
		bS = wW / img.width;
		bT = (wH - bS * img.height) / 2;
	}

	var iW = img.width * bS,
	    iH = img.height * bS;

	var pan = c.getContext('2d');
	pan.scale(pr, pr);

	pan.drawImage(img, bL, bT, iW, iH);
	pan.drawImage(img$1, bL, bT, iW, iH);

	var sp = 0.2;

	var mouseX = window.innerWidth / 2,
	    mouseY = window.innerHeight / 2,
	    fpsThreshold = 0,
	    last = 0,
	    diffX = 0,
	    diffY = 0,
	    wX = 0,
	    wY = 0,
	    yX = 0,
	    yY = 0,
	    wS = 1,
	    yS = 1;

	var update = function update() {
		var wdW = iW * wS,
		    wdH = iH * wS,
		    ydW = iW * yS,
		    ydH = iH * yS,
		    wpL = (wdW - iW) / 2,
		    wpT = (wdH - iH) / 2,
		    ypL = (ydW - iW) / 2,
		    ypT = (ydH - iH) / 2;
		pan.clearRect(0, 0, c.width, c.height);
		pan.drawImage(img, bL + wX - wpL, bT + wY - wpT, wdW, wdH);
		pan.drawImage(img$1, bL + yX - ypL, bT + yY - ypT, ydW, ydH);
	};

	var pause = function pause() {
		fpsThreshold = 0;
		last = 0;
		diffX = 0;
		diffY = 0;
		wX = 0;
		wY = 0;
		yX = 0;
		yY = 0;
		wS = 1;
		yS = 1;
		update();
		info('Animation paused.');
	};

	var tick = function tick() {
		var moveX = diffX / 30,
		    moveY = diffY / 30,
		    now = performance.now(),
		    dt = now - last;
		last = now;
		diffX -= moveX;
		diffY -= moveY;
		wX += (moveX - wX / 40) / 2;
		wY += (moveY - wY / 40) / 2;
		yX += (moveX - yX / 30) / 1.5 + (wX - yX) / 30;
		yY += (moveY - yY / 30) / 1.5 + (wY - yY) / 30;

		if (Math.abs(wX) + Math.abs(wY) + Math.abs(yX) + Math.abs(yY) < sp && wS + yS === 2) return pause();
		window.requestAnimationFrame(tick);

		if (props.fps > 0) {
			fpsThreshold += dt;
			if (fpsThreshold > props.tg) fpsThreshold = props.tg;
			if (fpsThreshold < props.tg) return;
			fpsThreshold -= props.tg;
		}

		update();
	};

	var start = function start() {
		if (last !== 0) return;
		last = performance.now();
		window.requestAnimationFrame(tick);
		info('Animation started.');
	};

	window.addEventListener('mousemove', function (e) {
		diffX += e.clientX - mouseX;
		diffY += e.clientY - mouseY;
		mouseX = e.clientX;
		mouseY = e.clientY;

		start();
	});

	var audioListener = function audioListener(audioArray) {
		var gap = audioArray.length / 4;
		var lf = 0,
		    hf = 0;
		for (var i = 0; i < gap; i++) {
			lf += audioArray[i] + audioArray[i + gap * 2];
			hf += audioArray[i + gap] + audioArray[i + gap * 3];
		}
		wS = 1 + lf / gap / 2;
		yS = 1 + hf / gap / 2;

		start();
	};

	window.wallpaperRegisterAudioListener(audioListener);

	info("K-Egg" + ' v' + "0.1.3.master.77ad937" + ' started!');
};

document.addEventListener('DOMContentLoaded', init, false);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9sb2dsZXZlbC9saWIvbG9nbGV2ZWwuanMiLCIuLi9zcmMvZGVidWcuanMiLCIuLi9zcmMvbWFpbi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBsb2dsZXZlbCAtIGh0dHBzOi8vZ2l0aHViLmNvbS9waW10ZXJyeS9sb2dsZXZlbFxuKlxuKiBDb3B5cmlnaHQgKGMpIDIwMTMgVGltIFBlcnJ5XG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiovXG4oZnVuY3Rpb24gKHJvb3QsIGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3QubG9nID0gZGVmaW5pdGlvbigpO1xuICAgIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBub29wID0gZnVuY3Rpb24oKSB7fTtcbiAgICB2YXIgdW5kZWZpbmVkVHlwZSA9IFwidW5kZWZpbmVkXCI7XG5cbiAgICBmdW5jdGlvbiByZWFsTWV0aG9kKG1ldGhvZE5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSB1bmRlZmluZWRUeXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFdlIGNhbid0IGJ1aWxkIGEgcmVhbCBtZXRob2Qgd2l0aG91dCBhIGNvbnNvbGUgdG8gbG9nIHRvXG4gICAgICAgIH0gZWxzZSBpZiAoY29uc29sZVttZXRob2ROYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYmluZE1ldGhvZChjb25zb2xlLCBtZXRob2ROYW1lKTtcbiAgICAgICAgfSBlbHNlIGlmIChjb25zb2xlLmxvZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gYmluZE1ldGhvZChjb25zb2xlLCAnbG9nJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbm9vcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJpbmRNZXRob2Qob2JqLCBtZXRob2ROYW1lKSB7XG4gICAgICAgIHZhciBtZXRob2QgPSBvYmpbbWV0aG9kTmFtZV07XG4gICAgICAgIGlmICh0eXBlb2YgbWV0aG9kLmJpbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBtZXRob2QuYmluZChvYmopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQuY2FsbChtZXRob2QsIG9iaik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gTWlzc2luZyBiaW5kIHNoaW0gb3IgSUU4ICsgTW9kZXJuaXpyLCBmYWxsYmFjayB0byB3cmFwcGluZ1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5hcHBseShtZXRob2QsIFtvYmosIGFyZ3VtZW50c10pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB0aGVzZSBwcml2YXRlIGZ1bmN0aW9ucyBhbHdheXMgbmVlZCBgdGhpc2AgdG8gYmUgc2V0IHByb3Blcmx5XG5cbiAgICBmdW5jdGlvbiBlbmFibGVMb2dnaW5nV2hlbkNvbnNvbGVBcnJpdmVzKG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgICByZXBsYWNlTG9nZ2luZ01ldGhvZHMuY2FsbCh0aGlzLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpc1ttZXRob2ROYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VMb2dnaW5nTWV0aG9kcyhsZXZlbCwgbG9nZ2VyTmFtZSkge1xuICAgICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxvZ01ldGhvZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtZXRob2ROYW1lID0gbG9nTWV0aG9kc1tpXTtcbiAgICAgICAgICAgIHRoaXNbbWV0aG9kTmFtZV0gPSAoaSA8IGxldmVsKSA/XG4gICAgICAgICAgICAgICAgbm9vcCA6XG4gICAgICAgICAgICAgICAgdGhpcy5tZXRob2RGYWN0b3J5KG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRNZXRob2RGYWN0b3J5KG1ldGhvZE5hbWUsIGxldmVsLCBsb2dnZXJOYW1lKSB7XG4gICAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICAgIHJldHVybiByZWFsTWV0aG9kKG1ldGhvZE5hbWUpIHx8XG4gICAgICAgICAgICAgICBlbmFibGVMb2dnaW5nV2hlbkNvbnNvbGVBcnJpdmVzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdmFyIGxvZ01ldGhvZHMgPSBbXG4gICAgICAgIFwidHJhY2VcIixcbiAgICAgICAgXCJkZWJ1Z1wiLFxuICAgICAgICBcImluZm9cIixcbiAgICAgICAgXCJ3YXJuXCIsXG4gICAgICAgIFwiZXJyb3JcIlxuICAgIF07XG5cbiAgICBmdW5jdGlvbiBMb2dnZXIobmFtZSwgZGVmYXVsdExldmVsLCBmYWN0b3J5KSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgY3VycmVudExldmVsO1xuICAgICAgdmFyIHN0b3JhZ2VLZXkgPSBcImxvZ2xldmVsXCI7XG4gICAgICBpZiAobmFtZSkge1xuICAgICAgICBzdG9yYWdlS2V5ICs9IFwiOlwiICsgbmFtZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGVyc2lzdExldmVsSWZQb3NzaWJsZShsZXZlbE51bSkge1xuICAgICAgICAgIHZhciBsZXZlbE5hbWUgPSAobG9nTWV0aG9kc1tsZXZlbE51bV0gfHwgJ3NpbGVudCcpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAgICAgICAvLyBVc2UgbG9jYWxTdG9yYWdlIGlmIGF2YWlsYWJsZVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Vbc3RvcmFnZUtleV0gPSBsZXZlbE5hbWU7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICAvLyBVc2Ugc2Vzc2lvbiBjb29raWUgYXMgZmFsbGJhY2tcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3aW5kb3cuZG9jdW1lbnQuY29va2llID1cbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RvcmFnZUtleSkgKyBcIj1cIiArIGxldmVsTmFtZSArIFwiO1wiO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0UGVyc2lzdGVkTGV2ZWwoKSB7XG4gICAgICAgICAgdmFyIHN0b3JlZExldmVsO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSB3aW5kb3cubG9jYWxTdG9yYWdlW3N0b3JhZ2VLZXldO1xuICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cblxuICAgICAgICAgIGlmICh0eXBlb2Ygc3RvcmVkTGV2ZWwgPT09IHVuZGVmaW5lZFR5cGUpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgIHZhciBjb29raWUgPSB3aW5kb3cuZG9jdW1lbnQuY29va2llO1xuICAgICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gY29va2llLmluZGV4T2YoXG4gICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0b3JhZ2VLZXkpICsgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSAvXihbXjtdKykvLmV4ZWMoY29va2llLnNsaWNlKGxvY2F0aW9uKSlbMV07XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGlnbm9yZSkge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBJZiB0aGUgc3RvcmVkIGxldmVsIGlzIG5vdCB2YWxpZCwgdHJlYXQgaXQgYXMgaWYgbm90aGluZyB3YXMgc3RvcmVkLlxuICAgICAgICAgIGlmIChzZWxmLmxldmVsc1tzdG9yZWRMZXZlbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBzdG9yZWRMZXZlbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc3RvcmVkTGV2ZWw7XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICAgKlxuICAgICAgICogUHVibGljIEFQSVxuICAgICAgICpcbiAgICAgICAqL1xuXG4gICAgICBzZWxmLmxldmVscyA9IHsgXCJUUkFDRVwiOiAwLCBcIkRFQlVHXCI6IDEsIFwiSU5GT1wiOiAyLCBcIldBUk5cIjogMyxcbiAgICAgICAgICBcIkVSUk9SXCI6IDQsIFwiU0lMRU5UXCI6IDV9O1xuXG4gICAgICBzZWxmLm1ldGhvZEZhY3RvcnkgPSBmYWN0b3J5IHx8IGRlZmF1bHRNZXRob2RGYWN0b3J5O1xuXG4gICAgICBzZWxmLmdldExldmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBjdXJyZW50TGV2ZWw7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLnNldExldmVsID0gZnVuY3Rpb24gKGxldmVsLCBwZXJzaXN0KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBsZXZlbCA9PT0gXCJzdHJpbmdcIiAmJiBzZWxmLmxldmVsc1tsZXZlbC50b1VwcGVyQ2FzZSgpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGxldmVsID0gc2VsZi5sZXZlbHNbbGV2ZWwudG9VcHBlckNhc2UoKV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgbGV2ZWwgPT09IFwibnVtYmVyXCIgJiYgbGV2ZWwgPj0gMCAmJiBsZXZlbCA8PSBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgY3VycmVudExldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICAgIGlmIChwZXJzaXN0ICE9PSBmYWxzZSkgeyAgLy8gZGVmYXVsdHMgdG8gdHJ1ZVxuICAgICAgICAgICAgICAgICAgcGVyc2lzdExldmVsSWZQb3NzaWJsZShsZXZlbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmVwbGFjZUxvZ2dpbmdNZXRob2RzLmNhbGwoc2VsZiwgbGV2ZWwsIG5hbWUpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09IHVuZGVmaW5lZFR5cGUgJiYgbGV2ZWwgPCBzZWxmLmxldmVscy5TSUxFTlQpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBcIk5vIGNvbnNvbGUgYXZhaWxhYmxlIGZvciBsb2dnaW5nXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBcImxvZy5zZXRMZXZlbCgpIGNhbGxlZCB3aXRoIGludmFsaWQgbGV2ZWw6IFwiICsgbGV2ZWw7XG4gICAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2VsZi5zZXREZWZhdWx0TGV2ZWwgPSBmdW5jdGlvbiAobGV2ZWwpIHtcbiAgICAgICAgICBpZiAoIWdldFBlcnNpc3RlZExldmVsKCkpIHtcbiAgICAgICAgICAgICAgc2VsZi5zZXRMZXZlbChsZXZlbCwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNlbGYuZW5hYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuVFJBQ0UsIHBlcnNpc3QpO1xuICAgICAgfTtcblxuICAgICAgc2VsZi5kaXNhYmxlQWxsID0gZnVuY3Rpb24ocGVyc2lzdCkge1xuICAgICAgICAgIHNlbGYuc2V0TGV2ZWwoc2VsZi5sZXZlbHMuU0lMRU5ULCBwZXJzaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEluaXRpYWxpemUgd2l0aCB0aGUgcmlnaHQgbGV2ZWxcbiAgICAgIHZhciBpbml0aWFsTGV2ZWwgPSBnZXRQZXJzaXN0ZWRMZXZlbCgpO1xuICAgICAgaWYgKGluaXRpYWxMZXZlbCA9PSBudWxsKSB7XG4gICAgICAgICAgaW5pdGlhbExldmVsID0gZGVmYXVsdExldmVsID09IG51bGwgPyBcIldBUk5cIiA6IGRlZmF1bHRMZXZlbDtcbiAgICAgIH1cbiAgICAgIHNlbGYuc2V0TGV2ZWwoaW5pdGlhbExldmVsLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKlxuICAgICAqIFBhY2thZ2UtbGV2ZWwgQVBJXG4gICAgICpcbiAgICAgKi9cblxuICAgIHZhciBkZWZhdWx0TG9nZ2VyID0gbmV3IExvZ2dlcigpO1xuXG4gICAgdmFyIF9sb2dnZXJzQnlOYW1lID0ge307XG4gICAgZGVmYXVsdExvZ2dlci5nZXRMb2dnZXIgPSBmdW5jdGlvbiBnZXRMb2dnZXIobmFtZSkge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIgfHwgbmFtZSA9PT0gXCJcIikge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJZb3UgbXVzdCBzdXBwbHkgYSBuYW1lIHdoZW4gY3JlYXRpbmcgYSBsb2dnZXIuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvZ2dlciA9IF9sb2dnZXJzQnlOYW1lW25hbWVdO1xuICAgICAgICBpZiAoIWxvZ2dlcikge1xuICAgICAgICAgIGxvZ2dlciA9IF9sb2dnZXJzQnlOYW1lW25hbWVdID0gbmV3IExvZ2dlcihcbiAgICAgICAgICAgIG5hbWUsIGRlZmF1bHRMb2dnZXIuZ2V0TGV2ZWwoKSwgZGVmYXVsdExvZ2dlci5tZXRob2RGYWN0b3J5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbG9nZ2VyO1xuICAgIH07XG5cbiAgICAvLyBHcmFiIHRoZSBjdXJyZW50IGdsb2JhbCBsb2cgdmFyaWFibGUgaW4gY2FzZSBvZiBvdmVyd3JpdGVcbiAgICB2YXIgX2xvZyA9ICh0eXBlb2Ygd2luZG93ICE9PSB1bmRlZmluZWRUeXBlKSA/IHdpbmRvdy5sb2cgOiB1bmRlZmluZWQ7XG4gICAgZGVmYXVsdExvZ2dlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSB1bmRlZmluZWRUeXBlICYmXG4gICAgICAgICAgICAgICB3aW5kb3cubG9nID09PSBkZWZhdWx0TG9nZ2VyKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9nID0gX2xvZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZhdWx0TG9nZ2VyO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmYXVsdExvZ2dlcjtcbn0pKTtcbiIsIi8qIGdsb2JhbCBBUFBOQU1FICovXG4ndXNlIHN0cmljdCdcblxuaW1wb3J0IGxvZ2dlciBmcm9tICdsb2dsZXZlbCdcblxuY29uc3QgYXBwTmFtZSA9IGBbJHtBUFBOQU1FfV1gXG5jb25zdCBsb2cgPSBjb25zb2xlLmxvZy5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCB0cmFjZSA9IGxvZ2dlci50cmFjZS5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCBkZWJ1ZyA9IGxvZ2dlci5kZWJ1Zy5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCBpbmZvID0gbG9nZ2VyLmluZm8uYmluZChudWxsLCBhcHBOYW1lKVxuY29uc3Qgd2FybiA9IGxvZ2dlci53YXJuLmJpbmQobnVsbCwgYXBwTmFtZSlcbmNvbnN0IGVycm9yID0gbG9nZ2VyLmVycm9yLmJpbmQobnVsbCwgYXBwTmFtZSlcblxuaWYgKEVOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG5cdGxvZ2dlci5zZXRMZXZlbCgnZXJyb3InKVxufSBlbHNlIHtcblx0bG9nZ2VyLnNldExldmVsKCd0cmFjZScpXG59XG5cbmluZm8oJ0RlYnVnIGxvZ2dpbmcgZW5hYmxlZCEnKVxuXG5leHBvcnQgeyBsb2csIHRyYWNlLCBkZWJ1ZywgaW5mbywgd2FybiwgZXJyb3IgfVxuIiwiLyogZ2xvYmFsIEFQUE5BTUUsIFZFUlNJT04gKi9cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgeyBpbmZvIH0gZnJvbSAnLi9kZWJ1Zy5qcydcblxuaW1wb3J0IGNvbnRlbnQgZnJvbSAnLi9tYWluLmh0bWwnXG5pbXBvcnQgZXcgZnJvbSAnLi9yZXMvZWdnLXcuc3ZnJ1xuaW1wb3J0IGV5IGZyb20gJy4vcmVzL2VnZy15LnN2ZydcbmltcG9ydCAnLi9zdHlsZS9zdHlsZS5jc3MnXG5cbi8vIFNldCBkZWZhdWx0IHByb3BlcnRpZXNcbmNvbnN0IHByb3BzID0ge1xuXHRmcHM6IDAsXG5cdHRnOiAwXG59XG5cbmNvbnN0ICQgPSBzZWxlY3RvciA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxuXG4vKiBCYXNlNjQgY29udmVyc2lvblxuKiogZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE2MjQ1NzY3L2NyZWF0aW5nLWEtYmxvYi1mcm9tLWEtYmFzZTY0LXN0cmluZy1pbi1qYXZhc2NyaXB0XG4qKiBtb2RpZmllZCBmb3IgYWN0dWFsIHVzYWdlXG4qL1xuLy8gY29uc3QgYjY0dG9CbG9iVXJsID0gKGI2NFN0ciwgc2xpY2VTaXplID0gNTEyKSA9PiB7XG4vLyBcdGNvbnN0IFt0eXBlLCBiNjREYXRhXSA9IGI2NFN0ci5zcGxpdCgnLCcpLFxuLy8gXHRcdGNvbnRlbnRUeXBlID0gdHlwZS5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF0sXG4vLyBcdFx0Ynl0ZUNoYXJhY3RlcnMgPSBhdG9iKGI2NERhdGEpLFxuLy8gXHRcdGJ5dGVBcnJheXMgPSBbXVxuXG4vLyBcdGZvciAobGV0IG9mZnNldCA9IDA7IG9mZnNldCA8IGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aDsgb2Zmc2V0ICs9IHNsaWNlU2l6ZSkge1xuLy8gXHRcdGNvbnN0IHNsaWNlID0gYnl0ZUNoYXJhY3RlcnMuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBzbGljZVNpemUpXG5cbi8vIFx0XHRjb25zdCBieXRlTnVtYmVycyA9IG5ldyBBcnJheShzbGljZS5sZW5ndGgpXG4vLyBcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzbGljZS5sZW5ndGg7IGkrKykge1xuLy8gXHRcdFx0Ynl0ZU51bWJlcnNbaV0gPSBzbGljZS5jaGFyQ29kZUF0KGkpXG4vLyBcdFx0fVxuXG4vLyBcdFx0Y29uc3QgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZU51bWJlcnMpXG4vLyBcdFx0Ynl0ZUFycmF5cy5wdXNoKGJ5dGVBcnJheSlcbi8vIFx0fVxuXG4vLyBcdGNvbnN0IGJsb2IgPSBuZXcgQmxvYihieXRlQXJyYXlzLCB7dHlwZTogY29udGVudFR5cGV9KVxuLy8gXHRyZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKVxuLy8gfVxuXG4vLyBHZXQgaW1hZ2VzIGZyb20gYmFzZTY0IGRhdGFcbi8vIGNvbnN0IGVnZ3cgPSBiNjR0b0Jsb2JVcmwoZXcuc3JjKSxcbi8vIFx0ZWdneSA9IGI2NHRvQmxvYlVybChleS5zcmMpXG5cbi8vIEhhbmRsZSB1c2VyIHByb3BlcnRpZXNcbndpbmRvdy53YWxscGFwZXJQcm9wZXJ0eUxpc3RlbmVyID0ge1xuXHRhcHBseUdlbmVyYWxQcm9wZXJ0aWVzKHVwKSB7XG5cdFx0aWYgKHVwLmZwcykge1xuXHRcdFx0cHJvcHMuZnBzID0gdXAuZnBzXG5cdFx0XHRwcm9wcy50ZyA9IDEwMDAgLyB1cC5mcHNcblx0XHRcdGluZm8oJ0ZQUyBsaW1pdGF0aW9uIHVwZGF0ZWQsIGN1cnJlbnQgRlBTIGxpbWl0YXRpb24gaXMnLCBwcm9wcy5mcHMsICd0aW1lZ2FwIGlzJywgcHJvcHMudGcpXG5cdFx0fVxuXHR9XG59XG5cbmNvbnN0IGluaXQgPSAoKSA9PiB7XG5cdC8vIFJlbW92ZSB0aGUgaW5pdCBsaXN0ZW5lclxuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdCwgZmFsc2UpXG5cblx0Ly8gUHJlcGFyZSB0aGUgZnJ5aW5nIHBhblxuXHQvLyBjb25zdCBwYW4gPSAkLnEoJ2JvZHknKVxuXHQvLyBwYW4uJGVsLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGNvbnRlbnQpXG5cdCQoJ2JvZHknKS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBjb250ZW50KVxuXHRjb25zdCBwciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG5cdFx0YyA9ICQoJy5lZ2cnKSxcblx0XHR3VyA9IHdpbmRvdy5pbm5lcldpZHRoLFxuXHRcdHdIID0gd2luZG93LmlubmVySGVpZ2h0XG5cdGxldCBiTCA9IDAsXG5cdFx0YlQgPSAwLFxuXHRcdGJTID0gMVxuXHRjLndpZHRoID0gd1cgKiBwclxuXHRjLmhlaWdodCA9IHdIICogcHJcblx0aWYgKHdXIC8gd0ggPiBldy53aWR0aCAvIGV3LmhlaWdodCkge1xuXHRcdGJTID0gd0ggLyBldy5oZWlnaHRcblx0XHRiTCA9ICh3VyAtIGJTICogZXcud2lkdGgpIC8gMlxuXHR9IGVsc2Uge1xuXHRcdGJTID0gd1cgLyBldy53aWR0aFxuXHRcdGJUID0gKHdIIC0gYlMgKiBldy5oZWlnaHQpIC8gMlxuXHR9XG5cblx0Y29uc3QgaVcgPSBldy53aWR0aCAqIGJTLFxuXHRcdGlIID0gZXcuaGVpZ2h0ICogYlNcblxuXHRjb25zdCBwYW4gPSBjLmdldENvbnRleHQoJzJkJylcblx0cGFuLnNjYWxlKHByLCBwcilcblxuXHRwYW4uZHJhd0ltYWdlKGV3LCBiTCwgYlQsIGlXLCBpSClcblx0cGFuLmRyYXdJbWFnZShleSwgYkwsIGJULCBpVywgaUgpXG5cblx0Ly8gU2V0IHRoZSBzdG9wIHBvaW50XG5cdGNvbnN0IHNwID0gMC4yXG5cblx0Ly8gSW5pdGlhbGl6ZSB2aXJhYmxlc1xuXHRsZXQgbW91c2VYID0gd2luZG93LmlubmVyV2lkdGggLyAyLFxuXHRcdG1vdXNlWSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIDIsXG5cdFx0ZnBzVGhyZXNob2xkID0gMCxcblx0XHRsYXN0ID0gMCxcblx0XHRkaWZmWCA9IDAsXG5cdFx0ZGlmZlkgPSAwLFxuXHRcdHdYID0gMCxcblx0XHR3WSA9IDAsXG5cdFx0eVggPSAwLFxuXHRcdHlZID0gMCxcblx0XHR3UyA9IDEsXG5cdFx0eVMgPSAxXG5cblx0Ly8gQXBwbHkgY2hhbmdlcyB0byB2aWV3XG5cdGNvbnN0IHVwZGF0ZSA9ICgpID0+IHtcblx0XHRjb25zdCB3ZFcgPSBpVyAqIHdTLFxuXHRcdFx0d2RIID0gaUggKiB3Uyxcblx0XHRcdHlkVyA9IGlXICogeVMsXG5cdFx0XHR5ZEggPSBpSCAqIHlTLFxuXHRcdFx0d3BMID0gKHdkVyAtIGlXKSAvIDIsXG5cdFx0XHR3cFQgPSAod2RIIC0gaUgpIC8gMixcblx0XHRcdHlwTCA9ICh5ZFcgLSBpVykgLyAyLFxuXHRcdFx0eXBUID0gKHlkSCAtIGlIKSAvIDJcblx0XHRwYW4uY2xlYXJSZWN0KDAsIDAsIGMud2lkdGgsIGMuaGVpZ2h0KVxuXHRcdHBhbi5kcmF3SW1hZ2UoZXcsIGJMICsgd1ggLSB3cEwsIGJUICsgd1kgLSB3cFQsIHdkVywgd2RIKVxuXHRcdHBhbi5kcmF3SW1hZ2UoZXksIGJMICsgeVggLSB5cEwsIGJUICsgeVkgLSB5cFQsIHlkVywgeWRIKVxuXHR9XG5cblx0Ly8gUGF1c2UgYW5pbWF0aW9uIHRvIHNhdmUgQ1BVIHdoZW4gbm90IGFjdGl2ZVxuXHRjb25zdCBwYXVzZSA9ICgpID0+IHtcblx0XHRmcHNUaHJlc2hvbGQgPSAwXG5cdFx0bGFzdCA9IDBcblx0XHRkaWZmWCA9IDBcblx0XHRkaWZmWSA9IDBcblx0XHR3WCA9IDBcblx0XHR3WSA9IDBcblx0XHR5WCA9IDBcblx0XHR5WSA9IDBcblx0XHR3UyA9IDFcblx0XHR5UyA9IDFcblx0XHR1cGRhdGUoKVxuXHRcdGluZm8oJ0FuaW1hdGlvbiBwYXVzZWQuJylcblx0fVxuXG5cdC8vIENhbGN1bGF0aW9uIG9uIGVhY2ggZnJhbWVcblx0Y29uc3QgdGljayA9ICgpID0+IHtcblx0XHRjb25zdCBtb3ZlWCA9IGRpZmZYIC8gMzAsXG5cdFx0XHRtb3ZlWSA9IGRpZmZZIC8gMzAsXG5cdFx0XHRub3cgPSBwZXJmb3JtYW5jZS5ub3coKSxcblx0XHRcdGR0ID0gbm93IC0gbGFzdFxuXHRcdGxhc3QgPSBub3dcblx0XHRkaWZmWCAtPSBtb3ZlWFxuXHRcdGRpZmZZIC09IG1vdmVZXG5cdFx0d1ggKz0gKG1vdmVYIC0gd1ggLyA0MCkgLyAyXG5cdFx0d1kgKz0gKG1vdmVZIC0gd1kgLyA0MCkgLyAyXG5cdFx0eVggKz0gKG1vdmVYIC0geVggLyAzMCkgLyAxLjUgKyAod1ggLSB5WCkgLyAzMFxuXHRcdHlZICs9IChtb3ZlWSAtIHlZIC8gMzApIC8gMS41ICsgKHdZIC0geVkpIC8gMzBcblxuXHRcdC8vIFN0YXJ0IE5leHQgdGlja1xuXHRcdGlmIChNYXRoLmFicyh3WCkgKyBNYXRoLmFicyh3WSkgKyBNYXRoLmFicyh5WCkgKyBNYXRoLmFicyh5WSkgPCBzcCAmJiB3UyArIHlTID09PSAyKSByZXR1cm4gcGF1c2UoKVxuXHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcblxuXHRcdC8vIExpbWl0IEZQU1xuXHRcdGlmIChwcm9wcy5mcHMgPiAwKSB7XG5cdFx0XHRmcHNUaHJlc2hvbGQgKz0gZHRcblx0XHRcdGlmIChmcHNUaHJlc2hvbGQgPiBwcm9wcy50ZykgZnBzVGhyZXNob2xkID0gcHJvcHMudGdcblx0XHRcdGlmIChmcHNUaHJlc2hvbGQgPCBwcm9wcy50ZykgcmV0dXJuXG5cdFx0XHRmcHNUaHJlc2hvbGQgLT0gcHJvcHMudGdcblx0XHR9XG5cblx0XHR1cGRhdGUoKVxuXHR9XG5cblx0Ly8gSGFuZGxlIGlmIHN0YXJ0IHRoZSBhbmltYXRpb25cblx0Y29uc3Qgc3RhcnQgPSAoKSA9PiB7XG5cdFx0aWYgKGxhc3QgIT09IDApIHJldHVyblxuXHRcdGxhc3QgPSBwZXJmb3JtYW5jZS5ub3coKVxuXHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcblx0XHRpbmZvKCdBbmltYXRpb24gc3RhcnRlZC4nKVxuXHR9XG5cblx0Ly8gTGlzdGVuIG1vdXNlIG1vdmUgZXZlbnRzXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4ge1xuXHRcdGRpZmZYICs9IGUuY2xpZW50WCAtIG1vdXNlWFxuXHRcdGRpZmZZICs9IGUuY2xpZW50WSAtIG1vdXNlWVxuXHRcdG1vdXNlWCA9IGUuY2xpZW50WFxuXHRcdG1vdXNlWSA9IGUuY2xpZW50WVxuXG5cdFx0Ly8gU3RhcnQgYW5pbWF0aW9uXG5cdFx0c3RhcnQoKVxuXHR9KVxuXG5cdC8vIEhhbmRsZSBhdWRpbyBpbmZvIHVwZGF0ZXNcblx0Y29uc3QgYXVkaW9MaXN0ZW5lciA9IChhdWRpb0FycmF5KSA9PiB7XG5cdFx0Y29uc3QgZ2FwID0gYXVkaW9BcnJheS5sZW5ndGggLyA0XG5cdFx0bGV0IGxmID0gMCxcblx0XHRcdGhmID0gMFxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZ2FwOyBpKyspIHtcblx0XHRcdGxmICs9IGF1ZGlvQXJyYXlbaV0gKyBhdWRpb0FycmF5W2kgKyBnYXAgKiAyXVxuXHRcdFx0aGYgKz0gYXVkaW9BcnJheVtpICsgZ2FwXSArIGF1ZGlvQXJyYXlbaSArIGdhcCAqIDNdXG5cdFx0fVxuXHRcdHdTID0gMSArIChsZiAvIGdhcCkgLyAyXG5cdFx0eVMgPSAxICsgKGhmIC8gZ2FwKSAvIDJcblx0XHQvLyBTdGFydCBhbmltYXRpb25cblx0XHRzdGFydCgpXG5cdH1cblxuXHQvLyBMaXN0ZW4gYXVkaW8gdXBkYXRlc1xuXHR3aW5kb3cud2FsbHBhcGVyUmVnaXN0ZXJBdWRpb0xpc3RlbmVyKGF1ZGlvTGlzdGVuZXIpXG5cblx0aW5mbyhgJHtBUFBOQU1FfSB2JHtWRVJTSU9OfSBzdGFydGVkIWApXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0LCBmYWxzZSlcbiJdLCJuYW1lcyI6WyJ0aGlzIiwiYXBwTmFtZSIsIkFQUE5BTUUiLCJsb2ciLCJjb25zb2xlIiwiYmluZCIsInRyYWNlIiwibG9nZ2VyIiwiZGVidWciLCJpbmZvIiwid2FybiIsImVycm9yIiwiRU5WIiwic2V0TGV2ZWwiLCJwcm9wcyIsIiQiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJzZWxlY3RvciIsIndpbmRvdyIsIndhbGxwYXBlclByb3BlcnR5TGlzdGVuZXIiLCJ1cCIsImZwcyIsInRnIiwiaW5pdCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJpbnNlcnRBZGphY2VudEhUTUwiLCJjb250ZW50IiwicHIiLCJkZXZpY2VQaXhlbFJhdGlvIiwiYyIsIndXIiwiaW5uZXJXaWR0aCIsIndIIiwiaW5uZXJIZWlnaHQiLCJiTCIsImJUIiwiYlMiLCJ3aWR0aCIsImhlaWdodCIsImV3IiwiaVciLCJpSCIsInBhbiIsImdldENvbnRleHQiLCJzY2FsZSIsImRyYXdJbWFnZSIsImV5Iiwic3AiLCJtb3VzZVgiLCJtb3VzZVkiLCJmcHNUaHJlc2hvbGQiLCJsYXN0IiwiZGlmZlgiLCJkaWZmWSIsIndYIiwid1kiLCJ5WCIsInlZIiwid1MiLCJ5UyIsInVwZGF0ZSIsIndkVyIsIndkSCIsInlkVyIsInlkSCIsIndwTCIsIndwVCIsInlwTCIsInlwVCIsImNsZWFyUmVjdCIsInBhdXNlIiwidGljayIsIm1vdmVYIiwibW92ZVkiLCJub3ciLCJwZXJmb3JtYW5jZSIsImR0IiwiTWF0aCIsImFicyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInN0YXJ0IiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJjbGllbnRYIiwiY2xpZW50WSIsImF1ZGlvTGlzdGVuZXIiLCJhdWRpb0FycmF5IiwiZ2FwIiwibGVuZ3RoIiwibGYiLCJoZiIsImkiLCJ3YWxscGFwZXJSZWdpc3RlckF1ZGlvTGlzdGVuZXIiLCJWRVJTSU9OIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFNQSxDQUFDLFVBQVUsSUFBSSxFQUFFLFVBQVUsRUFBRTtJQUN6QixZQUFZLENBQUM7SUFDYixJQUFJLE9BQU8sTUFBTSxLQUFLLFVBQVUsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFO1FBQzVDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUN0QixNQUFNLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDckQsY0FBYyxHQUFHLFVBQVUsRUFBRSxDQUFDO0tBQ2pDLE1BQU07UUFDSCxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsRUFBRSxDQUFDO0tBQzNCO0NBQ0osQ0FBQ0EsY0FBSSxFQUFFLFlBQVk7SUFDaEIsWUFBWSxDQUFDO0lBQ2IsSUFBSSxJQUFJLEdBQUcsV0FBVyxFQUFFLENBQUM7SUFDekIsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDOztJQUVoQyxTQUFTLFVBQVUsQ0FBQyxVQUFV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
