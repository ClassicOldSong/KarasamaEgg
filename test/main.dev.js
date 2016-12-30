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

	info("K-Egg" + ' v' + "0.1.2.master.4ccc796" + ' started!');
};

document.addEventListener('DOMContentLoaded', init, false);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9sb2dsZXZlbC9saWIvbG9nbGV2ZWwuanMiLCIuLi9zcmMvZGVidWcuanMiLCIuLi9zcmMvcmVzL2VnZy13LnN2ZyIsIi4uL3NyYy9yZXMvZWdnLXkuc3ZnIiwiLi4vc3JjL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiogbG9nbGV2ZWwgLSBodHRwczovL2dpdGh1Yi5jb20vcGltdGVycnkvbG9nbGV2ZWxcbipcbiogQ29weXJpZ2h0IChjKSAyMDEzIFRpbSBQZXJyeVxuKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4qL1xuKGZ1bmN0aW9uIChyb290LCBkZWZpbml0aW9uKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZGVmaW5pdGlvbik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByb290LmxvZyA9IGRlZmluaXRpb24oKTtcbiAgICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge307XG4gICAgdmFyIHVuZGVmaW5lZFR5cGUgPSBcInVuZGVmaW5lZFwiO1xuXG4gICAgZnVuY3Rpb24gcmVhbE1ldGhvZChtZXRob2ROYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSA9PT0gdW5kZWZpbmVkVHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBXZSBjYW4ndCBidWlsZCBhIHJlYWwgbWV0aG9kIHdpdGhvdXQgYSBjb25zb2xlIHRvIGxvZyB0b1xuICAgICAgICB9IGVsc2UgaWYgKGNvbnNvbGVbbWV0aG9kTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRNZXRob2QoY29uc29sZSwgbWV0aG9kTmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29uc29sZS5sb2cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRNZXRob2QoY29uc29sZSwgJ2xvZycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5vb3A7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBiaW5kTWV0aG9kKG9iaiwgbWV0aG9kTmFtZSkge1xuICAgICAgICB2YXIgbWV0aG9kID0gb2JqW21ldGhvZE5hbWVdO1xuICAgICAgICBpZiAodHlwZW9mIG1ldGhvZC5iaW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gbWV0aG9kLmJpbmQob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLmNhbGwobWV0aG9kLCBvYmopO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIE1pc3NpbmcgYmluZCBzaGltIG9yIElFOCArIE1vZGVybml6ciwgZmFsbGJhY2sgdG8gd3JhcHBpbmdcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuYXBwbHkobWV0aG9kLCBbb2JqLCBhcmd1bWVudHNdKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gdGhlc2UgcHJpdmF0ZSBmdW5jdGlvbnMgYWx3YXlzIG5lZWQgYHRoaXNgIHRvIGJlIHNldCBwcm9wZXJseVxuXG4gICAgZnVuY3Rpb24gZW5hYmxlTG9nZ2luZ1doZW5Db25zb2xlQXJyaXZlcyhtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSB1bmRlZmluZWRUeXBlKSB7XG4gICAgICAgICAgICAgICAgcmVwbGFjZUxvZ2dpbmdNZXRob2RzLmNhbGwodGhpcywgbGV2ZWwsIGxvZ2dlck5hbWUpO1xuICAgICAgICAgICAgICAgIHRoaXNbbWV0aG9kTmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXBsYWNlTG9nZ2luZ01ldGhvZHMobGV2ZWwsIGxvZ2dlck5hbWUpIHtcbiAgICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2dNZXRob2RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9IGxvZ01ldGhvZHNbaV07XG4gICAgICAgICAgICB0aGlzW21ldGhvZE5hbWVdID0gKGkgPCBsZXZlbCkgP1xuICAgICAgICAgICAgICAgIG5vb3AgOlxuICAgICAgICAgICAgICAgIHRoaXMubWV0aG9kRmFjdG9yeShtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWZhdWx0TWV0aG9kRmFjdG9yeShtZXRob2ROYW1lLCBsZXZlbCwgbG9nZ2VyTmFtZSkge1xuICAgICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgICByZXR1cm4gcmVhbE1ldGhvZChtZXRob2ROYW1lKSB8fFxuICAgICAgICAgICAgICAgZW5hYmxlTG9nZ2luZ1doZW5Db25zb2xlQXJyaXZlcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHZhciBsb2dNZXRob2RzID0gW1xuICAgICAgICBcInRyYWNlXCIsXG4gICAgICAgIFwiZGVidWdcIixcbiAgICAgICAgXCJpbmZvXCIsXG4gICAgICAgIFwid2FyblwiLFxuICAgICAgICBcImVycm9yXCJcbiAgICBdO1xuXG4gICAgZnVuY3Rpb24gTG9nZ2VyKG5hbWUsIGRlZmF1bHRMZXZlbCwgZmFjdG9yeSkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGN1cnJlbnRMZXZlbDtcbiAgICAgIHZhciBzdG9yYWdlS2V5ID0gXCJsb2dsZXZlbFwiO1xuICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgc3RvcmFnZUtleSArPSBcIjpcIiArIG5hbWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHBlcnNpc3RMZXZlbElmUG9zc2libGUobGV2ZWxOdW0pIHtcbiAgICAgICAgICB2YXIgbGV2ZWxOYW1lID0gKGxvZ01ldGhvZHNbbGV2ZWxOdW1dIHx8ICdzaWxlbnQnKS50b1VwcGVyQ2FzZSgpO1xuXG4gICAgICAgICAgLy8gVXNlIGxvY2FsU3RvcmFnZSBpZiBhdmFpbGFibGVcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlW3N0b3JhZ2VLZXldID0gbGV2ZWxOYW1lO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBjYXRjaCAoaWdub3JlKSB7fVxuXG4gICAgICAgICAgLy8gVXNlIHNlc3Npb24gY29va2llIGFzIGZhbGxiYWNrXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgd2luZG93LmRvY3VtZW50LmNvb2tpZSA9XG4gICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHN0b3JhZ2VLZXkpICsgXCI9XCIgKyBsZXZlbE5hbWUgKyBcIjtcIjtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGdldFBlcnNpc3RlZExldmVsKCkge1xuICAgICAgICAgIHZhciBzdG9yZWRMZXZlbDtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHN0b3JlZExldmVsID0gd2luZG93LmxvY2FsU3RvcmFnZVtzdG9yYWdlS2V5XTtcbiAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIHN0b3JlZExldmVsID09PSB1bmRlZmluZWRUeXBlKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICB2YXIgY29va2llID0gd2luZG93LmRvY3VtZW50LmNvb2tpZTtcbiAgICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IGNvb2tpZS5pbmRleE9mKFxuICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChzdG9yYWdlS2V5KSArIFwiPVwiKTtcbiAgICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgIHN0b3JlZExldmVsID0gL14oW147XSspLy5leGVjKGNvb2tpZS5zbGljZShsb2NhdGlvbikpWzFdO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChpZ25vcmUpIHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgdGhlIHN0b3JlZCBsZXZlbCBpcyBub3QgdmFsaWQsIHRyZWF0IGl0IGFzIGlmIG5vdGhpbmcgd2FzIHN0b3JlZC5cbiAgICAgICAgICBpZiAoc2VsZi5sZXZlbHNbc3RvcmVkTGV2ZWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgc3RvcmVkTGV2ZWwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN0b3JlZExldmVsO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgICpcbiAgICAgICAqIFB1YmxpYyBBUElcbiAgICAgICAqXG4gICAgICAgKi9cblxuICAgICAgc2VsZi5sZXZlbHMgPSB7IFwiVFJBQ0VcIjogMCwgXCJERUJVR1wiOiAxLCBcIklORk9cIjogMiwgXCJXQVJOXCI6IDMsXG4gICAgICAgICAgXCJFUlJPUlwiOiA0LCBcIlNJTEVOVFwiOiA1fTtcblxuICAgICAgc2VsZi5tZXRob2RGYWN0b3J5ID0gZmFjdG9yeSB8fCBkZWZhdWx0TWV0aG9kRmFjdG9yeTtcblxuICAgICAgc2VsZi5nZXRMZXZlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gY3VycmVudExldmVsO1xuICAgICAgfTtcblxuICAgICAgc2VsZi5zZXRMZXZlbCA9IGZ1bmN0aW9uIChsZXZlbCwgcGVyc2lzdCkge1xuICAgICAgICAgIGlmICh0eXBlb2YgbGV2ZWwgPT09IFwic3RyaW5nXCIgJiYgc2VsZi5sZXZlbHNbbGV2ZWwudG9VcHBlckNhc2UoKV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBsZXZlbCA9IHNlbGYubGV2ZWxzW2xldmVsLnRvVXBwZXJDYXNlKCldO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIGxldmVsID09PSBcIm51bWJlclwiICYmIGxldmVsID49IDAgJiYgbGV2ZWwgPD0gc2VsZi5sZXZlbHMuU0lMRU5UKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRMZXZlbCA9IGxldmVsO1xuICAgICAgICAgICAgICBpZiAocGVyc2lzdCAhPT0gZmFsc2UpIHsgIC8vIGRlZmF1bHRzIHRvIHRydWVcbiAgICAgICAgICAgICAgICAgIHBlcnNpc3RMZXZlbElmUG9zc2libGUobGV2ZWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlcGxhY2VMb2dnaW5nTWV0aG9kcy5jYWxsKHNlbGYsIGxldmVsLCBuYW1lKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlID09PSB1bmRlZmluZWRUeXBlICYmIGxldmVsIDwgc2VsZi5sZXZlbHMuU0lMRU5UKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gXCJObyBjb25zb2xlIGF2YWlsYWJsZSBmb3IgbG9nZ2luZ1wiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhyb3cgXCJsb2cuc2V0TGV2ZWwoKSBjYWxsZWQgd2l0aCBpbnZhbGlkIGxldmVsOiBcIiArIGxldmVsO1xuICAgICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHNlbGYuc2V0RGVmYXVsdExldmVsID0gZnVuY3Rpb24gKGxldmVsKSB7XG4gICAgICAgICAgaWYgKCFnZXRQZXJzaXN0ZWRMZXZlbCgpKSB7XG4gICAgICAgICAgICAgIHNlbGYuc2V0TGV2ZWwobGV2ZWwsIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzZWxmLmVuYWJsZUFsbCA9IGZ1bmN0aW9uKHBlcnNpc3QpIHtcbiAgICAgICAgICBzZWxmLnNldExldmVsKHNlbGYubGV2ZWxzLlRSQUNFLCBwZXJzaXN0KTtcbiAgICAgIH07XG5cbiAgICAgIHNlbGYuZGlzYWJsZUFsbCA9IGZ1bmN0aW9uKHBlcnNpc3QpIHtcbiAgICAgICAgICBzZWxmLnNldExldmVsKHNlbGYubGV2ZWxzLlNJTEVOVCwgcGVyc2lzdCk7XG4gICAgICB9O1xuXG4gICAgICAvLyBJbml0aWFsaXplIHdpdGggdGhlIHJpZ2h0IGxldmVsXG4gICAgICB2YXIgaW5pdGlhbExldmVsID0gZ2V0UGVyc2lzdGVkTGV2ZWwoKTtcbiAgICAgIGlmIChpbml0aWFsTGV2ZWwgPT0gbnVsbCkge1xuICAgICAgICAgIGluaXRpYWxMZXZlbCA9IGRlZmF1bHRMZXZlbCA9PSBudWxsID8gXCJXQVJOXCIgOiBkZWZhdWx0TGV2ZWw7XG4gICAgICB9XG4gICAgICBzZWxmLnNldExldmVsKGluaXRpYWxMZXZlbCwgZmFsc2UpO1xuICAgIH1cblxuICAgIC8qXG4gICAgICpcbiAgICAgKiBQYWNrYWdlLWxldmVsIEFQSVxuICAgICAqXG4gICAgICovXG5cbiAgICB2YXIgZGVmYXVsdExvZ2dlciA9IG5ldyBMb2dnZXIoKTtcblxuICAgIHZhciBfbG9nZ2Vyc0J5TmFtZSA9IHt9O1xuICAgIGRlZmF1bHRMb2dnZXIuZ2V0TG9nZ2VyID0gZnVuY3Rpb24gZ2V0TG9nZ2VyKG5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiIHx8IG5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiWW91IG11c3Qgc3VwcGx5IGEgbmFtZSB3aGVuIGNyZWF0aW5nIGEgbG9nZ2VyLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsb2dnZXIgPSBfbG9nZ2Vyc0J5TmFtZVtuYW1lXTtcbiAgICAgICAgaWYgKCFsb2dnZXIpIHtcbiAgICAgICAgICBsb2dnZXIgPSBfbG9nZ2Vyc0J5TmFtZVtuYW1lXSA9IG5ldyBMb2dnZXIoXG4gICAgICAgICAgICBuYW1lLCBkZWZhdWx0TG9nZ2VyLmdldExldmVsKCksIGRlZmF1bHRMb2dnZXIubWV0aG9kRmFjdG9yeSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxvZ2dlcjtcbiAgICB9O1xuXG4gICAgLy8gR3JhYiB0aGUgY3VycmVudCBnbG9iYWwgbG9nIHZhcmlhYmxlIGluIGNhc2Ugb2Ygb3ZlcndyaXRlXG4gICAgdmFyIF9sb2cgPSAodHlwZW9mIHdpbmRvdyAhPT0gdW5kZWZpbmVkVHlwZSkgPyB3aW5kb3cubG9nIDogdW5kZWZpbmVkO1xuICAgIGRlZmF1bHRMb2dnZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gdW5kZWZpbmVkVHlwZSAmJlxuICAgICAgICAgICAgICAgd2luZG93LmxvZyA9PT0gZGVmYXVsdExvZ2dlcikge1xuICAgICAgICAgICAgd2luZG93LmxvZyA9IF9sb2c7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmYXVsdExvZ2dlcjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmF1bHRMb2dnZXI7XG59KSk7XG4iLCIvKiBnbG9iYWwgQVBQTkFNRSAqL1xuJ3VzZSBzdHJpY3QnXG5cbmltcG9ydCBsb2dnZXIgZnJvbSAnbG9nbGV2ZWwnXG5cbmNvbnN0IGFwcE5hbWUgPSBgWyR7QVBQTkFNRX1dYFxuY29uc3QgbG9nID0gY29uc29sZS5sb2cuYmluZChudWxsLCBhcHBOYW1lKVxuY29uc3QgdHJhY2UgPSBsb2dnZXIudHJhY2UuYmluZChudWxsLCBhcHBOYW1lKVxuY29uc3QgZGVidWcgPSBsb2dnZXIuZGVidWcuYmluZChudWxsLCBhcHBOYW1lKVxuY29uc3QgaW5mbyA9IGxvZ2dlci5pbmZvLmJpbmQobnVsbCwgYXBwTmFtZSlcbmNvbnN0IHdhcm4gPSBsb2dnZXIud2Fybi5iaW5kKG51bGwsIGFwcE5hbWUpXG5jb25zdCBlcnJvciA9IGxvZ2dlci5lcnJvci5iaW5kKG51bGwsIGFwcE5hbWUpXG5cbmlmIChFTlYgPT09ICdwcm9kdWN0aW9uJykge1xuXHRsb2dnZXIuc2V0TGV2ZWwoJ2Vycm9yJylcbn0gZWxzZSB7XG5cdGxvZ2dlci5zZXRMZXZlbCgndHJhY2UnKVxufVxuXG5pbmZvKCdEZWJ1ZyBsb2dnaW5nIGVuYWJsZWQhJylcblxuZXhwb3J0IHsgbG9nLCB0cmFjZSwgZGVidWcsIGluZm8sIHdhcm4sIGVycm9yIH1cbiIsInZhciBpbWcgPSBuZXcgSW1hZ2UoKTsgaW1nLnNyYyA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0Nqd2hMUzBnUTNKbFlYUmxaQ0IzYVhSb0lFbHVhM05qWVhCbElDaG9kSFJ3T2k4dmQzZDNMbWx1YTNOallYQmxMbTl5Wnk4cElDMHRQZ29LUEhOMlp3b2dJQ0I0Yld4dWN6cGtZejBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJWc1pXMWxiblJ6THpFdU1TOGlDaUFnSUhodGJHNXpPbU5qUFNKb2RIUndPaTh2WTNKbFlYUnBkbVZqYjIxdGIyNXpMbTl5Wnk5dWN5TWlDaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJS0lDQWdlRzFzYm5NNmMzWm5QU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeUlLSUNBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lDQjRiV3h1Y3pwemIyUnBjRzlrYVQwaWFIUjBjRG92TDNOdlpHbHdiMlJwTG5OdmRYSmpaV1p2Y21kbExtNWxkQzlFVkVRdmMyOWthWEJ2WkdrdE1DNWtkR1FpQ2lBZ0lIaHRiRzV6T21sdWEzTmpZWEJsUFNKb2RIUndPaTh2ZDNkM0xtbHVhM05qWVhCbExtOXlaeTl1WVcxbGMzQmhZMlZ6TDJsdWEzTmpZWEJsSWdvZ0lDQjNhV1IwYUQwaU1Ua3lNQ0lLSUNBZ2FHVnBaMmgwUFNJeE1EZ3dJZ29nSUNCMmFXVjNRbTk0UFNJd0lEQWdNVGt5TUNBeE1EZ3dJZ29nSUNCcFpEMGljM1puTWlJS0lDQWdkbVZ5YzJsdmJqMGlNUzR4SWdvZ0lDQnBibXR6WTJGd1pUcDJaWEp6YVc5dVBTSXdMamt4SUhJeE16Y3lOU0lLSUNBZ2MyOWthWEJ2WkdrNlpHOWpibUZ0WlQwaVpXZG5MV0puTG5OMlp5SUtJQ0FnYVc1cmMyTmhjR1U2Wlhod2IzSjBMV1pwYkdWdVlXMWxQU0l2YldWa2FXRXZlWFZyYVc1dkwwUnZZM1Z0Wlc1MGN5OVhiM0pyY3k5UVlXbHVkSE12VjJGc2JIQmhjR1Z5Y3k5TFlYSmhjMkZ0WVVWblp5NXdibVVpQ2lBZ0lHbHVhM05qWVhCbE9tVjRjRzl5ZEMxNFpIQnBQU0k1TUNJS0lDQWdhVzVyYzJOaGNHVTZaWGh3YjNKMExYbGtjR2s5SWprd0lqNEtJQ0E4WkdWbWN3b2dJQ0FnSUdsa1BTSmtaV1p6TkNJZ0x6NEtJQ0E4YzI5a2FYQnZaR2s2Ym1GdFpXUjJhV1YzQ2lBZ0lDQWdhV1E5SW1KaGMyVWlDaUFnSUNBZ2NHRm5aV052Ykc5eVBTSWpOR1kxTVRjNElnb2dJQ0FnSUdKdmNtUmxjbU52Ykc5eVBTSWpOalkyTmpZMklnb2dJQ0FnSUdKdmNtUmxjbTl3WVdOcGRIazlJakV1TUNJS0lDQWdJQ0JwYm10elkyRndaVHB3WVdkbGIzQmhZMmwwZVQwaU1DSUtJQ0FnSUNCcGJtdHpZMkZ3WlRwd1lXZGxjMmhoWkc5M1BTSXlJZ29nSUNBZ0lHbHVhM05qWVhCbE9ucHZiMjA5SWpBdU16VXpOVFV6TXpraUNpQWdJQ0FnYVc1cmMyTmhjR1U2WTNnOUlqUXpOeTQwTXpReU9TSUtJQ0FnSUNCcGJtdHpZMkZ3WlRwamVUMGlNek16TGpBMU5UWTFJZ29nSUNBZ0lHbHVhM05qWVhCbE9tUnZZM1Z0Wlc1MExYVnVhWFJ6UFNKd2VDSUtJQ0FnSUNCcGJtdHpZMkZ3WlRwamRYSnlaVzUwTFd4aGVXVnlQU0pzWVhsbGNqRWlDaUFnSUNBZ2MyaHZkMmR5YVdROUltWmhiSE5sSWdvZ0lDQWdJSFZ1YVhSelBTSndlQ0lLSUNBZ0lDQmliM0prWlhKc1lYbGxjajBpWm1Gc2MyVWlDaUFnSUNBZ2FXNXJjMk5oY0dVNmMyaHZkM0JoWjJWemFHRmtiM2M5SW5SeWRXVWlDaUFnSUNBZ2FXNXJjMk5oY0dVNmQybHVaRzkzTFhkcFpIUm9QU0l4T1RJd0lnb2dJQ0FnSUdsdWEzTmpZWEJsT25kcGJtUnZkeTFvWldsbmFIUTlJakV3TlRJaUNpQWdJQ0FnYVc1cmMyTmhjR1U2ZDJsdVpHOTNMWGc5SWpFNU1qQWlDaUFnSUNBZ2FXNXJjMk5oY0dVNmQybHVaRzkzTFhrOUlqVTVOU0lLSUNBZ0lDQnBibXR6WTJGd1pUcDNhVzVrYjNjdGJXRjRhVzFwZW1Wa1BTSXhJZ29nSUNBZ0lITm9iM2RuZFdsa1pYTTlJblJ5ZFdVaUNpQWdJQ0FnYVc1cmMyTmhjR1U2WjNWcFpHVXRZbUp2ZUQwaWRISjFaU0krQ2lBZ0lDQThjMjlrYVhCdlpHazZaM1ZwWkdVS0lDQWdJQ0FnSUhCdmMybDBhVzl1UFNJNU5qQXNNVEUzTmk0MUlnb2dJQ0FnSUNBZ2IzSnBaVzUwWVhScGIyNDlJakVzTUNJS0lDQWdJQ0FnSUdsa1BTSm5kV2xrWlRReE5UQWlJQzgrQ2lBZ0lDQThjMjlrYVhCdlpHazZaM1ZwWkdVS0lDQWdJQ0FnSUhCdmMybDBhVzl1UFNJdE1USTFOUzR4T0RjMUxEVTBNQ0lLSUNBZ0lDQWdJRzl5YVdWdWRHRjBhVzl1UFNJd0xERWlDaUFnSUNBZ0lDQnBaRDBpWjNWcFpHVTBNVFV5SWlBdlBnb2dJRHd2YzI5a2FYQnZaR2s2Ym1GdFpXUjJhV1YzUGdvZ0lEeHRaWFJoWkdGMFlRb2dJQ0FnSUdsa1BTSnRaWFJoWkdGMFlUY2lQZ29nSUNBZ1BISmtaanBTUkVZK0NpQWdJQ0FnSUR4all6cFhiM0pyQ2lBZ0lDQWdJQ0FnSUhKa1pqcGhZbTkxZEQwaUlqNEtJQ0FnSUNBZ0lDQThaR002Wm05eWJXRjBQbWx0WVdkbEwzTjJaeXQ0Yld3OEwyUmpPbVp2Y20xaGRENEtJQ0FnSUNBZ0lDQThaR002ZEhsd1pRb2dJQ0FnSUNBZ0lDQWdJSEprWmpweVpYTnZkWEpqWlQwaWFIUjBjRG92TDNCMWNtd3ViM0puTDJSakwyUmpiV2wwZVhCbEwxTjBhV3hzU1cxaFoyVWlJQzgrQ2lBZ0lDQWdJQ0FnUEdSak9uUnBkR3hsUGp3dlpHTTZkR2wwYkdVK0NpQWdJQ0FnSUR3dlkyTTZWMjl5YXo0S0lDQWdJRHd2Y21SbU9sSkVSajRLSUNBOEwyMWxkR0ZrWVhSaFBnb2dJRHhuQ2lBZ0lDQWdhVzVyYzJOaGNHVTZiR0ZpWld3OUlreGhlV1Z5SURFaUNpQWdJQ0FnYVc1cmMyTmhjR1U2WjNKdmRYQnRiMlJsUFNKc1lYbGxjaUlLSUNBZ0lDQnBaRDBpYkdGNVpYSXhJZ29nSUNBZ0lIUnlZVzV6Wm05eWJUMGlkSEpoYm5Oc1lYUmxLREFzTWpjdU5qTTNPREE0S1NJK0NpQWdJQ0E4WndvZ0lDQWdJQ0FnYVdROUltYzFOVEUySWdvZ0lDQWdJQ0FnZEhKaGJuTm1iM0p0UFNKdFlYUnlhWGdvTUM0NU1UUTRORFkzTXl3d0xEQXNNQzQ1TVRRNE5EWTNNeXc1TkM0ME1qZzRNeXc1TVM0eE1EWTFOalFwSWo0S0lDQWdJQ0FnUEhCaGRHZ0tJQ0FnSUNBZ0lDQWdjMjlrYVhCdlpHazZibTlrWlhSNWNHVnpQU0pqYzNOalkzTnpjM056YzNOall5SUtJQ0FnSUNBZ0lDQWdhVzVyYzJOaGNHVTZZMjl1Ym1WamRHOXlMV04xY25aaGRIVnlaVDBpTUNJS0lDQWdJQ0FnSUNBZ1pEMGliU0F4TXpJNUxqa3hNVGNzTmpRd0xqWXhPVGN6SUdNZ05qQXVPRFkyTWl3ME9DNHpNVEF6TVNBME9TNDVPVFUzTERFeE5pNHdNVEExTnlBdE1TNHdOakUwTERFME1DNDJOVGc0TWlBdE55NHlOU3d6TGpVZ0xUUTNMalEzTlRJc01UZ3VOamN4TURVZ0xUazFMamsxTmpJc09DNHhPVGMzTVNBdE16Y3VOalEwT0N3dE9DNHhNekkwTVNBdE5EQXVOVFV6TWl3dE1UTXVOelkxTnpjZ0xUY3hMams0TVRVc0xURTBMall3TVRjMklDMDVMalkyTVRVc01DNHdPVFkySUMweE55NHhPRFU0TERFdU1UQTROaUF0TWpVdU5UTXlOeXd6TGprMU1UVWdMVFE0TGprM056TXNNVFV1T1RneE16UWdMVEV6TlM0eE5UY3NNemd1TnpnME9UWWdMVEU0T1M0d01EYzFPQ3d6T0M0M09EUTVOaUF0TVRFd0xqRXpNRGd5TERBZ0xUSXlNQzR4TWpNekxDMHpOUzR6TWpBM05TQXRNamszTGprNU56VTFMQzA1T0M0eE9USXdPU0F0TnpjdU9EYzBNalVzTFRZeUxqZzNNVE0xSUMweE1qRXVOakl6TlRVc0xURTBPQzR4TkRNeE9TQXRNVEl4TGpZeU16VTFMQzB5TXpjdU1EVTJOamtnTUN3dE9EZ3VPVEV6TlNBME15NDNORGt6TEMweE56UXVNVGcxTXpRZ01USXhMall5TXpVMUxDMHlNemN1TURVMk5qZ2dOemN1T0RjME1qWXNMVFl5TGpnM01UTTFJREU0Tnk0NE5qWTNNeXd0T1RndU1Ua3lNU0F5T1RjdU9UazNOVFVzTFRrNExqRTVNakVnTVRFd0xqRXpNRGM0TERBZ01qRXhMak0zT0RZNExETTFMak15TURjMUlESTRPUzR5TlRJNE9DdzVPQzR4T1RJd09TQTNOeTQ0TnpRekxEWXlMamczTVRNMElERXlNUzQyTWpNMkxERTBPQzR4TkRNeE9DQXhNakV1TmpJek5pd3lNemN1TURVMk5qa2dNQ3cxTWk0ME16QTVJQzAwTGpZeU56RXNOamt1T0RBMk9USWdMVE16TGpBM09UTXNNVEUxTGpnMU9EY3hJQzA1TGpRME9UY3NNVGd1TVRFMU1qY2dMVGN1TWpJMExETXlMakF3T1RjMUlEVXVOelF5TWl3ME1pNHpPVGc0TkNCNklnb2dJQ0FnSUNBZ0lDQnpkSGxzWlQwaVptbHNiRG9qWmpWa09HTXdPMlpwYkd3dGIzQmhZMmwwZVRveE8yWnBiR3d0Y25Wc1pUcHViMjU2WlhKdk8zTjBjbTlyWlRvak5HVTBZell4TzNOMGNtOXJaUzEzYVdSMGFEb3pPM04wY205clpTMXNhVzVsWTJGd09uSnZkVzVrTzNOMGNtOXJaUzFzYVc1bGFtOXBianB5YjNWdVpEdHpkSEp2YTJVdGJXbDBaWEpzYVcxcGREbzBPM04wY205clpTMWtZWE5vWVhKeVlYazZibTl1WlR0emRISnZhMlV0YjNCaFkybDBlVG94SWdvZ0lDQWdJQ0FnSUNCcFpEMGljR0YwYURRMU1qQXROU0lnTHo0S0lDQWdJQ0FnUEhCaGRHZ0tJQ0FnSUNBZ0lDQWdjMjlrYVhCdlpHazZibTlrWlhSNWNHVnpQU0pqYzNOelkzTnpjM056YzNOall5SUtJQ0FnSUNBZ0lDQWdhVzVyYzJOaGNHVTZZMjl1Ym1WamRHOXlMV04xY25aaGRIVnlaVDBpTUNJS0lDQWdJQ0FnSUNBZ1pEMGliU0F4TXpJM0xqazFOVFVzTmpReExqQTBNREExSUdNZ05UUXVORGcxTVN3ME1pNDBOekl4T0NBMU1DNHlOREk0TERrM0xqWTRNek0wSUMweExqWXpOVFVzTVRJeExqSXpPRFV4SUMwM0xqSTVPRGNzTXk0ek1UTTVNeUF0TkRjdU1qSXlNaXd4Tmk0ME9EUTRPU0F0T1RVdU5EUTFMRFl1TURFeE5UVWdMVE0zTGpRME5ESXNMVGd1TVRNeU5ERWdMVFV4TGpjd01pd3RNVGd1TkRFMU56TWdMVGMxTGpNd01EY3NMVEUyTGpnNU1UUWdMVFV1TVRRNE5pd3dMak16TWpVM0lDMHhNQzQxTURrM0xEQXVOekl5TVRNZ0xURXpMamswTXl3eUxqQXlPRGtnTFRRNExqY3hOalFzTVRVdU9UZ3hNelFnTFRFME1pNHhOalEyT0N3ME1pNDVPVGN5SUMweE9UVXVOekk0TkRNc05ESXVPVGszTWlBdE1UQTVMalUwTkRFekxEQWdMVEl5TlM0NU5USTNOeXd0TkRVdU1qRXlOVFVnTFRJNU5pNDBNek16TkN3dE9UWXVNREExT1RNZ1F5QTFOelV1TmpZMk1TdzJORGN1TWpNd09ERWdOVEk0TGpRNU16ZzVMRFUwTWk0MU1UZ3hNaUExTWpndU5Ea3pPRGtzTkRnekxqTTJNakU1SUdNZ01Dd3RPRGd1T1RFek5TQTBNeTQxTVRZeU5Dd3RNVGMwTGpFNE5UTTBJREV5TUM0NU56VTJOQ3d0TWpNM0xqQTFOalkzSURjM0xqUTFPVFFzTFRZeUxqZzNNVE0xSURFNE5pNDRPRGt5TVN3dE9UZ3VNVGt5TVNBeU9UWXVORE16TXpRc0xUazRMakU1TWpFZ01UQTVMalUwTkRFekxEQWdNakV3TGpJeU9UTXpMRE0xTGpNeU1EYzFJREk0Tnk0Mk9EZzNNeXc1T0M0eE9USXdPU0EzTnk0ME5UazBMRFl5TGpnM01UTXpJREV5TUM0NU56VTNMREUwT0M0eE5ETXhOeUF4TWpBdU9UYzFOeXd5TXpjdU1EVTJOamdnTUN3MU1pNDBNekE1SUMweE1DNDJNVFEwTERVekxqWXpNamNnTFRNNExqa3hOU3c1T1M0Mk9EUTBPU0F0TVRBdU9UYzBNaXd5TkM0Mk1EZzVNU0F0T0M0NE1qSTRMRE00TGpVek9EVXlJREV5TGpNd016SXNOVGN1T1Rrek16Y2dlaUlLSUNBZ0lDQWdJQ0FnYzNSNWJHVTlJbVpwYkd3NkkyWXpaakZsTlR0bWFXeHNMVzl3WVdOcGRIazZNVHRtYVd4c0xYSjFiR1U2Ym05dWVtVnlienR6ZEhKdmEyVTZJelJsTkdNMk1UdHpkSEp2YTJVdGQybGtkR2c2TUR0emRISnZhMlV0YkdsdVpXTmhjRHB5YjNWdVpEdHpkSEp2YTJVdGJHbHVaV3B2YVc0NmNtOTFibVE3YzNSeWIydGxMVzFwZEdWeWJHbHRhWFE2TkR0emRISnZhMlV0WkdGemFHRnljbUY1T201dmJtVTdjM1J5YjJ0bExXOXdZV05wZEhrNk1TSUtJQ0FnSUNBZ0lDQWdhV1E5SW5CaGRHZzBOVEl3TFRVdE15SWdMejRLSUNBZ0lEd3ZaejRLSUNBZ0lEeG5DaUFnSUNBZ0lDQnBaRDBpWnpVMU1USWlDaUFnSUNBZ0lDQjBjbUZ1YzJadmNtMDlJbTFoZEhKcGVDZ3dMamt4TkRnME5qY3pMREFzTUN3d0xqa3hORGcwTmpjekxEZzRMalU1T1RFekxEYzVMamM0TnpjNU1Ta2lQZ29nSUNBZ0lDQThaV3hzYVhCelpRb2dJQ0FnSUNBZ0lDQnllVDBpTkRndU5ERTRPVEl5SWdvZ0lDQWdJQ0FnSUNCeWVEMGlOVEl1TmpZeE5UWTBJZ29nSUNBZ0lDQWdJQ0JqZVQwaU9EQTRMak13TmpJM0lnb2dJQ0FnSUNBZ0lDQmplRDBpTVRReU9TNHdOVGt5SWdvZ0lDQWdJQ0FnSUNCcFpEMGljR0YwYURRMU1qQWlDaUFnSUNBZ0lDQWdJSE4wZVd4bFBTSm1hV3hzT2lObU5XUTRZekE3Wm1sc2JDMXZjR0ZqYVhSNU9qRTdabWxzYkMxeWRXeGxPbTV2Ym5wbGNtODdjM1J5YjJ0bE9pTTBaVFJqTmpFN2MzUnliMnRsTFhkcFpIUm9Pak03YzNSeWIydGxMV3hwYm1WallYQTZjbTkxYm1RN2MzUnliMnRsTFd4cGJtVnFiMmx1T25KdmRXNWtPM04wY205clpTMXRhWFJsY214cGJXbDBPalE3YzNSeWIydGxMV1JoYzJoaGNuSmhlVHB1YjI1bE8zTjBjbTlyWlMxdmNHRmphWFI1T2pFaUlDOCtDaUFnSUNBZ0lEeHdZWFJvQ2lBZ0lDQWdJQ0FnSUhOdlpHbHdiMlJwT201dlpHVjBlWEJsY3owaWMzTnpjM01pQ2lBZ0lDQWdJQ0FnSUdsdWEzTmpZWEJsT21OdmJtNWxZM1J2Y2kxamRYSjJZWFIxY21VOUlqQWlDaUFnSUNBZ0lDQWdJR2xrUFNKd1lYUm9ORFV5TUMwMU5pSUtJQ0FnSUNBZ0lDQWdaRDBpYlNBeE5EYzVMak13T0N3NE1EWXVPVGMyTXpZZ1l5QXdMREkxTGpJMU1URXpJQzB5TWk0ME9Ea3lMRE14TGpRek5ESTBJQzAxTUM0eU16QTVMRE14TGpRek5ESXlJQzB5Tnk0M05ERTNMREpsTFRVZ0xUVXdMakl6TURrc0xUWXVNVGd6TURrZ0xUVXdMakl6TURrc0xUTXhMalF6TkRJeUlEQXNMVEkxTGpJMU1URXlJREl5TGpRNE9USXNMVFExTGpjeU1USWdOVEF1TWpNd09Td3RORFV1TnpJeE1UZ2dNamN1TnpReE55d3RNbVV0TlNBMU1DNHlNekE1TERJd0xqUTNNREEySURVd0xqSXpNRGtzTkRVdU56SXhNVGdnZWlJS0lDQWdJQ0FnSUNBZ2MzUjViR1U5SW05d1lXTnBkSGs2TVR0bWFXeHNPaU5tTTJZeFpUVTdabWxzYkMxdmNHRmphWFI1T2pFN1ptbHNiQzF5ZFd4bE9tNXZibnBsY204N2MzUnliMnRsT2lNMFpUUmpOakU3YzNSeWIydGxMWGRwWkhSb09qQTdjM1J5YjJ0bExXeHBibVZqWVhBNmNtOTFibVE3YzNSeWIydGxMV3hwYm1WcWIybHVPbkp2ZFc1a08zTjBjbTlyWlMxdGFYUmxjbXhwYldsME9qUTdjM1J5YjJ0bExXUmhjMmhoY25KaGVUcHViMjVsTzNOMGNtOXJaUzF2Y0dGamFYUjVPakVpSUM4K0NpQWdJQ0E4TDJjK0NpQWdQQzluUGdvOEwzTjJaejRLJzsgZXhwb3J0IGRlZmF1bHQgaW1nOyIsInZhciBpbWcgPSBuZXcgSW1hZ2UoKTsgaW1nLnNyYyA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFBEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0Nqd2hMUzBnUTNKbFlYUmxaQ0IzYVhSb0lFbHVhM05qWVhCbElDaG9kSFJ3T2k4dmQzZDNMbWx1YTNOallYQmxMbTl5Wnk4cElDMHRQZ29LUEhOMlp3b2dJQ0I0Yld4dWN6cGtZejBpYUhSMGNEb3ZMM0IxY213dWIzSm5MMlJqTDJWc1pXMWxiblJ6THpFdU1TOGlDaUFnSUhodGJHNXpPbU5qUFNKb2RIUndPaTh2WTNKbFlYUnBkbVZqYjIxdGIyNXpMbTl5Wnk5dWN5TWlDaUFnSUhodGJHNXpPbkprWmowaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1UazVPUzh3TWk4eU1pMXlaR1l0YzNsdWRHRjRMVzV6SXlJS0lDQWdlRzFzYm5NNmMzWm5QU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh5TURBd0wzTjJaeUlLSUNBZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWdvZ0lDQjRiV3h1Y3pwemIyUnBjRzlrYVQwaWFIUjBjRG92TDNOdlpHbHdiMlJwTG5OdmRYSmpaV1p2Y21kbExtNWxkQzlFVkVRdmMyOWthWEJ2WkdrdE1DNWtkR1FpQ2lBZ0lIaHRiRzV6T21sdWEzTmpZWEJsUFNKb2RIUndPaTh2ZDNkM0xtbHVhM05qWVhCbExtOXlaeTl1WVcxbGMzQmhZMlZ6TDJsdWEzTmpZWEJsSWdvZ0lDQjNhV1IwYUQwaU1Ua3lNQ0lLSUNBZ2FHVnBaMmgwUFNJeE1EZ3dJZ29nSUNCMmFXVjNRbTk0UFNJd0lEQWdNVGt5TUNBeE1EZ3dJZ29nSUNCcFpEMGljM1puTWlJS0lDQWdkbVZ5YzJsdmJqMGlNUzR4SWdvZ0lDQnBibXR6WTJGd1pUcDJaWEp6YVc5dVBTSXdMamt4SUhJeE16Y3lOU0lLSUNBZ2MyOWthWEJ2WkdrNlpHOWpibUZ0WlQwaVpXZG5MV052Y21VdWMzWm5JZ29nSUNCcGJtdHpZMkZ3WlRwbGVIQnZjblF0Wm1sc1pXNWhiV1U5SWk5dFpXUnBZUzk1ZFd0cGJtOHZSRzlqZFcxbGJuUnpMMWR2Y210ekwxQmhhVzUwY3k5WFlXeHNjR0Z3WlhKekwwdGhjbUZ6WVcxaFJXZG5MbkJ1WlNJS0lDQWdhVzVyYzJOaGNHVTZaWGh3YjNKMExYaGtjR2s5SWprd0lnb2dJQ0JwYm10elkyRndaVHBsZUhCdmNuUXRlV1J3YVQwaU9UQWlQZ29nSUR4a1pXWnpDaUFnSUNBZ2FXUTlJbVJsWm5NMElqNEtJQ0FnSUR4bWFXeDBaWElLSUNBZ0lDQWdJR2x1YTNOallYQmxPbU52Ykd4bFkzUTlJbUZzZDJGNWN5SUtJQ0FnSUNBZ0lITjBlV3hsUFNKamIyeHZjaTFwYm5SbGNuQnZiR0YwYVc5dUxXWnBiSFJsY25NNmMxSkhRaUlLSUNBZ0lDQWdJR2xrUFNKbWFXeDBaWEkxTkRZeklnb2dJQ0FnSUNBZ2VEMGlMVEF1TVRnd01USTNOaUlLSUNBZ0lDQWdJSGRwWkhSb1BTSXhMak0yTURJMU5USWlDaUFnSUNBZ0lDQjVQU0l0TUM0eE9EQXhNamMySWdvZ0lDQWdJQ0FnYUdWcFoyaDBQU0l4TGpNMk1ESTFOVElpUGdvZ0lDQWdJQ0E4Wm1WSFlYVnpjMmxoYmtKc2RYSUtJQ0FnSUNBZ0lDQWdhVzVyYzJOaGNHVTZZMjlzYkdWamREMGlZV3gzWVhseklnb2dJQ0FnSUNBZ0lDQnpkR1JFWlhacFlYUnBiMjQ5SWpFNExqUXhOekk0TlNJS0lDQWdJQ0FnSUNBZ2FXUTlJbVpsUjJGMWMzTnBZVzVDYkhWeU5UUTJOU0lnTHo0S0lDQWdJRHd2Wm1sc2RHVnlQZ29nSUR3dlpHVm1jejRLSUNBOGMyOWthWEJ2WkdrNmJtRnRaV1IyYVdWM0NpQWdJQ0FnYVdROUltSmhjMlVpQ2lBZ0lDQWdjR0ZuWldOdmJHOXlQU0lqTkdZMU1UYzRJZ29nSUNBZ0lHSnZjbVJsY21OdmJHOXlQU0lqTmpZMk5qWTJJZ29nSUNBZ0lHSnZjbVJsY205d1lXTnBkSGs5SWpFdU1DSUtJQ0FnSUNCcGJtdHpZMkZ3WlRwd1lXZGxiM0JoWTJsMGVUMGlNQ0lLSUNBZ0lDQnBibXR6WTJGd1pUcHdZV2RsYzJoaFpHOTNQU0l5SWdvZ0lDQWdJR2x1YTNOallYQmxPbnB2YjIwOUlqQXVNelV6TlRVek16a2lDaUFnSUNBZ2FXNXJjMk5oY0dVNlkzZzlJalF6Tnk0ME16UXlPU0lLSUNBZ0lDQnBibXR6WTJGd1pUcGplVDBpTXpNekxqQTFOVFkxSWdvZ0lDQWdJR2x1YTNOallYQmxPbVJ2WTNWdFpXNTBMWFZ1YVhSelBTSndlQ0lLSUNBZ0lDQnBibXR6WTJGd1pUcGpkWEp5Wlc1MExXeGhlV1Z5UFNKc1lYbGxjakVpQ2lBZ0lDQWdjMmh2ZDJkeWFXUTlJbVpoYkhObElnb2dJQ0FnSUhWdWFYUnpQU0p3ZUNJS0lDQWdJQ0JpYjNKa1pYSnNZWGxsY2owaVptRnNjMlVpQ2lBZ0lDQWdhVzVyYzJOaGNHVTZjMmh2ZDNCaFoyVnphR0ZrYjNjOUluUnlkV1VpQ2lBZ0lDQWdhVzVyYzJOaGNHVTZkMmx1Wkc5M0xYZHBaSFJvUFNJeE9USXdJZ29nSUNBZ0lHbHVhM05qWVhCbE9uZHBibVJ2ZHkxb1pXbG5hSFE5SWpFd05USWlDaUFnSUNBZ2FXNXJjMk5oY0dVNmQybHVaRzkzTFhnOUlqRTVNakFpQ2lBZ0lDQWdhVzVyYzJOaGNHVTZkMmx1Wkc5M0xYazlJalU1TlNJS0lDQWdJQ0JwYm10elkyRndaVHAzYVc1a2IzY3RiV0Y0YVcxcGVtVmtQU0l4SWdvZ0lDQWdJSE5vYjNkbmRXbGtaWE05SW5SeWRXVWlDaUFnSUNBZ2FXNXJjMk5oY0dVNlozVnBaR1V0WW1KdmVEMGlkSEoxWlNJK0NpQWdJQ0E4YzI5a2FYQnZaR2s2WjNWcFpHVUtJQ0FnSUNBZ0lIQnZjMmwwYVc5dVBTSTVOakFzTVRFM05pNDFJZ29nSUNBZ0lDQWdiM0pwWlc1MFlYUnBiMjQ5SWpFc01DSUtJQ0FnSUNBZ0lHbGtQU0puZFdsa1pUUXhOVEFpSUM4K0NpQWdJQ0E4YzI5a2FYQnZaR2s2WjNWcFpHVUtJQ0FnSUNBZ0lIQnZjMmwwYVc5dVBTSXRNVEkxTlM0eE9EYzFMRFUwTUNJS0lDQWdJQ0FnSUc5eWFXVnVkR0YwYVc5dVBTSXdMREVpQ2lBZ0lDQWdJQ0JwWkQwaVozVnBaR1UwTVRVeUlpQXZQZ29nSUR3dmMyOWthWEJ2WkdrNmJtRnRaV1IyYVdWM1Bnb2dJRHh0WlhSaFpHRjBZUW9nSUNBZ0lHbGtQU0p0WlhSaFpHRjBZVGNpUGdvZ0lDQWdQSEprWmpwU1JFWStDaUFnSUNBZ0lEeGpZenBYYjNKckNpQWdJQ0FnSUNBZ0lISmtaanBoWW05MWREMGlJajRLSUNBZ0lDQWdJQ0E4WkdNNlptOXliV0YwUG1sdFlXZGxMM04yWnl0NGJXdzhMMlJqT21admNtMWhkRDRLSUNBZ0lDQWdJQ0E4WkdNNmRIbHdaUW9nSUNBZ0lDQWdJQ0FnSUhKa1pqcHlaWE52ZFhKalpUMGlhSFIwY0RvdkwzQjFjbXd1YjNKbkwyUmpMMlJqYldsMGVYQmxMMU4wYVd4c1NXMWhaMlVpSUM4K0NpQWdJQ0FnSUNBZ1BHUmpPblJwZEd4bFBqd3ZaR002ZEdsMGJHVStDaUFnSUNBZ0lEd3ZZMk02VjI5eWF6NEtJQ0FnSUR3dmNtUm1PbEpFUmo0S0lDQThMMjFsZEdGa1lYUmhQZ29nSUR4bkNpQWdJQ0FnYVc1cmMyTmhjR1U2YkdGaVpXdzlJa3hoZVdWeUlERWlDaUFnSUNBZ2FXNXJjMk5oY0dVNlozSnZkWEJ0YjJSbFBTSnNZWGxsY2lJS0lDQWdJQ0JwWkQwaWJHRjVaWEl4SWdvZ0lDQWdJSFJ5WVc1elptOXliVDBpZEhKaGJuTnNZWFJsS0RBc01qY3VOak0zT0RBNEtTSStDaUFnSUNBOFp3b2dJQ0FnSUNBZ2FXUTlJbWMxTkRrMklnb2dJQ0FnSUNBZ2RISmhibk5tYjNKdFBTSnRZWFJ5YVhnb01DNDVNVFE0TkRZM015d3dMREFzTUM0NU1UUTRORFkzTXl3NE55NDJPRFF5T1N3MU9TNDBPREUxTURrcElnb2dJQ0FnSUNBZ2FXNXJjMk5oY0dVNlpYaHdiM0owTFhoa2NHazlJamt3SWdvZ0lDQWdJQ0FnYVc1cmMyTmhjR1U2Wlhod2IzSjBMWGxrY0drOUlqa3dJajRLSUNBZ0lDQWdQR2NLSUNBZ0lDQWdJQ0FnZEhKaGJuTm1iM0p0UFNKMGNtRnVjMnhoZEdVb0xUSXlMRGdwSWdvZ0lDQWdJQ0FnSUNCcFpEMGlaelV5TVRBaVBnb2dJQ0FnSUNBZ0lEeGphWEpqYkdVS0lDQWdJQ0FnSUNBZ0lDQnpkSGxzWlQwaWIzQmhZMmwwZVRveE8yWnBiR3c2STJabVlqUXpaanRtYVd4c0xXOXdZV05wZEhrNk1UdG1hV3hzTFhKMWJHVTZibTl1ZW1WeWJ6dHpkSEp2YTJVNkl6UmxOR00yTVR0emRISnZhMlV0ZDJsa2RHZzZNRHR6ZEhKdmEyVXRiR2x1WldOaGNEcHliM1Z1WkR0emRISnZhMlV0YkdsdVpXcHZhVzQ2Y205MWJtUTdjM1J5YjJ0bExXMXBkR1Z5YkdsdGFYUTZORHR6ZEhKdmEyVXRaR0Z6YUdGeWNtRjVPbTV2Ym1VN2MzUnliMnRsTFc5d1lXTnBkSGs2TVNJS0lDQWdJQ0FnSUNBZ0lDQnBaRDBpY0dGMGFEUTFPRE1pQ2lBZ0lDQWdJQ0FnSUNBZ1kzZzlJamszTlNJS0lDQWdJQ0FnSUNBZ0lDQmplVDBpTkRjeExqTTJNakU0SWdvZ0lDQWdJQ0FnSUNBZ0lISTlJakUyTXlJZ0x6NEtJQ0FnSUNBZ0lDQThjR0YwYUFvZ0lDQWdJQ0FnSUNBZ0lITnZaR2x3YjJScE9tNXZaR1YwZVhCbGN6MGljM056YzNNaUNpQWdJQ0FnSUNBZ0lDQWdhVzVyYzJOaGNHVTZZMjl1Ym1WamRHOXlMV04xY25aaGRIVnlaVDBpTUNJS0lDQWdJQ0FnSUNBZ0lDQnBaRDBpY0dGMGFEUTFPRE10TWlJS0lDQWdJQ0FnSUNBZ0lDQmtQU0p0SURFeE16Z3NORGN4TGpNMk1qRTRJR01nTUN3NU1DNHdNakkwTVNBdE56SXVPVGMzTml3eE16Y2dMVEUyTXl3eE16Y2dMVGt3TGpBeU1qUXhMREFnTFRFMk15d3RORFl1T1RjM05Ua2dMVEUyTXl3dE1UTTNJREFzTFRrd0xqQXlNalF4SURjeUxqazNOelU1TEMweE5qTWdNVFl6TEMweE5qTWdPVEF1TURJeU5Dd3dJREUyTXl3M01pNDVOemMxT1NBeE5qTXNNVFl6SUhvaUNpQWdJQ0FnSUNBZ0lDQWdjM1I1YkdVOUltOXdZV05wZEhrNk1UdG1hV3hzT2lObU1XUTJOakU3Wm1sc2JDMXZjR0ZqYVhSNU9qRTdabWxzYkMxeWRXeGxPbTV2Ym5wbGNtODdjM1J5YjJ0bE9pTTBaVFJqTmpFN2MzUnliMnRsTFhkcFpIUm9PakE3YzNSeWIydGxMV3hwYm1WallYQTZjbTkxYm1RN2MzUnliMnRsTFd4cGJtVnFiMmx1T25KdmRXNWtPM04wY205clpTMXRhWFJsY214cGJXbDBPalE3YzNSeWIydGxMV1JoYzJoaGNuSmhlVHB1YjI1bE8zTjBjbTlyWlMxdmNHRmphWFI1T2pFaUlDOCtDaUFnSUNBZ0lEd3ZaejRLSUNBZ0lDQWdQR2NLSUNBZ0lDQWdJQ0FnYVdROUltYzFORGt3SWo0S0lDQWdJQ0FnSUNBOFkybHlZMnhsQ2lBZ0lDQWdJQ0FnSUNBZ2NqMGlNVEl5TGpZNU5Ea3lJZ29nSUNBZ0lDQWdJQ0FnSUdONVBTSTBOall1TVRjd05qVWlDaUFnSUNBZ0lDQWdJQ0FnWTNnOUlqazNOUzR4TURBeU9DSUtJQ0FnSUNBZ0lDQWdJQ0JwWkQwaWNHRjBhRFExT0RNdE1DSUtJQ0FnSUNBZ0lDQWdJQ0J6ZEhsc1pUMGliM0JoWTJsMGVUb3dMalUwTURBd01EQTFPMlpwYkd3NkkyWm1ZalF6Wmp0bWFXeHNMVzl3WVdOcGRIazZNVHRtYVd4c0xYSjFiR1U2Ym05dWVtVnlienR6ZEhKdmEyVTZJelJsTkdNMk1UdHpkSEp2YTJVdGQybGtkR2c2TUR0emRISnZhMlV0YkdsdVpXTmhjRHB5YjNWdVpEdHpkSEp2YTJVdGJHbHVaV3B2YVc0NmNtOTFibVE3YzNSeWIydGxMVzFwZEdWeWJHbHRhWFE2TkR0emRISnZhMlV0WkdGemFHRnljbUY1T201dmJtVTdjM1J5YjJ0bExXOXdZV05wZEhrNk1UdG1hV3gwWlhJNmRYSnNLQ05tYVd4MFpYSTFORFl6S1NJS0lDQWdJQ0FnSUNBZ0lDQjBjbUZ1YzJadmNtMDlJbTFoZEhKcGVDZ3hMakkzTVRJd056Z3NNQ3d3TERFdU1UYzRPVGszT0N3dE1qZzJMalExTkRnMExDMDNOUzQwTkRNMU1EVXBJaUF2UGdvZ0lDQWdJQ0FnSUR4bkNpQWdJQ0FnSUNBZ0lDQWdkSEpoYm5ObWIzSnRQU0p0WVhSeWFYZ29NQzQ1TmpJNE1Ua3hNU3d0TUM0eU56QXhORFk1TkN3d0xqSTNNREUwTmprMExEQXVPVFl5T0RFNU1URXNNekl5TGpVNE16Y3lMQzA0TGpnMU1EazVPRGtwSWdvZ0lDQWdJQ0FnSUNBZ0lHbGtQU0puTlRJeE1DMDVJZ29nSUNBZ0lDQWdJQ0FnSUdsdWEzTmpZWEJsT25SeVlXNXpabTl5YlMxalpXNTBaWEl0ZUQwaU9TNDFOelV6TlRrNElnb2dJQ0FnSUNBZ0lDQWdJR2x1YTNOallYQmxPblJ5WVc1elptOXliUzFqWlc1MFpYSXRlVDBpTFRFd09TNHdNak14TmlJK0NpQWdJQ0FnSUNBZ0lDQThjR0YwYUFvZ0lDQWdJQ0FnSUNBZ0lDQWdjM1I1YkdVOUltOXdZV05wZEhrNk1UdG1hV3hzT2lObU5XVXpPVE03Wm1sc2JDMXZjR0ZqYVhSNU9qRTdabWxzYkMxeWRXeGxPbTV2Ym5wbGNtODdjM1J5YjJ0bE9pTTBaVFJqTmpFN2MzUnliMnRsTFhkcFpIUm9PakE3YzNSeWIydGxMV3hwYm1WallYQTZjbTkxYm1RN2MzUnliMnRsTFd4cGJtVnFiMmx1T25KdmRXNWtPM04wY205clpTMXRhWFJsY214cGJXbDBPalE3YzNSeWIydGxMV1JoYzJoaGNuSmhlVHB1YjI1bE8zTjBjbTlyWlMxdmNHRmphWFI1T2pFaUNpQWdJQ0FnSUNBZ0lDQWdJQ0JrUFNKdElEVTJOaTQxTURBeE5DdzFNemN1TVRNeE5UVWdZeUF3TERJMExqTXdOakExSUMwME1DNHlOVGt6TVN3NExqazVJQzA0T1M0NU1qRTJOeXc0TGprNUlDMDBPUzQyTmpJek55d3dJQzA0T1M0NU1qRTJOeXd4TlM0ek1UWXdOU0F0T0RrdU9USXhOamNzTFRndU9Ua2dNQ3d0TWpRdU16QTJNRFlnTkRBdU1qVTVNeXd0TkRRdU1ERWdPRGt1T1RJeE5qY3NMVFEwTGpBeElEUTVMalkyTWpNMkxEQWdPRGt1T1RJeE5qY3NNVGt1TnpBek9UUWdPRGt1T1RJeE5qY3NORFF1TURFZ2VpSUtJQ0FnSUNBZ0lDQWdJQ0FnSUdsa1BTSndZWFJvTkRVNE15MHlMVFlpQ2lBZ0lDQWdJQ0FnSUNBZ0lDQnBibXR6WTJGd1pUcGpiMjV1WldOMGIzSXRZM1Z5ZG1GMGRYSmxQU0l3SWdvZ0lDQWdJQ0FnSUNBZ0lDQWdjMjlrYVhCdlpHazZibTlrWlhSNWNHVnpQU0p6YzNOemN5SWdMejRLSUNBZ0lDQWdJQ0FnSUR4bGJHeHBjSE5sQ2lBZ0lDQWdJQ0FnSUNBZ0lDQnpkSGxzWlQwaWIzQmhZMmwwZVRveE8yWnBiR3c2STJZMVpUTTVNenRtYVd4c0xXOXdZV05wZEhrNk1UdG1hV3hzTFhKMWJHVTZibTl1ZW1WeWJ6dHpkSEp2YTJVNkl6UmxOR00yTVR0emRISnZhMlV0ZDJsa2RHZzZNRHR6ZEhKdmEyVXRiR2x1WldOaGNEcHliM1Z1WkR0emRISnZhMlV0YkdsdVpXcHZhVzQ2Y205MWJtUTdjM1J5YjJ0bExXMXBkR1Z5YkdsdGFYUTZORHR6ZEhKdmEyVXRaR0Z6YUdGeWNtRjVPbTV2Ym1VN2MzUnliMnRsTFc5d1lXTnBkSGs2TVNJS0lDQWdJQ0FnSUNBZ0lDQWdJR2xrUFNKd1lYUm9OVFE0T0NJS0lDQWdJQ0FnSUNBZ0lDQWdJR040UFNJM09UTXVNVGs0TnpraUNpQWdJQ0FnSUNBZ0lDQWdJQ0JqZVQwaU1UVTFMalk1TmpJeklnb2dJQ0FnSUNBZ0lDQWdJQ0FnY25nOUlqRXpMalV3TURBd01pSUtJQ0FnSUNBZ0lDQWdJQ0FnSUhKNVBTSXhNaTR5TlRBd01ESWlDaUFnSUNBZ0lDQWdJQ0FnSUNCMGNtRnVjMlp2Y20wOUltMWhkSEpwZUNnd0xqZzBNelk0TnpjMUxEQXVOVE0yT0RNME1qSXNMVEF1TlRNMk9ETTBNaklzTUM0NE5ETTJPRGMzTlN3d0xEQXBJaUF2UGdvZ0lDQWdJQ0FnSUR3dlp6NEtJQ0FnSUNBZ1BDOW5QZ29nSUNBZ1BDOW5QZ29nSUR3dlp6NEtQQzl6ZG1jK0NnPT0nOyBleHBvcnQgZGVmYXVsdCBpbWc7IiwiLyogZ2xvYmFsIEFQUE5BTUUsIFZFUlNJT04gKi9cbid1c2Ugc3RyaWN0J1xuXG5pbXBvcnQgeyBpbmZvIH0gZnJvbSAnLi9kZWJ1Zy5qcydcblxuaW1wb3J0IGNvbnRlbnQgZnJvbSAnLi9tYWluLmh0bWwnXG5pbXBvcnQgZXcgZnJvbSAnLi9yZXMvZWdnLXcuc3ZnJ1xuaW1wb3J0IGV5IGZyb20gJy4vcmVzL2VnZy15LnN2ZydcbmltcG9ydCAnLi9zdHlsZS9zdHlsZS5jc3MnXG5cbi8vIFNldCBkZWZhdWx0IHByb3BlcnRpZXNcbmNvbnN0IHByb3BzID0ge1xuXHRmcHM6IDAsXG5cdHRnOiAwXG59XG5cbmNvbnN0ICQgPSBzZWxlY3RvciA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxuXG4vKiBCYXNlNjQgY29udmVyc2lvblxuKiogZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE2MjQ1NzY3L2NyZWF0aW5nLWEtYmxvYi1mcm9tLWEtYmFzZTY0LXN0cmluZy1pbi1qYXZhc2NyaXB0XG4qKiBtb2RpZmllZCBmb3IgYWN0dWFsIHVzYWdlXG4qL1xuLy8gY29uc3QgYjY0dG9CbG9iVXJsID0gKGI2NFN0ciwgc2xpY2VTaXplID0gNTEyKSA9PiB7XG4vLyBcdGNvbnN0IFt0eXBlLCBiNjREYXRhXSA9IGI2NFN0ci5zcGxpdCgnLCcpLFxuLy8gXHRcdGNvbnRlbnRUeXBlID0gdHlwZS5zcGxpdCgnOicpWzFdLnNwbGl0KCc7JylbMF0sXG4vLyBcdFx0Ynl0ZUNoYXJhY3RlcnMgPSBhdG9iKGI2NERhdGEpLFxuLy8gXHRcdGJ5dGVBcnJheXMgPSBbXVxuXG4vLyBcdGZvciAobGV0IG9mZnNldCA9IDA7IG9mZnNldCA8IGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aDsgb2Zmc2V0ICs9IHNsaWNlU2l6ZSkge1xuLy8gXHRcdGNvbnN0IHNsaWNlID0gYnl0ZUNoYXJhY3RlcnMuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBzbGljZVNpemUpXG5cbi8vIFx0XHRjb25zdCBieXRlTnVtYmVycyA9IG5ldyBBcnJheShzbGljZS5sZW5ndGgpXG4vLyBcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzbGljZS5sZW5ndGg7IGkrKykge1xuLy8gXHRcdFx0Ynl0ZU51bWJlcnNbaV0gPSBzbGljZS5jaGFyQ29kZUF0KGkpXG4vLyBcdFx0fVxuXG4vLyBcdFx0Y29uc3QgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZU51bWJlcnMpXG4vLyBcdFx0Ynl0ZUFycmF5cy5wdXNoKGJ5dGVBcnJheSlcbi8vIFx0fVxuXG4vLyBcdGNvbnN0IGJsb2IgPSBuZXcgQmxvYihieXRlQXJyYXlzLCB7dHlwZTogY29udGVudFR5cGV9KVxuLy8gXHRyZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKVxuLy8gfVxuXG4vLyBHZXQgaW1hZ2VzIGZyb20gYmFzZTY0IGRhdGFcbi8vIGNvbnN0IGVnZ3cgPSBiNjR0b0Jsb2JVcmwoZXcuc3JjKSxcbi8vIFx0ZWdneSA9IGI2NHRvQmxvYlVybChleS5zcmMpXG5cbi8vIEhhbmRsZSB1c2VyIHByb3BlcnRpZXNcbndpbmRvdy53YWxscGFwZXJQcm9wZXJ0eUxpc3RlbmVyID0ge1xuXHRhcHBseUdlbmVyYWxQcm9wZXJ0aWVzKHVwKSB7XG5cdFx0aWYgKHVwLmZwcykge1xuXHRcdFx0cHJvcHMuZnBzID0gdXAuZnBzXG5cdFx0XHRwcm9wcy50ZyA9IDEwMDAgLyB1cC5mcHNcblx0XHRcdGluZm8oJ0ZQUyBsaW1pdGF0aW9uIHVwZGF0ZWQsIGN1cnJlbnQgRlBTIGxpbWl0YXRpb24gaXMnLCBwcm9wcy5mcHMsICd0aW1lZ2FwIGlzJywgcHJvcHMudGcpXG5cdFx0fVxuXHR9XG59XG5cbmNvbnN0IGluaXQgPSAoKSA9PiB7XG5cdC8vIFJlbW92ZSB0aGUgaW5pdCBsaXN0ZW5lclxuXHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgaW5pdCwgZmFsc2UpXG5cblx0Ly8gUHJlcGFyZSB0aGUgZnJ5aW5nIHBhblxuXHQvLyBjb25zdCBwYW4gPSAkLnEoJ2JvZHknKVxuXHQvLyBwYW4uJGVsLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGNvbnRlbnQpXG5cdCQoJ2JvZHknKS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBjb250ZW50KVxuXHRjb25zdCBwciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG5cdFx0YyA9ICQoJy5lZ2cnKSxcblx0XHR3VyA9IHdpbmRvdy5pbm5lcldpZHRoLFxuXHRcdHdIID0gd2luZG93LmlubmVySGVpZ2h0XG5cdGxldCBiTCA9IDAsXG5cdFx0YlQgPSAwLFxuXHRcdGJTID0gMVxuXHRjLndpZHRoID0gd1cgKiBwclxuXHRjLmhlaWdodCA9IHdIICogcHJcblx0aWYgKHdXIC8gd0ggPiBldy53aWR0aCAvIGV3LmhlaWdodCkge1xuXHRcdGJTID0gd0ggLyBldy5oZWlnaHRcblx0XHRiTCA9ICh3VyAtIGJTICogZXcud2lkdGgpIC8gMlxuXHR9IGVsc2Uge1xuXHRcdGJTID0gd1cgLyBldy53aWR0aFxuXHRcdGJUID0gKHdIIC0gYlMgKiBldy5oZWlnaHQpIC8gMlxuXHR9XG5cblx0Y29uc3QgaVcgPSBldy53aWR0aCAqIGJTLFxuXHRcdGlIID0gZXcuaGVpZ2h0ICogYlNcblxuXHRjb25zdCBwYW4gPSBjLmdldENvbnRleHQoJzJkJylcblx0cGFuLnNjYWxlKHByLCBwcilcblxuXHRwYW4uZHJhd0ltYWdlKGV3LCBiTCwgYlQsIGlXLCBpSClcblx0cGFuLmRyYXdJbWFnZShleSwgYkwsIGJULCBpVywgaUgpXG5cblx0Ly8gU2V0IHRoZSBzdG9wIHBvaW50XG5cdGNvbnN0IHNwID0gMC4yXG5cblx0Ly8gSW5pdGlhbGl6ZSB2aXJhYmxlc1xuXHRsZXQgbW91c2VYID0gd2luZG93LmlubmVyV2lkdGggLyAyLFxuXHRcdG1vdXNlWSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIDIsXG5cdFx0ZnBzVGhyZXNob2xkID0gMCxcblx0XHRsYXN0ID0gMCxcblx0XHRkaWZmWCA9IDAsXG5cdFx0ZGlmZlkgPSAwLFxuXHRcdHdYID0gMCxcblx0XHR3WSA9IDAsXG5cdFx0eVggPSAwLFxuXHRcdHlZID0gMCxcblx0XHR3UyA9IDEsXG5cdFx0eVMgPSAxXG5cblx0Ly8gQXBwbHkgY2hhbmdlcyB0byB2aWV3XG5cdGNvbnN0IHVwZGF0ZSA9ICgpID0+IHtcblx0XHRjb25zdCB3ZFcgPSBpVyAqIHdTLFxuXHRcdFx0d2RIID0gaUggKiB3Uyxcblx0XHRcdHlkVyA9IGlXICogeVMsXG5cdFx0XHR5ZEggPSBpSCAqIHlTLFxuXHRcdFx0d3BMID0gKHdkVyAtIGlXKSAvIDIsXG5cdFx0XHR3cFQgPSAod2RIIC0gaUgpIC8gMixcblx0XHRcdHlwTCA9ICh5ZFcgLSBpVykgLyAyLFxuXHRcdFx0eXBUID0gKHlkSCAtIGlIKSAvIDJcblx0XHRwYW4uY2xlYXJSZWN0KDAsIDAsIGMud2lkdGgsIGMuaGVpZ2h0KVxuXHRcdHBhbi5kcmF3SW1hZ2UoZXcsIGJMICsgd1ggLSB3cEwsIGJUICsgd1kgLSB3cFQsIHdkVywgd2RIKVxuXHRcdHBhbi5kcmF3SW1hZ2UoZXksIGJMICsgeVggLSB5cEwsIGJUICsgeVkgLSB5cFQsIHlkVywgeWRIKVxuXHR9XG5cblx0Ly8gUGF1c2UgYW5pbWF0aW9uIHRvIHNhdmUgQ1BVIHdoZW4gbm90IGFjdGl2ZVxuXHRjb25zdCBwYXVzZSA9ICgpID0+IHtcblx0XHRmcHNUaHJlc2hvbGQgPSAwXG5cdFx0bGFzdCA9IDBcblx0XHRkaWZmWCA9IDBcblx0XHRkaWZmWSA9IDBcblx0XHR3WCA9IDBcblx0XHR3WSA9IDBcblx0XHR5WCA9IDBcblx0XHR5WSA9IDBcblx0XHR3UyA9IDFcblx0XHR5UyA9IDFcblx0XHR1cGRhdGUoKVxuXHRcdGluZm8oJ0FuaW1hdGlvbiBwYXVzZWQuJylcblx0fVxuXG5cdC8vIENhbGN1bGF0aW9uIG9uIGVhY2ggZnJhbWVcblx0Y29uc3QgdGljayA9ICgpID0+IHtcblx0XHRjb25zdCBtb3ZlWCA9IGRpZmZYIC8gMzAsXG5cdFx0XHRtb3ZlWSA9IGRpZmZZIC8gMzAsXG5cdFx0XHRub3cgPSBwZXJmb3JtYW5jZS5ub3coKSxcblx0XHRcdGR0ID0gbm93IC0gbGFzdFxuXHRcdGxhc3QgPSBub3dcblx0XHRkaWZmWCAtPSBtb3ZlWFxuXHRcdGRpZmZZIC09IG1vdmVZXG5cdFx0d1ggKz0gKG1vdmVYIC0gd1ggLyA0MCkgLyAyXG5cdFx0d1kgKz0gKG1vdmVZIC0gd1kgLyA0MCkgLyAyXG5cdFx0eVggKz0gKG1vdmVYIC0geVggLyAzMCkgLyAxLjUgKyAod1ggLSB5WCkgLyAzMFxuXHRcdHlZICs9IChtb3ZlWSAtIHlZIC8gMzApIC8gMS41ICsgKHdZIC0geVkpIC8gMzBcblxuXHRcdC8vIFN0YXJ0IE5leHQgdGlja1xuXHRcdGlmIChNYXRoLmFicyh3WCkgKyBNYXRoLmFicyh3WSkgKyBNYXRoLmFicyh5WCkgKyBNYXRoLmFicyh5WSkgPCBzcCAmJiB3UyArIHlTID09PSAyKSByZXR1cm4gcGF1c2UoKVxuXHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcblxuXHRcdC8vIExpbWl0IEZQU1xuXHRcdGlmIChwcm9wcy5mcHMgPiAwKSB7XG5cdFx0XHRmcHNUaHJlc2hvbGQgKz0gZHRcblx0XHRcdGlmIChmcHNUaHJlc2hvbGQgPiBwcm9wcy50ZykgZnBzVGhyZXNob2xkID0gcHJvcHMudGdcblx0XHRcdGlmIChmcHNUaHJlc2hvbGQgPCBwcm9wcy50ZykgcmV0dXJuXG5cdFx0XHRmcHNUaHJlc2hvbGQgLT0gcHJvcHMudGdcblx0XHR9XG5cblx0XHR1cGRhdGUoKVxuXHR9XG5cblx0Ly8gSGFuZGxlIGlmIHN0YXJ0IHRoZSBhbmltYXRpb25cblx0Y29uc3Qgc3RhcnQgPSAoKSA9PiB7XG5cdFx0aWYgKGxhc3QgIT09IDApIHJldHVyblxuXHRcdGxhc3QgPSBwZXJmb3JtYW5jZS5ub3coKVxuXHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljaylcblx0XHRpbmZvKCdBbmltYXRpb24gc3RhcnRlZC4nKVxuXHR9XG5cblx0Ly8gTGlzdGVuIG1vdXNlIG1vdmUgZXZlbnRzXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4ge1xuXHRcdGRpZmZYICs9IGUuY2xpZW50WCAtIG1vdXNlWFxuXHRcdGRpZmZZICs9IGUuY2xpZW50WSAtIG1vdXNlWVxuXHRcdG1vdXNlWCA9IGUuY2xpZW50WFxuXHRcdG1vdXNlWSA9IGUuY2xpZW50WVxuXG5cdFx0Ly8gU3RhcnQgYW5pbWF0aW9uXG5cdFx0c3RhcnQoKVxuXHR9KVxuXG5cdC8vIEhhbmRsZSBhdWRpbyBpbmZvIHVwZGF0ZXNcblx0Y29uc3QgYXVkaW9MaXN0ZW5lciA9IChhdWRpb0FycmF5KSA9PiB7XG5cdFx0Y29uc3QgZ2FwID0gYXVkaW9BcnJheS5sZW5ndGggLyA0XG5cdFx0bGV0IGxmID0gMCxcblx0XHRcdGhmID0gMFxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZ2FwOyBpKyspIHtcblx0XHRcdGxmICs9IGF1ZGlvQXJyYXlbaV0gKyBhdWRpb0FycmF5W2kgKyBnYXAgKiAyXVxuXHRcdFx0aGYgKz0gYXVkaW9BcnJheVtpICsgZ2FwXSArIGF1ZGlvQXJyYXlbaSArIGdhcCAqIDNdXG5cdFx0fVxuXHRcdHdTID0gMSArIChsZiAvIGdhcCkgLyAyXG5cdFx0eVMgPSAxICsgKGhmIC8gZ2FwKSAvIDJcblx0XHQvLyBTdGFydCBhbmltYXRpb25cblx0XHRzdGFydCgpXG5cdH1cblxuXHQvLyBMaXN0ZW4gYXVkaW8gdXBkYXRlc1xuXHR3aW5kb3cud2FsbHBhcGVyUmVnaXN0ZXJBdWRpb0xpc3RlbmVyKGF1ZGlvTGlzdGVuZXIpXG5cblx0aW5mbyhgJHtBUFBOQU1FfSB2JHtWRVJTSU9OfSBzdGFydGVkIWApXG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBpbml0LCBmYWxzZSlcbiJdLCJuYW1lcyI6WyJ0aGlzIiwiYXBwTmFtZSIsIkFQUE5BTUUiLCJsb2ciLCJjb25zb2xlIiwiYmluZCIsInRyYWNlIiwibG9nZ2VyIiwiZGVidWciLCJpbmZvIiwid2FybiIsImVycm9yIiwiRU5WIiwic2V0TGV2ZWwiLCJpbWciLCJJbWFnZSIsInNyYyIsInByb3BzIiwiJCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsInNlbGVjdG9yIiwid2luZG93Iiwid2FsbHBhcGVyUHJvcGVydHlMaXN0ZW5lciIsInVwIiwiZnBzIiwidGciLCJpbml0IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImluc2VydEFkamFjZW50SFRNTCIsImNvbnRlbnQiLCJwciIsImRldmljZVBpeGVsUmF0aW8iLCJjIiwid1ciLCJpbm5lcldpZHRoIiwid0giLCJpbm5lckhlaWdodCIsImJMIiwiYlQiLCJiUyIsIndpZHRoIiwiaGVpZ2h0IiwiZXciLCJpVyIsImlIIiwicGFuIiwiZ2V0Q29udGV4dCIsInNjYWxlIiwiZHJhd0ltYWdlIiwiZXkiLCJzcCIsIm1vdXNlWCIsIm1vdXNlWSIsImZwc1RocmVzaG9sZCIsImxhc3QiLCJkaWZmWCIsImRpZmZZIiwid1giLCJ3WSIsInlYIiwieVkiLCJ3UyIsInlTIiwidXBkYXRlIiwid2RXIiwid2RIIiwieWRXIiwieWRIIiwid3BMIiwid3BUIiwieXBMIiwieXBUIiwiY2xlYXJSZWN0IiwicGF1c2UiLCJ0aWNrIiwibW92ZVgiLCJtb3ZlWSIsIm5vdyIsInBlcmZvcm1hbmNlIiwiZHQiLCJNYXRoIiwiYWJzIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwic3RhcnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZSIsImNsaWVudFgiLCJjbGllbnRZIiwiYXVkaW9MaXN0ZW5lciIsImF1ZGlvQXJyYXkiLCJnYXAiLCJsZW5ndGgiLCJsZiIsImhmIiwiaSIsIndhbGxwYXBlclJlZ2lzdGVyQXVkaW9MaXN0ZW5lciIsIlZFUlNJT04iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU1BLENBQUMsVUFBVSxJQUFJLEVBQUUsVUFBVSxFQUFFO0lBQ3pCLFlBQVksQ0FBQztJQUNiLElBQUksT0FBTyxNQUFNLEtBQUssVUFBVSxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUU7UUFDNUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3RCLE1BQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNyRCxjQUFjLEdBQUcsVUFBVSxFQUFFLENBQUM7S0FDakMsTUFBTTtRQUNILElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBVSxFQUFFLENBQUM7S0FDM0I7Q0FDSixDQUFDQSxjQUFJLEVBQUUsWUFBWTtJQUNoQixZQUFZLENBQUM7SUFDYixJQUFJLElBQUksR0FBRyxXQUFXLEVBQUUsQ0FBQztJQUN6QixJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUM7O0lBRWhD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
