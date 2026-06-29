(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Owl = factory());
})(this, (function () { 'use strict';

  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : String(i);
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function getAugmentedNamespace(n) {
    if (n.__esModule) return n;
    var f = n.default;
  	if (typeof f == "function") {
  		var a = function a () {
  			if (this instanceof a) {
          return Reflect.construct(f, arguments, this.constructor);
  			}
  			return f.apply(this, arguments);
  		};
  		a.prototype = f.prototype;
    } else a = {};
    Object.defineProperty(a, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  var extend$5 = function extend(target, source) {
    var ret = {};
    if (target) {
      for (var key in target) {
        ret[key] = target[key];
      }
    }
    if (source) {
      for (var _key in source) {
        if (source.hasOwnProperty(_key) && source[_key] !== undefined) {
          ret[_key] = source[_key];
        }
      }
    }
    return ret;
  };

  /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise, SuppressedError, Symbol */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  function __rest(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
          t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
          for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
              if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
          }
      return t;
  }

  function __spreadArray(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
              if (!ar) ar = Array.prototype.slice.call(from, 0, i);
              ar[i] = from[i];
          }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
  }

  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
      var e = new Error(message);
      return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  /* eslint-disable prefer-rest-params */
  /* eslint-disable prefer-spread */
  var logger = {
      devMode: false,
      setDebug: function () {
          this.devMode = true;
      },
      ignore: function () {
          if (window.Owl && window.Owl.debugLog) {
              window.console.log('【OWL日志:】');
              window.console.log &&
                  window.console.log.apply(window.console, arguments);
          }
      },
      log: function () {
          var rest = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              rest[_i] = arguments[_i];
          }
          this.devMode && console.log.apply(console, __spreadArray(['[Owl]'], rest, false));
      },
      warn: function () {
          var rest = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              rest[_i] = arguments[_i];
          }
          this.devMode && console.warn.apply(console, __spreadArray(['[Owl]'], rest, false));
      },
      logScreen: function () {
          if (window.Owl && window.Owl.cfgManager.get('page').logFirstScreen) {
              console.log.apply(console, arguments);
          }
      },
  };

  var logger$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': logger
  });

  var require$$12 = /*@__PURE__*/getAugmentedNamespace(logger$1);

  var url = {
    stringify: function stringify(url, data) {
      if (!data) return url;
      var param = [];
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          param.push(key + '=' + data[key]);
        }
      }
      return ~url.indexOf('?') ? url + '&' + param.join('&') : url + '?' + param.join('&');
    },
    /**
     * @description:1. url中有name参数, value不为空, 更新参数
     * 2. url中有name参数, value为空, 删除参数
     * 3. url中无name参数, value不为空, 增加参数
     * @param {*} url
     * @param {*} name
     * @param {*} value
     * @return {*}
     */
    replaceParam: function replaceParam(url, name, value) {
      if (!url || !name) return url;
      try {
        var pattern = new RegExp('(&' + name + '=)' + '([^\\?&]+)(&?)'); // eg: /(&webVersion=)([^\?&]+)(&?)/
        if (pattern.test(url)) {
          if (value) {
            url = url.replace(pattern, '$1' + value + '$3');
          } else {
            url = url.replace(pattern, '$3');
          }
        } else if (value) {
          var temp = {};
          temp[name] = value;
          url = this.stringify(url, temp);
        }
      } catch (e) {}
      return url;
    }
  };

  function S4() {
    return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
  }
  function guid$2() {
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + Date.now();
  }
  var pageid = guid$2;

  var version$1 = '1.13.5'; // 利用字符串包裹防止报错

  var version$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    version: version$1
  });

  var require$$17 = /*@__PURE__*/getAugmentedNamespace(version$2);

  var protocol$2 = window.location.protocol ? window.location.protocol : 'http:';
  protocol$2 = new RegExp('http').test(protocol$2) ? protocol$2 : 'http:';
  var protocol_1 = protocol$2;

  var util$4 = {
    isFunc: function isFunc(arg) {
      return 'function' == typeof arg;
    },
    isObj: function isObj(arg) {
      return arg && 'object' == _typeof(arg) && !(arg instanceof Array);
    },
    isSimple: function isSimple(arg) {
      var type = _typeof(arg);
      return type == 'string' || type == 'number' || type == 'boolean';
    },
    isFlatObj: function isFlatObj(arg) {
      if (this.isObj(arg)) {
        for (var key in arg) {
          if (arg.hasOwnProperty(key) && !this.isSimple(arg[key])) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
  };

  var Extend$1 = extend$5;
  var Logger$8 = require$$12["default"];
  var Url$4 = url;
  var guid$1 = pageid;
  var sdkVersion = require$$17.version;
  var protocol$1 = protocol_1;
  var util$3 = util$4;
  var EXT = ['region', 'operator', 'network', 'container', 'os', 'unionId'];
  var urlProduct = protocol$1 + '//catfront.dianping.com';
  var urlBeta = protocol$1 + '//catfront.51ping.com';

  /**
   * 全局维护项目的采样状态是否获取
   * 项目获取过设置对应项目的值为1  { owlDemo: 1 }
  */
  var sampleMap = {};
  // 配置管理类
  var CfgManager$1 = /*#__PURE__*/function () {
    function CfgManager(config) {
      _classCallCheck(this, CfgManager);
      this._config = {
        devMode: false,
        project: '',
        pageUrl: '',
        webVersion: '',
        autoCatch: {
          page: true,
          ajax: true,
          fetch: false,
          resource: true,
          js: true,
          console: false,
          pv: true
        },
        page: {
          sample: 0.5,
          auto: true,
          sensoryIndex: true,
          disableSensoryImageIndex: true,
          interactToStopObserver: true,
          noCheckOuterMutaCount: false,
          fstPerfSample: 0.5,
          fstPerfAnalysis: false,
          logSlowView: false,
          delay: 0,
          logFirstScreen: false,
          ignoreIframe: true,
          mainResourceNumber: 5,
          timeThreshold: 5
        },
        SPA: {
          autoPV: false,
          getFST: false,
          history: true,
          hash: true
        },
        resource: {
          sample: 0.1,
          sampleApi: 0.1,
          combo: true,
          delay: 2000,
          catchAbort: true,
          catchTimeout: false,
          enableStatusCheck: false,
          ignoreMTSIForbidRequest: true
        },
        resourceReg: /(.51ping|.dianping|.dpfile|.meituan|.sankuai|.kuxun|.maoyan|.neixin|.mobike|.dper.com)/,
        enableLogTrace: false,
        ajax: {
          invalid: true,
          flag: false,
          duration: 2000,
          autoBusinessCode: false,
          parseResponse: function parseResponse(res) {
            if (!res || _typeof(res) !== 'object') return {};
            return {
              code: res.code || res.status
            };
          }
        },
        invalid: {
          ajax: true
        },
        image: {
          flag: false,
          duration: 5000,
          fileSize: 100,
          filter: false
        },
        error: {
          sample: 1,
          delay: 1000,
          combo: false,
          maxSize: 1024 * 10,
          maxNum: 100,
          maxTime: 60 * 1000,
          formatUnhandledRejection: false
        },
        useSendBeacon: false,
        disableCache: true,
        noScriptError: true,
        metric: {
          sample: 0.5,
          combo: true,
          delay: 1500
        },
        logan: {
          enable: false
        },
        ignoreList: {
          js: ['Illegal invocation'],
          ajax: ['https?://report.meituan.com/', 'https?://logan.sankuai.com/'],
          resource: ['https?://hls.dianping.com/', 'https?://frep.meituan.net/']
        },
        setCustomTags: null,
        // 自定义维度
        disabledFilters: [],
        pageId: 'owl-' + guid$1(),
        // 以下是Perf平台上报数据的专属配置，仅为了支持Perf侧的秒开率2.0和自定义指标上报功能
        perf: {
          project: '',
          version: '',
          pathPath: '',
          common: {
            dev: false,
            delay: 1000
          },
          fsp2: {
            disable: false,
            sampleRate: 100,
            customTags: {},
            debug: false,
            // 是否开启debug模式，开启后在页面中展示首屏耗时采集相关debug信息
            useIgnore: false,
            // 首屏耗时计算时是否忽略带有属性值“ perf_ignore” 的DOM元素
            beforeSend: undefined,
            defer: true,
            // 是否延迟执行首屏计算，延迟主要是为了应对body可能不存在的情况，如果该参数设置false并且body存在则会同步执行首屏计算
            fspClsEnable: true
          },
          shr: {
            disable: false,
            sampleRate: 5
          },
          ird: {
            disable: false,
            sampleRate: 5
          },
          cache: {
            disable: false,
            sampleRate: 100,
            useSendBeacon: true,
            // 当监听到页面 beforeunload 事件时，是否将上报队列中的数据，通过 navigator.sendBeacon API 上报，如果为 false，会将队列中的数据，通过 localStorage 缓存到本地, 在下次启动时，自动进行上报
            beforeSend: undefined
          }
        },
        bridge: {
          MSI: null
        }
      };
      this.baseQuery = {
        v: 1,
        sdk: sdkVersion
      };
      this.apiPaths = {
        log: '/api/log',
        error: '/api/logts',
        page: '/api/speedts',
        resource_pbbatch: '/pbbatchts',
        resource: '/batchts',
        metric: '/rapi/metricjts',
        pv: '/api/pvts',
        fstInfo: '/raptorapi/fstSpeed',
        fstLog: '/raptorapi/fstLog'
      };
      this.userConfig = {};
      this.config = {};
      this.extensions = {};
      this.filters = [];
      this.url = urlProduct;
      if (config) {
        this.set(config);
      } else {
        this.config = this._config;
      }
      this.rSample = {};
    }
    _createClass(CfgManager, [{
      key: "get",
      value: function get(key) {
        return key ? this.config[key] : this.config;
      }
    }, {
      key: "set",
      value: function set(data) {
        Logger$8.log('开始 config 更新，旧 config 为: ', this.get());
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            var val = data[key];
            if (key === 'devMode') {
              this.setApiDomain(val);
              if (val) {
                Logger$8.setDebug();
              }
            }
            if (key === 'perf' && val.common && val.common.dev) {
              Logger$8.setDebug();
            }
            if (key === 'webVersion' && val) {
              this.baseQuery['webVersion'] = val;
            }
            if (key === 'ext') {
              this.setExtension(val);
            }
            if (key === 'resource' && val) {
              val.sample = undefined;
            }
            try {
              if (_typeof(val) !== 'object' || val instanceof RegExp || val instanceof Array) {
                this.userConfig[key] = key !== 'resourceReg' ? val : new RegExp(val);
              } else if (key !== 'pageUrl') {
                this.userConfig[key] = Extend$1(this.userConfig[key], val);
              }
            } catch (e) {
              Logger$8.ignore(e);
            }
          }
        }
        this.update();
        Logger$8.log('完成 config 更新，新 config 为: ', this.get());
      }
    }, {
      key: "update",
      value: function update() {
        this.config = this._config;
        for (var key in this.userConfig) {
          var data = this.userConfig[key];
          if (_typeof(data) !== 'object' || data instanceof RegExp || data instanceof Array) {
            this.config[key] = data;
          } else if (key === 'perf') {
            // perf 配置项比较特殊，内部还内嵌有对象
            this.config[key] = this.updatePerfConfig(data);
          } else {
            this.config[key] = Extend$1(this.config[key], this.userConfig[key]);
          }
        }
      }
    }, {
      key: "setApiDomain",
      value: function setApiDomain(isDev) {
        this.url = isDev ? urlBeta : urlProduct;
      }
    }, {
      key: "getExtension",
      value: function getExtension(key) {
        return key ? this.extensions[key] : this.extensions;
      }
    }, {
      key: "setExtension",
      value: function setExtension(exts) {
        if (!exts) return;
        for (var key in exts) {
          if (exts.hasOwnProperty(key)) {
            var value = exts[key];
            if (key === 'latlng') {
              // 修改url参数, 声明使用经纬度替换region
              this.extensions['region'] = value;
              this.baseQuery['useLatlng'] = true;
            } else if (EXT.indexOf(key) > -1) {
              this.extensions[key] = value;
            }
          }
        }
      }

      /**
       * 更新Perf侧上报配置
       * @param {object} config
       * @returns
       */
    }, {
      key: "updatePerfConfig",
      value: function updatePerfConfig(config) {
        var result = this._config['perf']; // 默认值

        for (var key in config) {
          var data = config[key];
          if (key === 'common' && data.delay) {
            data.delay = typeof data.delay !== 'number' ? 1000 : Math.max(data.delay, 1000);
          }
          if (_typeof(data) !== 'object' || data instanceof RegExp || data instanceof Array) {
            result[key] = data;
          } else {
            result[key] = Extend$1(result[key], config[key]);
          }
        }
        return result;
      }
    }, {
      key: "addFilter",
      value: function addFilter(key, fn) {
        if (key && fn instanceof Function && this.config.disabledFilters && this.config.disabledFilters.indexOf(key) === -1) {
          var filterIndex = -1;
          for (var i = 0; i < this.filters.length; i++) {
            var filter = this.filters[i];
            if (filter.key === key) {
              filterIndex = i;
              filter.fn = fn;
              break;
            }
          }
          if (filterIndex === -1) {
            this.filters.push({
              key: key,
              fn: fn
            });
          }
        }
      }
    }, {
      key: "removeFilter",
      value: function removeFilter(key) {
        for (var i = 0; i < this.filters.length; i++) {
          var filter = this.filters[i];
          if (filter.key === key) {
            this.filters.splice(i, 1);
            return;
          }
        }
      }
    }, {
      key: "getApiPath",
      value: function getApiPath(key) {
        var project = this.get('project');
        // 在项目启动后，仅在第一个指标上报接口中需要获取采样率，需要获取后端采样率时，设置查询参数 st：1
        var query = !sampleMap[project] ? _objectSpread2(_objectSpread2({}, this.baseQuery), {}, {
          st: 1
        }) : this.baseQuery;
        sampleMap[project] = 1;
        var path = this.apiPaths[key];
        return Url$4.stringify(this.url + path, query);
      }
    }, {
      key: "getCustomTags",
      value: function getCustomTags() {
        try {
          var func = this.config && this.config.setCustomTags;
          if (util$3.isFunc(func)) {
            var result = func();
            if (util$3.isFlatObj(result)) {
              return result;
            }
          }
          return '';
        } catch (e) {
          return '';
        }
      }
      /**
       *
       * @returns 是否使用了perf监控
       */
    }, {
      key: "isEnablePerf",
      value: function isEnablePerf() {
        return !!this.get('perf').project;
      }
    }, {
      key: "handleRemoteConfig",
      value: function handleRemoteConfig(res) {
        try {
          if (util$3.isObj(res === null || res === void 0 ? void 0 : res.sampling)) {
            this.rSample = res.sampling;
          }
        } catch (error) {
          Logger$8.log(error);
        }
      }

      /**
       * 判断某个指标是否命中采样
       * @param {string} key 指标名，
       * @returns 是否命中采样
       */
    }, {
      key: "isSampleHit",
      value: function isSampleHit(key) {
        var _this$rSample$resourc, _this$rSample$request, _this$rSample$log, _this$rSample$perform, _ref, _sampleMap$key, _this$rSample$custom;
        var sampleMap = {
          resource: (_this$rSample$resourc = this.rSample.resource) !== null && _this$rSample$resourc !== void 0 ? _this$rSample$resourc : this.get('resource').sample,
          api: (_this$rSample$request = this.rSample.request) !== null && _this$rSample$request !== void 0 ? _this$rSample$request : this.get('resource').sampleApi,
          error: (_this$rSample$log = this.rSample.log) !== null && _this$rSample$log !== void 0 ? _this$rSample$log : this.get('error').sample,
          page: (_this$rSample$perform = this.rSample.performance) !== null && _this$rSample$perform !== void 0 ? _this$rSample$perform : this.get('page').sample
        };
        var sample = (_ref = (_sampleMap$key = sampleMap[key]) !== null && _sampleMap$key !== void 0 ? _sampleMap$key : (_this$rSample$custom = this.rSample.custom) === null || _this$rSample$custom === void 0 ? void 0 : _this$rSample$custom[key]) !== null && _ref !== void 0 ? _ref : 1;
        return Math.random() < sample;
      }
    }]);
    return CfgManager;
  }();
  var config = CfgManager$1;

  var event = {
    on: function on(name, listener) {
      if (!name || !listener) return;
      this._events_ = this._events_ || {};
      this._events_[name] = this._events_[name] || [];
      this._events_[name].push(listener);
    },
    trigger: function trigger(name) {
      var events = this._events_;
      if (!name || !events || !events[name]) return;
      var queue = events[name];
      var args = [].slice.call(arguments, 1);
      for (var i = 0; i < queue.length; i++) {
        queue[i].apply(this, args);
      }
    }
  };

  /**
   * @desc convert char to number
   * @params {String} number char
   * @params {Number} scale
   * @return {Number} polished number string
   */
  function toNumber(char, scale) {
      if (!char) {
          return 0;
      }
      var num = parseInt(char, scale);
      if (isNaN(num)) {
          throw new Error('parse char \'' + char + '\' to number(' + scale + ') failed');
      }
      return num;
  }
  /**
   * @desc multiply number string
   * @params {String} number string multiplicand
   * @params {Number} multiplier
   * @params {Number} scale
   * @return {String} multiplied number string
   */
  function multiply(str, multiplier, scale) {
      var result = '';
      var n;
      var carry = 0;
      var remainder;
      var i = str.length;
      while (--i >= 0) {
          n = toNumber(str[i], scale) * multiplier + carry;
          carry = Math.floor(n / scale);
          remainder = n % scale;
          result = remainder.toString(scale) + result;
      }
      while (carry > 0) {
          remainder = carry % scale;
          result = remainder.toString(scale) + result;
          carry = Math.floor(carry / scale);
      }
      return result;
  }
  /**
   * @desc trim number string, remove front zero
   * @params {String} number string
   * @return {String} trimed number string
   */
  function trim(str) {
      while (str[0] === '0' && str.length > 1) {
          str = str.slice(1);
      }
      return str;
  }
  /**
   * @desc add two number string
   * @params {String} first number string
   * @params {String} second number string
   * @params {Number} scale
   * @return {String} added number string
   */
  function add(firstr, secstr, scale) {
      var result = '';
      var firlen = firstr.length;
      var seclen = secstr.length;
      var n;
      var carry = 0;
      var remainder;
      var i = 0;
      while (i < firlen || i < seclen) {
          i++;
          n =
              toNumber(firstr[firlen - i], scale) +
                  toNumber(secstr[seclen - i], scale) +
                  carry;
          carry = Math.floor(n / scale);
          remainder = n % scale;
          result = remainder.toString(scale) + result;
      }
      while (carry > 0) {
          remainder = carry % scale;
          result = remainder.toString(scale) + result;
          carry = Math.floor(carry / scale);
      }
      return result;
  }
  /**
   * @desc polish number string, add front zero
   * @params {String} number string
   * @params {Number} target length
   * @return {String} polished number string
   */
  function polish(str, len) {
      while (str.length < len) {
          str = '0' + str;
      }
      return str;
  }
  /**
   * @desc convert number string from scale to scale
   * @params {String} number string
   * @params {Number} from scale
   * @params {Number} to scale
   * @params {Boolean} fullfill int64 value
   * @return {String} converted number string
   */
  function convert(src, fromScale, toScale, polishLen) {
      src = trim(src);
      fromScale = fromScale || 10;
      toScale = toScale || 16;
      var result = '0';
      var n;
      var rate = '1';
      var i = 0;
      while (i++ < src.length) {
          n = multiply(rate, toNumber(src[src.length - i], fromScale), toScale);
          result = add(result, n, toScale);
          rate = multiply(rate, fromScale, toScale);
      }
      if (polishLen) {
          return polish(result, polishLen);
      }
      return result;
  }
  /**
   * @desc compare two number string
   * @params {String} first number string
   * @params {String} second number string
   * @params {Number} scale
   * @return {Number} 1 0 -1
   */
  function compare(firstr, secstr, scale) {
      if (firstr.length > secstr.length) {
          return 1;
      }
      else if (firstr.length < secstr.length) {
          return -1;
      }
      else {
          var i = 0;
          while (i < firstr.length) {
              var fn = toNumber(firstr[i], scale);
              var sn = toNumber(secstr[i], scale);
              if (fn > sn) {
                  return 1;
              }
              else if (fn < sn) {
                  return -1;
              }
              i++;
          }
      }
      return 0;
  }
  /**
   * @desc sub two number string
   * @params {String} first number string
   * @params {String} second number string
   * @params {Number} scale
   * @return {String} subed number string
   */
  function sub(firstr, secstr, scale) {
      if (compare(firstr, secstr, scale) < 0) {
          return sub(secstr, firstr, scale);
      }
      var result = '';
      var firlen = firstr.length;
      var seclen = secstr.length;
      var n;
      var carry = 0;
      var i = 0;
      while (i < firlen) {
          i++;
          n =
              toNumber(firstr[firlen - i], scale) -
                  toNumber(secstr[seclen - i], scale) +
                  carry;
          if (n < 0) {
              carry = -1;
              n = n + scale;
          }
          result = n.toString(scale) + result;
      }
      return trim(result);
  }
  function signedHexToDec(src) {
      var negate = src.length > 15 && toNumber(src[0], 16) >= 8;
      var result = convert(negate ? sub('10000000000000000', src, 16) : src, 16, 10);
      return negate ? '-' + result : result;
  }

  var rngBrowser = {exports: {}};

  // Unique ID creation requires a high quality random # generator.  In the
  // browser this is a little complicated due to unknown quality of Math.random()
  // and inconsistent support for the `crypto` API.  We do the best we can via
  // feature-detection

  // getRandomValues needs to be invoked in a context where "this" is a Crypto
  // implementation. Also, find the complete implementation of crypto on IE11.
  var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                        (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

  if (getRandomValues) {
    // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
    var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

    rngBrowser.exports = function whatwgRNG() {
      getRandomValues(rnds8);
      return rnds8;
    };
  } else {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var rnds = new Array(16);

    rngBrowser.exports = function mathRNG() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return rnds;
    };
  }

  var rngBrowserExports = rngBrowser.exports;

  /**
   * Convert array of 16 byte values to UUID string format of the form:
   * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   */

  var byteToHex = [];
  for (var i = 0; i < 256; ++i) {
    byteToHex[i] = (i + 0x100).toString(16).substr(1);
  }

  function bytesToUuid$2(buf, offset) {
    var i = offset || 0;
    var bth = byteToHex;
    // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
    return ([bth[buf[i++]], bth[buf[i++]], 
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]], '-',
  	bth[buf[i++]], bth[buf[i++]],
  	bth[buf[i++]], bth[buf[i++]],
  	bth[buf[i++]], bth[buf[i++]]]).join('');
  }

  var bytesToUuid_1 = bytesToUuid$2;

  var rng$1 = rngBrowserExports;
  var bytesToUuid$1 = bytesToUuid_1;

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  var _nodeId;
  var _clockseq;

  // Previous uuid creation time
  var _lastMSecs = 0;
  var _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1$1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};
    var node = options.node || _nodeId;
    var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

    // node and clockseq need to be initialized to random values if they're not
    // specified.  We do this lazily to minimize issues related to insufficient
    // system entropy.  See #189
    if (node == null || clockseq == null) {
      var seedBytes = rng$1();
      if (node == null) {
        // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
        node = _nodeId = [
          seedBytes[0] | 0x01,
          seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
        ];
      }
      if (clockseq == null) {
        // Per 4.2.2, randomize (14 bit) clockseq
        clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
      }
    }

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq === undefined) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    for (var n = 0; n < 6; ++n) {
      b[i + n] = node[n];
    }

    return buf ? buf : bytesToUuid$1(b);
  }

  var v1_1 = v1$1;

  var rng = rngBrowserExports;
  var bytesToUuid = bytesToUuid_1;

  function v4$1(options, buf, offset) {
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options === 'binary' ? new Array(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ++ii) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || bytesToUuid(rnds);
  }

  var v4_1 = v4$1;

  var v1 = v1_1;
  var v4 = v4_1;

  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;

  var uuid_1 = uuid;

  var Event$5 = event;
  var isSimple = util$4.isSimple;
  var spiderList = ['baiduspider', 'googlebot', 'bingbot', 'yammybot', '360spider', 'haosouspider', 'youdaobot', 'sogou news spider', 'yisouspider', 'mtdp-infosec', 'mtdp-searchspider', 'yandexbot', 'yandexmobilebot'];
  // 复写History对象方法以实现路由变化的监听
  function hackHashStateFunc() {
    var ADD_EVENT = window.addEventListener || window.attachEvent;
    var that = this;
    ADD_EVENT('hashchange', function (event) {
      try {
        var newURL = event && event.newURL || '';
        var oldURL = event && event.oldURL || '';
        var curPath = that.parseRoutePath(newURL);
        var prePath = that.parseRoutePath(oldURL);
        if (curPath && prePath && curPath !== prePath) {
          // 路由路径发生了变化
          Event$5.trigger('validStateChange', {
            path: curPath
          });
        }
      } catch (e) {
        that.reportSysError(e);
      }
    });
  }
  function hackHistoryStateFunc(name) {
    try {
      var oldFunc = window.history[name];
      if (typeof oldFunc === 'function') {
        var that = this;
        window.history[name] = function (state, title, url) {
          var preHref = location.href;
          var result = oldFunc.apply(window.history, [].slice.call(arguments));
          var curHref = location.href; // location.href 已完成变更
          if (!url || typeof url !== 'string' || curHref === preHref) return result;
          try {
            var prePath = that.parseRoutePath(preHref);
            var curPath = that.parseRoutePath(curHref);
            if (curPath && prePath && curPath !== prePath) {
              // 路由路径发生了变化
              Event$5.trigger('validStateChange', {
                path: curPath
              });
            }
          } catch (e) {
            that.reportSysError(e);
          }
          return result;
        };
      }
    } catch (e) {
      this.reportSysWarn(e);
    }
  }
  // 解析出url的路径部分
  function parseRoutePath(url) {
    if (url && typeof url === 'string') {
      var path = url.replace(/^(https?:)?(\/\/[^\/]*)?/, '');
      var query = path.match(/\?.*$/) && path.match(/\?.*$/)[0] || '';
      var hashAfterQuery = query.match(/\#.*$/) && query.match(/\#.*$/)[0] || '';
      return path.replace(/\?.*$/, '') + hashAfterQuery;
    } else {
      return '';
    }
  }
  function getHref() {
    return location && location.href || '';
  }
  function getProtocol() {
    return location && location.protocol || 'https:';
  }
  function getOrigin() {
    return location.origin || location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
  }
  function getPageUrl$1() {
    return this.getHref().replace(/\?.*(?=(\#))/, '').replace(/\?.*/, '');
  }
  function getPerfTiming() {
    return window.performance && window.performance.timing;
  }
  function getConnectionType() {
    var connection = window.navigator && window.navigator.connection;
    return connection ? connection.effectiveType || connection.type || '' : '';
  }
  function reportSysError$1(err) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var errManager = window.Owl && window.Owl.errManager;
    if (errManager && typeof errManager.reportSystemError === 'function') {
      errManager.reportSystemError(err, opts);
    }
  }
  function reportSysWarn(err, opts) {
    opts = opts || {};
    opts.level = 'warn';
    this.reportSysError(err, opts);
  }
  function getUserAgent() {
    return window.navigator && window.navigator.userAgent || '';
  }
  function getAppName() {
    return window.navigator.appName;
  }
  function checkIsSpider() {
    try {
      var ua = this.getUserAgent().toLowerCase();
      for (var i = 0; i < spiderList.length; i++) {
        if (ua.indexOf(spiderList[i]) > -1) return true;
      }
    } catch (e) {
      this.reportSysError(e);
    }
    return false;
  }
  function getFullUrl(url) {
    if (url.indexOf('//') === 0) {
      url = this.getProtocol() + url;
    } else if (url.indexOf('/') === 0) {
      url = this.getOrigin() + url;
    }
    return url;
  }
  function checkSameOrigin(url) {
    var origin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    origin = origin || this.getOrigin();
    if (!(url && origin)) return false;
    url = this.getFullUrl(url);
    return url.indexOf(origin) === 0;
  }
  function traceid() {
    try {
      var uu = uuid_1.v1().replace(/-/g, '');
      var f16 = uu.slice(0, 16);
      var l16 = uu.slice(16);
      var hex = Array(16).fill(0).map(function (_, i) {
        return parseInt(f16[15 - i], 16) ^ parseInt(l16[15 - i], 16);
      }).map(function (it) {
        return it.toString(16);
      }).join('');
      return (0, signedHexToDec)(hex);
    } catch (e) {
      this.reportSysError(e);
      return '';
    }
  }
  function getXPath(node) {
    var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
    try {
      var id = node.id ? '#' + node.id : '';
      var className = 'string' === typeof node.className && node.className ? '.' + node.className.split(' ').join('.') : '';
      var nodeName = 'string' === typeof node.nodeName ? node.nodeName.toLowerCase() : '';
      var path = nodeName + id + className;
      return node.parentNode && node.parentNode.nodeName && count - 1 > 0 ? this.getXPath(node.parentNode, count - 1) + ' > ' + path : path;
    } catch (e) {
      return '';
    }
  }

  /**
   * 格式化tags对象，确保属性值只能是基础类型
   * @param {Object} tags - 需要格式化的tags对象
   * @returns {Object} 格式化后的tags对象
   */
  function formatTags(tags) {
    if (!tags || _typeof(tags) !== 'object') {
      return {};
    }
    return Object.keys(tags).reduce(function (formattedTags, key) {
      var value = tags[key];

      // 基础类型直接使用
      if (isSimple(value)) {
        formattedTags[key] = value;
      } else if (value !== null && _typeof(value) === 'object') {
        // 对象和数组都转换为JSON字符串
        try {
          formattedTags[key] = JSON.stringify(value);
        } catch (e) {
          formattedTags[key] = '[object Object]';
        }
      } else {
        // 其他类型（function等）统一转换为字符串
        formattedTags[key] = String(value);
      }
      return formattedTags;
    }, {});
  }

  var util$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    hackHashStateFunc: hackHashStateFunc,
    hackHistoryStateFunc: hackHistoryStateFunc,
    parseRoutePath: parseRoutePath,
    getHref: getHref,
    getProtocol: getProtocol,
    getOrigin: getOrigin,
    getPageUrl: getPageUrl$1,
    getPerfTiming: getPerfTiming,
    getConnectionType: getConnectionType,
    reportSysError: reportSysError$1,
    reportSysWarn: reportSysWarn,
    getUserAgent: getUserAgent,
    getAppName: getAppName,
    checkIsSpider: checkIsSpider,
    getFullUrl: getFullUrl,
    checkSameOrigin: checkSameOrigin,
    traceid: traceid,
    getXPath: getXPath,
    formatTags: formatTags
  });

  var require$$9 = /*@__PURE__*/getAugmentedNamespace(util$2);

  var Util$b = require$$9;
  var NOOP = function NOOP() {};

  // 封装 AJAX 接口
  var xhr$1 = function xhr(opts) {
    if (!opts) return;
    var UA = Util$b.getUserAgent();
    var browserName = Util$b.getAppName();
    var isIE89 = browserName.indexOf('Microsoft Internet Explorer') !== -1 && (UA.indexOf('MSIE 8.0') !== -1 || UA.indexOf('MSIE 9.0') !== -1);
    var useXDomainRequest = isIE89 && window.XDomainRequest;
    var req;
    if (useXDomainRequest) {
      req = new window.XDomainRequest();
    } else {
      req = new XMLHttpRequest();
    }
    req.open(opts.type || 'GET', opts.url, true);
    req.success = opts.success || NOOP;
    req.fail = opts.fail || NOOP;
    var _handleXhrEvent = function _handleXhrEvent(event) {
      if (event && event.currentTarget && /(catfront\.(dianping|51ping)\.com|\.dreport\.meituan\.net)/.test(opts.url)) {
        if (event.currentTarget.status === 200) {
          req.success && req.success();
        } else {
          req.fail && req.fail(event);
        }
      }
    };

    // 当设置了 autoCatch.ajax 为false时，也需要支持 success/fail 回调
    if (opts.xhrRewritten === false && !useXDomainRequest) {
      if ('addEventListener' in req) {
        req.addEventListener('load', _handleXhrEvent);
        req.addEventListener('error', _handleXhrEvent);
        req.addEventListener('abort', _handleXhrEvent);
      } else {
        var _originStateChange = req.onreadystatechange;
        req.onreadystatechange = function (event) {
          if (this.readyState === 4) {
            _handleXhrEvent(event);
          }
          if (_originStateChange) {
            _originStateChange.apply(this, arguments);
          }
        };
      }
    }
    if (opts.type === 'POST') {
      if (opts.header && !useXDomainRequest) {
        for (var key in opts.header) {
          if (opts.header.hasOwnProperty(key)) {
            req.setRequestHeader(key, opts.header[key]);
          }
        }
      }
      req.send(opts.data);
    } else {
      req.send();
    }
    return req;
  };

  var category$1 = {
    SCRIPT: 'jsError',
    AJAX: 'ajaxError',
    RESOURCE: 'resourceError'
  };

  var level = {
    ERROR: 'error',
    INFO: 'info',
    WARN: 'warn',
    DEBUG: 'debug'
  };

  var Util$a = require$$9;
  var extend$4 = extend$5;
  var Category$2 = category$1;
  var Level$1 = level;
  var errKeys = ['project', 'pageUrl', 'realUrl', 'resourceUrl', 'category', 'sec_category', 'level', 'unionId', 'timestamp', 'content', 'traceid'];
  var VALID_ATTR = ['rowNum', 'colNum', 'tags'].concat(errKeys);
  var eventKeys = ['project', 'pageUrl', 'category', 'sec_category', 'level', 'unionId'];

  /**
   * 异常数据模型
   *
   * @param {string} project - 错误所在项目
   * @param {string} pageUrl - 错误聚合页面地址
   * @param {string} realUrl - 错误真实地址
   * @param {string} [resourceUrl] - 错误资源地址
   * @param {string} category - 错误类型jsError, resourceError, ajaxError
   * @param {string} sec_category - 错误名称，用户错误聚合
   * @param {string} level - 错误程度, 默认error, 分类info, debug, error, warn
   * @param {string} [content] - 错误详细日志信息
   * @param {Number} [rowNum] - 错误行
   * @param {Number} [colNum] - 错误列
   * @param {Number} timestamp - 时间戳
   * @param {string} unionId - unionId
   * @param {Object} [tags] - 其他用户自定义信息
   */
  var OwlError = /*#__PURE__*/function () {
    function OwlError(data) {
      _classCallCheck(this, OwlError);
      if (!data) return;
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          this[key] = data[key];
        }
      }
      this.parse(data);
    }
    _createClass(OwlError, [{
      key: "parse",
      value: function parse() {
        this.category = this.category || Category$2.SCRIPT;
        this.level = this.level || Level$1.ERROR;
        this.timestamp = this.timestamp || +new Date();
        this.sec_category = this.sec_category || 'default';
      }
    }, {
      key: "isEqual",
      value: function isEqual(other) {
        return this.sec_category === other.sec_category && this.resourceUrl === other.resourceUrl && this.colNum === other.colNum && this.rowNum === other.rowNum && this.content === other.content;
      }
    }, {
      key: "update",
      value: function update(data) {
        if (data) {
          for (var key in data) {
            if (data[key] !== undefined && VALID_ATTR.indexOf(key) > -1) {
              this[key] = data[key];
            }
          }
        }
        return this;
      }
    }, {
      key: "updateTags",
      value: function updateTags(obj) {
        this.tags = extend$4(this.tags || {}, obj);
        return this;
      }
    }, {
      key: "toJson",
      value: function toJson() {
        var _this = this;
        var str = {};
        errKeys.map(function (key) {
          if (_this[key] !== undefined) {
            str[key] = _this[key];
          }
        });
        var rowNum = this.rowNum;
        var colNum = this.colNum;
        if (str.category === Category$2.SCRIPT && rowNum && colNum) {
          str.dynamicMetric = {
            rowNum: rowNum,
            colNum: colNum
          };
        }
        if (this.tags) {
          str.dynamicMetric = extend$4(str.dynamicMetric || {}, this.tags);
        }
        return str;
      }
    }, {
      key: "toLoganJson",
      value: function toLoganJson() {
        var _this2 = this;
        var info = {};
        VALID_ATTR.map(function (key) {
          if (_this2[key] !== undefined) {
            info[key] = _this2[key];
          }
        });
        try {
          var content = info.content || '';
          if (typeof content !== 'string') {
            content = JSON.stringify(content);
          }
          info.content = content.substr && content.substr(0, 200) || '';
        } catch (e) {
          info.content = '';
          Util$a.reportSysError(e);
        }
        return info;
      }
    }, {
      key: "getEventInfo",
      value: function getEventInfo() {
        var _this3 = this;
        var ext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var temp = {};
        eventKeys.map(function (key) {
          if (_this3[key] !== undefined) {
            temp[key] = _this3[key];
          }
        });
        for (var key in ext) {
          if (ext.hasOwnProperty(key)) {
            temp[key] = ext[key];
          }
        }
        return temp;
      }
    }]);
    return OwlError;
  }();
  OwlError.LEVEL = Level$1;
  OwlError.CATEGORY = Category$2;
  var model$1 = OwlError;

  var ls = function ls() {
    var testKey = 'owl_local_test';
    try {
      localStorage.setItem(testKey, 1);
      localStorage.removeItem(testKey);
    } catch (e) {
      return false;
    }
    return true;
  };

  var isSupport = ls;
  var Logger$7 = require$$12["default"];
  var LS_KEY = 'owl_cache';
  var LS_KEY_V2 = 'owl_cache_v2';
  var db = {
    isSupport: isSupport(),
    get: function get() {
      if (!this.isSupport) return;
      var data = {};
      try {
        var rawV2 = localStorage.getItem(LS_KEY_V2); // new storage format - Object
        if (rawV2) {
          var tempV2 = JSON.parse(rawV2);
          if (_typeof(tempV2) === 'object' && Object.keys(tempV2).length) {
            data = tempV2;
          }
        }
      } catch (e) {
        this.clear(LS_KEY_V2);
        Logger$7.ignore(e);
      }
      try {
        var raw = localStorage.getItem(LS_KEY); // history storage format - Array
        if (raw) {
          var temp = JSON.parse(raw);
          if (temp instanceof Array) {
            data['no-version'] = temp.concat(data['no-version'] || []);
          }
        }
      } catch (e) {
        this.clear(LS_KEY);
        Logger$7.ignore(e);
      }
      return data;
    },
    add: function add(cache, version) {
      if (!this.isSupport) return;
      try {
        if (cache instanceof Array) {
          version = version || 'no-version';
          var preCache = this.get();
          if (preCache[version] instanceof Array) {
            preCache[version] = cache.concat(preCache[version]);
          } else {
            preCache[version] = cache;
          }
          localStorage.setItem(LS_KEY_V2, JSON.stringify(preCache));
        }
      } catch (e) {
        Logger$7.ignore(e);
      }
    },
    clear: function clear(key) {
      if (!this.isSupport) return;
      try {
        key = key || LS_KEY;
        localStorage.removeItem(key);
      } catch (e) {
        Logger$7.ignore(e);
      }
    },
    clearAll: function clearAll() {
      if (!this.isSupport) return;
      try {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem(LS_KEY_V2);
      } catch (e) {}
    },
    clearItem: function clearItem(version) {
      if (!this.isSupport) return;
      try {
        var preCache = this.get();
        if (_typeof(preCache) === 'object' && preCache.hasOwnProperty(version)) {
          delete preCache[version];
          if (Object.keys(preCache).length) {
            localStorage.setItem(LS_KEY_V2, JSON.stringify(preCache));
          } else {
            localStorage.removeItem(LS_KEY_V2);
          }
          if (version === 'no-version') {
            localStorage.removeItem(LS_KEY);
          }
        }
      } catch (e) {
        Logger$7.ignore(e);
      }
    }
  };

  var load = {};

  var cached = [];
  load.loadScript = function (src, cb) {
    if (~cached.indexOf(src)) {
      cb();
      return;
    }
    var ele = document.createElement('script');
    ele.src = src;
    ele.onload = function () {
      cached.push(src);
      cb();
    };
    document.getElementsByTagName('head')[0].appendChild(ele);
  };

  var loadScript = load.loadScript;
  var prefixV1 = '//www.dpfile.com/app/dp-logan-web/logan_';
  var prefixV2 = '//s3.meituan.net/v1/mss_eb9ea9cfff9840198c3ae909b17b4270/production/logan-websdk/logan_';
  var Logan$5;
  var enable = false;
  var logan = {
    queue: [],
    ready: function ready() {
      var _this = this;
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var LoganAPI = config.LoganAPI,
        project = config.project,
        pageUrl = config.pageUrl,
        loganConfig = config.loganConfig,
        version = config.version;
      enable = true;
      var doTask = function doTask() {
        if (!Logan$5) return;
        if (loganConfig) Logan$5 = Logan$5.config(loganConfig);
        Logan$5.log("[Session]:".concat(JSON.stringify({
          project: project,
          pageUrl: pageUrl
        })), 'owl', 'info', ['session']);
        while (_this.queue.length) {
          Logan$5.log(_this.queue.shift(), 'owl');
        }
      };
      if (LoganAPI) {
        Logan$5 = LoganAPI;
        doTask();
      } else {
        try {
          if (window.Logan) {
            Logan$5 = window.Logan;
            doTask();
          } else {
            var url = (version.indexOf('1.') === 0 ? prefixV1 : prefixV2) + version + '.js';
            loadScript(url, function () {
              Logan$5 = window.Logan;
              doTask();
            });
          }
        } catch (e) {
          console.log('logan 加载失败');
        }
      }
    },
    log: function log(msg) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!enable) return;
      var type = opts.noType ? 'default' : 'owl';
      if (Logan$5) {
        Logan$5.log(msg, type);
      } else {
        this.queue.push(msg);
      }
    },
    _log: function _log() {
      try {
        if (Logan$5 && Logan$5.log) {
          Logan$5.log.apply(Logan$5, arguments);
        }
      } catch (e) {}
    }
  };

  var Ajax$4 = xhr$1;
  var extend$3 = extend$5;
  var EM$1 = model$1;
  var DB = db;
  var Category$1 = category$1;
  var Level = level;
  var Logger$6 = require$$12["default"];
  var Util$9 = require$$9;
  var Url$3 = url;
  var Logan$4 = logan;
  var Version = require$$17.version;
  var NAME$5 = 'error';
  var encodeDataBeforeSend = function encodeDataBeforeSend(data) {
    return 'c=' + encodeURIComponent(JSON.stringify(data));
  };
  var doSend = function doSend(opts) {
    if (opts && opts.data) {
      return Ajax$4({
        url: opts.url,
        type: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: encodeDataBeforeSend(opts.data),
        success: opts.success,
        fail: opts.fail,
        xhrRewritten: opts.xhrRewritten
      });
    }
  };
  var SysInstance = null; // owl自身采集实例
  /**
   * @description: 设置系统自身采集实例
   * @param {*} ins 实例
   * @return {*}
   */
  var setSysInstance = function setSysInstance(ins) {
    SysInstance = ins;
  };

  // Owl 错误管理类
  var ErrorManager = /*#__PURE__*/function () {
    function ErrorManager(cfgManager) {
      _classCallCheck(this, ErrorManager);
      this.cfgManager = cfgManager;
      this.cache = [];
      this.cacheSending = {};
      this.comboTimeout = 0;
      this.timeLimit = Date.now();
      this.errorCount = 0;
      this.isTimeLimit = false;
      /* // SDK自身指标错误上报计数
         this.SDKErrorCount = 0 */
      this.detectLeave();
    }
    // 解析 window.onerror 采集到的 JS 错误
    _createClass(ErrorManager, [{
      key: "parseWindowError",
      value: function parseWindowError(msg, url, line, col, error) {
        try {
          if (error && error.stack) {
            // this.push(error)
            error = this._processError(error);
            if (error.sec_category !== 'Invalid_Error') {
              error.rowNum = error.rowNum || line;
              error.colNum = error.colNum || col;
              error.resourceUrl = error.resourceUrl || url;
            }
            this._push(error);
          } else if (typeof msg === 'string') {
            this._push({
              category: Category$1.SCRIPT,
              sec_category: msg,
              resourceUrl: url,
              rowNum: line,
              colNum: col
            });
          }
        } catch (e) {
          this.reportSystemError(e);
        }
      }
      // 处理 unhandledrejection 错误
    }, {
      key: "parsePromiseUnhandled",
      value: function parsePromiseUnhandled(event) {
        if (!(event && event.type === 'unhandledrejection')) return;
        try {
          var reason = event.reason;
          if (reason) {
            var name = 'unhandledrejection';
            var stack = '';
            if (reason instanceof Error) {
              var errName = reason.message || reason.name || '';
              if (errName && this.cfgManager.get(NAME$5).formatUnhandledRejection) {
                name = '[unhandledrejection] ' + errName;
              }
              stack = reason.stack || reason.toString() || '';
            } else {
              stack = reason;
            }
            this._push({
              category: Category$1.SCRIPT,
              sec_category: name,
              content: stack
            });
          }
        } catch (e) {
          this.reportSystemError(e);
        }
      }
    }, {
      key: "parseConsoleError",
      value: function parseConsoleError() {
        try {
          var args = Array.prototype.slice.call(arguments);
          if (!(args && args.length)) return;
          var contents = [];
          for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg) {
              var msg = '';
              if (typeof arg === 'string') {
                msg = arg;
              } else if (arg instanceof window.Error) {
                msg = arg.stack || arg.message || '';
              } else if (arg instanceof window.ErrorEvent) {
                msg = arg.error && (arg.error.stack || arg.error.message) || arg.message || '';
              } else {
                msg = JSON.stringify(arg);
              }
              contents.push(msg);
            }
          }
          if (contents && contents.length) {
            this._push({
              category: Category$1.SCRIPT,
              sec_category: 'consoleError',
              content: contents.join(' ')
            });
          }
        } catch (e) {
          this.reportSystemError(e);
        }
      }
      // 监听页面卸载事件, 异步上报或存储还未上报的异常
    }, {
      key: "detectLeave",
      value: function detectLeave() {
        var _this = this;
        try {
          var origin = window.onbeforeunload;
          window.onbeforeunload = function () {
            var cacheDisabled = _this.cfgManager.get('disableCache') || window.Owl && window.Owl.cfgManager.get('disableCache');
            var useSendBeacon = _this.cfgManager.get('useSendBeacon') && window.navigator && window.navigator.sendBeacon;
            if (!cacheDisabled || useSendBeacon) {
              var cacheCombined = _this.addCacheExtension(); // 1.未进入上报流程
              var cacheSending = _this.cacheSending; // 2.上报流程未结束
              if (cacheSending && Object.keys(cacheSending).length) {
                for (var key in cacheSending) {
                  try {
                    if (cacheSending.hasOwnProperty(key) && cacheSending[key]) {
                      var _cacheSending$key = cacheSending[key],
                        xhr = _cacheSending$key.xhr,
                        cache = _cacheSending$key.cache;
                      xhr.abort();
                      if (cache instanceof Array && cache.length) {
                        cacheCombined = cacheCombined.concat(cache);
                      }
                    }
                  } catch (e) {
                    Logger$6.ignore(e);
                  }
                }
              }
              if (cacheCombined && cacheCombined.length) {
                if (useSendBeacon) {
                  var url = Url$3.stringify(_this.cfgManager.getApiPath(NAME$5), {
                    pageId: _this.cfgManager.get('pageId'),
                    beacon: 1
                  });
                  window.navigator.sendBeacon(url, encodeDataBeforeSend(cacheCombined));
                } else if (!cacheDisabled) {
                  DB.add(cacheCombined, _this.cfgManager.get('webVersion'));
                }
              }
            }
            origin && origin.call();
          };
        } catch (e) {
          Logger$6.ignore(e);
        }
      }
      // 读取并上报 localStorage 中历史上报失败后存储的异常
    }, {
      key: "checkCache",
      value: function checkCache() {
        var _this2 = this;
        setTimeout(function () {
          var preCache = DB.get();
          DB.clearAll();
          if (_typeof(preCache) === 'object' && Object.keys(preCache).length) {
            var cfgManager = _this2.cfgManager;
            var currVer = cfgManager.get('webVersion') || '';
            var originUrl = cfgManager.getApiPath(NAME$5) + "&p=".concat(cfgManager.get('project'));
            for (var key in preCache) {
              try {
                var data = preCache[key];
                if (data instanceof Array && data.length) {
                  var cacheVer = key === 'no-version' ? '' : key;
                  var url = cacheVer !== currVer ? Url$3.replaceParam(originUrl, 'webVersion', cacheVer) : originUrl;
                  doSend({
                    url: url,
                    data: data,
                    xhrRewritten: cfgManager.get('autoCatch').ajax ? true : false,
                    success: function success(res) {
                      return cfgManager.handleRemoteConfig(res);
                    }
                  });
                }
              } catch (e) {
                _this2.reportSystemError(e);
              }
            }
          }
        }, 4000);
      }
    }, {
      key: "reportSystemError",
      value: function reportSystemError(err) {
        var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (!err) return;
        try {
          var tags = opts.tags || {};
          var newOpts = extend$3(opts, {
            tags: extend$3(tags, {
              project: tags.project || this.cfgManager.get('project'),
              curPageUrl: tags.curPageUrl || this.cfgManager.get('pageUrl'),
              sdkVersion: Version
            })
          });
          if (!SysInstance) {
            newOpts.tags.reportBySelf = 0; // 标记一下，非自身sla实例上报
            // 这种情况下借助项目owl实例上报数据，防止数据丢失
            this.cache.push(new EM$1({
              project: 'owl',
              pageUrl: 'v_' + Version,
              category: opts.category || Category$1.SCRIPT,
              level: opts.level || Level.ERROR,
              realUrl: Util$9.getHref(),
              sec_category: err.message || err.name || 'parseError',
              content: err.stack ? JSON.stringify(err.stack) : err.toString && err.toString() || '',
              tags: newOpts.tags
            }));
            this.send(true);
            return;
          }
          SysInstance.addError(err, newOpts);
        } catch (e) {
          Logger$6.warn('raptor SDK SLA指标上报出错:', e);
        }
      }
    }, {
      key: "reportSystemWarn",
      value: function reportSystemWarn(err, opts) {
        if (!err) return;
        opts = opts || {};
        opts.level = Level.WARN;
        opts.tags = opts.tags || {};
        this.reportSystemError(err, opts);
      }
    }, {
      key: "_processError",
      value: function _processError(errObj) {
        var doFallback = function doFallback(err) {
          var name = err.message || err.name || 'Invalid_Error';
          var content = err instanceof Error ? err.toString() : JSON.stringify(err);
          return {
            category: Category$1.SCRIPT,
            sec_category: name,
            content: content
          };
        };
        var doParse = function doParse(err) {
          if (err.stack) {
            var info = err.stack.match('https?://[^\n]+');
            info = info ? info[0] : '';
            var jsReg = /https?:\/\/(\S)+\.js/;
            var scriptUrl = jsReg.test(info) ? info.match(jsReg)[0] : '';
            var rowCols = info.match(':(\\d+):(\\d+)');
            if (!rowCols) {
              rowCols = [0, 0, 0];
            }
            return {
              category: Category$1.SCRIPT,
              sec_category: err.message || err.name || '',
              content: err.stack,
              resourceUrl: scriptUrl,
              rowNum: rowCols[1],
              colNum: rowCols[2]
            };
          } else {
            return doFallback(err);
          }
        };
        try {
          return doParse(errObj);
        } catch (e) {
          this.reportSystemError(e);
          return doFallback(errObj);
        }
      }
    }, {
      key: "_push",
      value: function _push(error, opts) {
        error = this.parse(error);
        this.push(new EM$1(error), opts);
      }
      // 向错误队列增加资源错误 resourceError
    }, {
      key: "_pushResource",
      value: function _pushResource() {
        if (!this.cfgManager.isSampleHit('resource')) return;
        this._push.apply(this, arguments);
      }
      // 统一处理错误属性
    }, {
      key: "parse",
      value: function parse(error) {
        if (!error.project) {
          error.project = this.cfgManager.get('project');
        }
        if (!error.pageUrl) {
          error.pageUrl = this.cfgManager.get('pageUrl') || 'default';
        }
        if (!error.unionId) {
          error.unionId = this.cfgManager.getExtension('unionId');
        }
        error.realUrl = Util$9.getHref();
        return error;
      }
      // 格式化错误信息并 push 至错误队列中
    }, {
      key: "push",
      value: function push(error, opts) {
        var cfgManager = this.cfgManager;
        var errCfg = cfgManager.get(NAME$5);
        if (!error || !cfgManager.isSampleHit(NAME$5)) return;

        // format as ErrorModel
        if (!(error instanceof EM$1)) {
          if (error instanceof Error) {
            error = this._processError(error);
          } else if (typeof error === 'string') {
            error = {
              sec_category: error
            };
          } else if (_typeof(error) === 'object') {
            error = {
              sec_category: error.name || '',
              content: error.msg || ''
            };
          }
          error = this.parse(error);
          error = new EM$1(error);
        }
        if (error.content && error.content.length >= errCfg.maxSize) return;
        error.update(opts);
        try {
          var seen = [];
          var logInfo = JSON.stringify(error.toLoganJson(), function (k, v) {
            if (_typeof(v) === 'object' && v !== null) {
              if (seen.indexOf(v) >= 0) {
                return;
              }
              seen.push(v);
            }
            return v;
          });
          Logan$4._log("[Error]:".concat(logInfo), 'owl', error.level, [error.category]);
        } catch (e) {
          this.reportSystemError(e);
        }

        // 异常过滤策略 (Script error / filters / ignoreList.js)
        var isValid = true;
        if (cfgManager.get('noScriptError') && error.sec_category.indexOf('Script error') === 0) {
          return isValid = false;
        }
        var filters = cfgManager.filters;
        if (filters && filters.length) {
          for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            if (!filter.fn(error)) {
              return isValid = false;
            }
          }
        }
        var ignoreErrors = cfgManager.get('ignoreList').js;
        if (ignoreErrors && ignoreErrors.length) {
          for (var _i = 0; _i < ignoreErrors.length; _i++) {
            if (error.sec_category.indexOf(ignoreErrors[_i]) === 0) {
              isValid = false;
              break;
            }
          }
        }
        if (!isValid) return;

        // 广播自定义事件, 告知外部采集到了有效的异常信息
        try {
          if (window && window.dispatchEvent && error && error.getEventInfo) {
            var eventInfo = error.getEventInfo({
              pageId: cfgManager.get('pageId') || ''
            });
            var errEvent;
            if (typeof window.CustomEvent === 'function') {
              errEvent = new CustomEvent('owlErrDetected', {
                detail: eventInfo
              });
            } else if (document && typeof document.createEvent === 'function') {
              // polyfill CustomEvent for IE9+
              var evt = document.createEvent('CustomEvent');
              if (typeof evt.initCustomEvent === 'function') {
                errEvent = evt.initCustomEvent('owlErrDetected', false, false, eventInfo);
              }
            }
            errEvent && window.dispatchEvent(errEvent);
          }
        } catch (e) {
          this.reportSystemError(e);
        }
        if (!this.isExist(error)) {
          error = this._handleError(error);
          if (error) {
            this.cache.push(error);
            this.send();
          }
        }
      }
      // 判断错误是否已存在当前错误队列中
    }, {
      key: "isExist",
      value: function isExist(error) {
        for (var i = 0; i < this.cache.length; i++) {
          var element = this.cache[i];
          if (!(element instanceof EM$1)) {
            element = new EM$1(element);
          }
          if (element.isEqual(error)) {
            return true;
          }
        }
        return false;
      }
      // 异常上报前的拦截处理
    }, {
      key: "_handleError",
      value: function _handleError(instance) {
        try {
          var hook = this.cfgManager.get('onErrorPush');
          if (hook instanceof Function) {
            instance = hook(instance);
          }
          if (instance instanceof EM$1 || instance === undefined) {
            return instance;
          } else {
            Logger$6.ignore('onErrorPush 方法的返回值仅能为ErrorModel实例或undefined');
          }
        } catch (e) {
          Logger$6.ignore('onErrorPush 方法处理有误', e);
          return instance;
        }
      }
    }, {
      key: "report",
      value: function report() {
        this.push.apply(this, arguments);
        this.send(true);
      }
      // 异常上报流程
    }, {
      key: "send",
      value: function send(isReportNow) {
        var _this3 = this;
        var cfgManager = this.cfgManager;
        var errCfg = cfgManager.get(NAME$5);
        var comboTimeout = this.comboTimeout;

        // 限制 maxTime 内上报的异常数不能超过 maxNum
        var maxError = errCfg.maxNum || 100;
        var maxTime = errCfg.maxTime || 60 * 1000;
        var timeLimit = Date.now() - this.timeLimit;
        if (!this.isTimeLimit) {
          this.timeLimit = Date.now();
        }
        this.isTimeLimit = true;
        var comboReport = function comboReport() {
          if (!_this3.cache.length) return;
          clearTimeout(comboTimeout);
          comboTimeout = 0;
          try {
            _this3.errorCount += _this3.cache.length;
            if (timeLimit <= maxTime) {
              if (_this3.errorCount >= maxError) return;
            } else {
              _this3.isTimeLimit = false;
              _this3.errorCount = 0;
            }
          } catch (e) {
            Logger$6.ignore(e);
          }
          var cache = _this3.addCacheExtension();
          var ts = +new Date();
          var xhr = doSend({
            url: cfgManager.getApiPath(NAME$5) + "&pageId=".concat(cfgManager.get('pageId'), "&p=").concat(cfgManager.get('project')),
            data: cache,
            success: function success(res) {
              _this3.cacheSending[ts] = undefined;
              cfgManager.handleRemoteConfig(res);
            },
            fail: function fail() {
              try {
                if (!(cfgManager.get('disableCache') || window.Owl && window.Owl.cfgManager.get('disableCache'))) {
                  var record = _this3.cacheSending[ts];
                  if (record && record.cache && record.cache.length) {
                    DB.add(record.cache, cfgManager.get('webVersion'));
                  }
                }
                _this3.cacheSending[ts] = undefined;
              } catch (e) {
                _this3.cacheSending[ts] = undefined;
                Logger$6.ignore(e);
              }
            },
            xhrRewritten: cfgManager.get('autoCatch').ajax ? true : false
          });
          _this3.cacheSending[ts] = {
            xhr: xhr,
            cache: cache
          };
          _this3.cache = [];
        };
        var delay = errCfg.delay;
        if (isReportNow) {
          comboReport();
        } else if (!comboTimeout && delay !== -1) {
          comboTimeout = setTimeout(comboReport, delay);
        }
      }
      // 绑定 Extension 扩展信息
    }, {
      key: "addCacheExtension",
      value: function addCacheExtension() {
        var cache = this.cache;
        var ret = [];
        if (!(cache && cache.length)) return ret;
        var ext = this.cfgManager.getExtension();
        for (var i = 0; i < cache.length; i++) {
          var error = cache[i];
          if (ext && _typeof(ext) === 'object') {
            error = extend$3(error.toJson(), ext);
          }
          ret.push(error);
        }
        return ret;
      }
    }]);
    return ErrorManager;
  }();
  ErrorManager.setSysInstance = setSysInstance;
  var manager$2 = ErrorManager;

  var Util$8 = require$$9;
  var caniuse = {
    PerformanceObserver: function PerformanceObserver() {
      if (window.PerformanceObserver) {
        try {
          var chromeVersionReg = /Chrome\/(\d+)/;
          var UA = Util$8.getUserAgent();
          if (chromeVersionReg.test(UA)) {
            var version = UA.match(chromeVersionReg)[1];
            if (parseInt(version) > 59) return true;
          } else {
            return true;
          }
        } catch (e) {}
      }
    },
    MutationObserver: function MutationObserver() {
      if (window.MutationObserver) {
        try {
          // 处理IE11下开启首屏后的模板渲染异常问题
          var IEVersion = -1;
          var UA = Util$8.getUserAgent();
          if (UA.indexOf('compatible') > -1 && UA.indexOf('MSIE') > -1) {
            new RegExp('MSIE (\\d+\\.\\d+);').test(UA);
            IEVersion = parseFloat(RegExp['$1']);
          } else if (UA.indexOf('Trident') > -1 && UA.indexOf('rv:11.0') > -1) {
            IEVersion = 11;
          }
          if (IEVersion === -1 || IEVersion > 11) return true;
        } catch (e) {}
      }
    },
    PerformanceNow: function PerformanceNow() {
      return window.performance && window.performance.now && typeof window.performance.now === 'function' ? true : false;
    },
    GetEntries: function GetEntries() {
      return window.performance && typeof window.performance.getEntries === 'function' ? true : false;
    }
  };

  var patterns = {
    jsPattern: /\.js$/i,
    cssPattern: /\.css$/i,
    imgPattern: /\.(png|jpg|jpeg|gif|webp|ico|bmp|tiff|svg)$/i,
    urlPattern: /^(https?:\/\/[^/\r\n]+)(\/[^\r\n]*)?$/
  };

  var Logger$5 = require$$12["default"];
  function isBase64Img(src) {
    return src && src.slice(0, 10) === 'data:image';
  }
  function formatImageUrl(src) {
    var link = document.createElement('a');
    link.href = src;
    return link.href;
  }

  /**
   * extract img src from background prop
   * @param {*} src
   */
  function getImgSrcFromBackground(src, imgPattern) {
    var imgSrc;
    var matches = src.match(/url\(.*?\)/g);
    if (matches && matches.length) {
      // use the last one
      var urlStr = matches[matches.length - 1];
      var innerUrl = urlStr.replace(/^url\([\'\"]?/, '').replace(/[\'\"]?\)$/, '');
      // only url has .[img] extensions, but not base64
      if (imgPattern.test(innerUrl) && !isBase64Img(innerUrl)) {
        imgSrc = innerUrl;
      }
    }
    return imgSrc;
  }

  /**
   * filter both img and node with background-image prop setted
   * @param {*} node
   */
  function getImgSourceFromDom(node, imgPattern) {
    if (node.nodeName.toUpperCase() === 'IMG') {
      // also include img with data-srcset attribute
      return node.getAttribute('data-srcset') || node.getAttribute('src');
    } else {
      var computedStyle = window.getComputedStyle(node);
      var backgroundProp = computedStyle.getPropertyValue('background-image') || computedStyle.getPropertyValue('background');
      return getImgSrcFromBackground(backgroundProp, imgPattern);
    }
  }

  /**
   * using NodeIterator to filter all dom element, including elements with background-image setted.
   * but node with @ignoreTag attribute specified will be ignored
   * @param {*} ignoreTag
   */
  function getDomImgs(ignoreTag, imgPattern, scrollDom) {
    var domImages = [];
    try {
      var iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, function (node) {
        if (node && node.getAttribute && !node.hasAttribute("".concat(ignoreTag))) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }, false);
      var currentNode = iterator.nextNode();
      while (currentNode) {
        var imgSrc = getImgSourceFromDom(currentNode, imgPattern);
        if (!imgSrc) {
          currentNode = iterator.nextNode();
          continue;
        }
        if (isInFirstScreen(currentNode, scrollDom) && !isBase64Img(imgSrc)) {
          domImages.push(formatImageUrl(imgSrc));
        }
        currentNode = iterator.nextNode();
      }
    } catch (e) {
      console.log('getDomImgs err');
    }
    return domImages;
  }

  /**
   * judge whether a node is in first screen area (top: 0, left: 0, width: 100vw, height: 100vh)
   * @param {*} currentNode
   */
  function isInFirstScreen(currentNode, scrollDom) {
    if (!currentNode) {
      return false;
    }
    var _currentNode$getBound = currentNode.getBoundingClientRect(),
      top = _currentNode$getBound.top,
      left = _currentNode$getBound.left,
      right = _currentNode$getBound.right,
      bottom = _currentNode$getBound.bottom;
    // display:none element
    if (!top && !bottom) {
      return false;
    }

    /* 如果在结构上的首屏内（上下、左右）
       当整体页面有绝对定位时，则选实际滚动的DOM作为标准，window的滚动已经失效 */
    var scrollTop;
    if (scrollDom) {
      scrollTop = document.getElementById(scrollDom).scrollTop;
    } else {
      scrollTop = window.scrollY || window.pageYOffset;
    }
    if (scrollTop + top < window.innerHeight && right > 0 && left < window.innerWidth) {
      return true;
    }
    return false;
  }

  /**
   * filter img timing resource that only in first screen, excluding ignored element
   * @param {*} ignoreTag
   */
  function getImageTimingsInFirstScreen(ignoreTag, imgPattern, scrollDom) {
    // only when performance supported
    if (!window.performance || !window.performance.getEntriesByType) {
      return [];
    }
    var result = [];
    try {
      // retrieve img resource timing
      var imageResources = window.performance.getEntriesByType('resource')
      // filter img and background image timing resource
      .filter(function (s) {
        return s.initiatorType === 'img' || s.initiatorType === 'css';
      }).map(function (s) {
        return {
          name: s.name.split(':')[1] || s.name,
          // escape protocol
          responseEnd: s.responseEnd,
          connectEnd: s.connectEnd,
          duration: s.duration
        };
      });
      // filter first screen img resource
      var domImages = getDomImgs(ignoreTag, imgPattern, scrollDom).join('###');
      // filter first screen img timing, in descend order
      result = imageResources.filter(function (img) {
        return domImages.indexOf(img.name) !== -1;
      }).map(function (s) {
        var time = s.responseEnd || s.connectEnd + s.duration;
        return {
          name: s.name,
          time: time
        };
      }).sort(function (s1, s2) {
        return s2.time - s1.time;
      });
      Logger$5.logScreen('首屏内图片的加载时间', result);
      return result.map(function (img) {
        return img.time;
      });
    } catch (err) {
      result = [];
    }
    return result;
  }
  var img = {
    getImageTimingsInFirstScreen: getImageTimingsInFirstScreen,
    isInFirstScreen: isInFirstScreen
  };

  var ImgUtils = img;
  var Logger$4 = require$$12["default"];
  var CanIUse$1 = caniuse;
  var Util$7 = require$$9;
  var mutaRecords = []; // 记录 mutation 新增节点及其对应时间
  var domTimer = null; // DOM 变化监听计时器
  var perfTimer = null; // 资源请求监听计时器
  var domDone = false; // DOM 变化监听结束标记
  var perfDone = false; // 资源请求监听结束标记
  var senseTime; // 存放 FST 和 FCP 时间
  var FCP = -1; // 模拟的 first contentful paint 时间
  var ignoreFirstScreenImg; // 是否忽略首屏内图片的加载
  var outCount = 0; // 记录检测到首屏外 mutation 的次数
  var scrollDom;
  var MaxOutCount = 15; // 检测到首屏外 mutation 次数阈值
  var STOPTIME = 3000; // 默认的停止监听超时阈值
  var MinScore = 3; // 有效 DOM 变更的最小权重阈值
  var ELEMENT_WEIGHT = 1; // 元素权重的基本权重
  var DEP_WEIGHT = 0; // 元素权重的深度权重
  var NodesFilter$1 = ['HTML', 'HEAD', 'META', 'LINK', 'SCRIPT', 'STYLE', 'NOSCRIPT']; // 非视觉元素

  var ArraySlice = Array.prototype.slice;
  var parseInt$3 = Number.parseInt || window.parseInt;
  var NAME$4 = 'page';
  var FirstScreenManager$1 = /*#__PURE__*/function () {
    function FirstScreenManager(cfgManager, pageManager) {
      _classCallCheck(this, FirstScreenManager);
      this.cfgManager = cfgManager;
      this.pageManager = pageManager;
      this.pageData = [];
      this.observer = null;
      this.disableMutaObserver = false;
      var pageCfg = cfgManager.get(NAME$4);
      var mutaStopTime = parseInt$3(pageCfg.mutaStopTime || 0);
      this.mutaStopTime = mutaStopTime > STOPTIME ? mutaStopTime : STOPTIME;
      this.perfObserver = null;
      this.ignoreDom = pageCfg.ignoreAttr || 'owl-ignore';
      this.imgPattern = /(\.)(png|jpg|jpeg|gif|webp|ico|bmp|tiff|svg)/i;
      this.noCheckOuterMutaCount = pageCfg.noCheckOuterMutaCount;
      this.canStartObserver = CanIUse$1.PerformanceNow() && CanIUse$1.MutationObserver();
      this.spaRoutesData = {};
      this.MaxOutCount = pageCfg.MaxOutCount || MaxOutCount;
      scrollDom = pageCfg.scrollDom;
      if (window._Owl_) {
        this.pageData = window._Owl_.pageData;
        this.observer = window._Owl_.observer;
        this.disableMutaObserver = window._Owl_.disableMutaObserver;
      }
      // 要求算法开始前body已存在, 新的observer能以body作为目标, 取代document来缩小监听范围
      if (this.disableMutaObserver || !document.body) {
        domDone = true;
        perfDone = true;
        try {
          this.observer && this.observer.disconnect();
        } catch (e) {}
      }
    }
    /**
     * 配置 DOM 变化和资源请求的监听及回调
     *
     * @memberof FirstScreenManager
     */
    _createClass(FirstScreenManager, [{
      key: "mutaObserver",
      value: function mutaObserver() {
        var _this = this;
        if (!this.canStartObserver || domDone) return;
        if (this.observer && this.observer.disconnect) {
          // 关闭预采集模块中创建的observer并处理之前记录的mutation
          try {
            this.observer.disconnect();
            this.observer = null;
            if (this.pageData && this.pageData.length) {
              this.pageData.forEach(function (item) {
                _this.mutaCallback(item.mutations, item.startTime, false);
              });
              // clear this.pageData
            }
          } catch (e) {
            console.log('observer disconnect err');
          }
        }
        var pageConfig = this.cfgManager.get(NAME$4);
        try {
          // 创建新的observer, 以body为目标来缩小监听范围
          this.observer = new MutationObserver(function (mutations) {
            var time = performance.now();
            _this.mutaCallback(mutations, time, true);
          });
          this.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          this.resetTimer(true);

          // 页面加载完成之后, 响应用户交互来停止DOM变化监听
          if (pageConfig.interactToStopObserver === true && document && document.addEventListener) {
            if (document.readyState === 'complete') {
              this.interactToStopObserver();
            } else {
              var ADD_EVENT = window.addEventListener || window.attachEvent;
              ADD_EVENT('load', function () {
                _this.interactToStopObserver();
              });
            }
          }
        } catch (e) {
          console.log('observer observe err');
        }

        // 忽略首屏内图片的加载请求
        ignoreFirstScreenImg = pageConfig.disableSensoryImageIndex;
        perfDone = ignoreFirstScreenImg || perfDone;
        if (!perfDone) {
          this.registerPerfObserver();
        }
      }
      /**
       * 开启资源请求的监听
       *
       * @memberof FirstScreenManager
       */
    }, {
      key: "registerPerfObserver",
      value: function registerPerfObserver() {
        var _this2 = this;
        var disablePerfObserver = this.cfgManager.get('resource').disablePerformanceObserver || false;
        if (CanIUse$1.PerformanceObserver() && disablePerfObserver !== true) {
          // 8s图片监听超时时间, 防止perfDone不会变成true, 导致无法进入最终的回调
          var perTimer = setTimeout(function () {
            _this2.perfObserverStop();
          }, 8000);
          this.perfObserver = new window.PerformanceObserver(function () {
            clearTimeout(perfTimer);
            perfTimer = setTimeout(function () {
              clearTimeout(perTimer);
              _this2.perfObserverStop();
            }, STOPTIME);
          });
          this.perfObserver.observe({
            entryTypes: ['resource']
          });
        } else {
          perfDone = true;
        }
      }
    }, {
      key: "getSensoryIndex",
      value: function getSensoryIndex(callback) {
        var _this3 = this;
        var doneTimer = 0;
        // 8s超时监听, 防止无法执行callback并导致不上报测速点
        var fstTimer = setTimeout(function () {
          clearInterval(doneTimer);
          _this3.mutaObserverStop();
          _this3.perfObserverStop();
          callback(senseTime);
        }, 8000);
        var getSense = function getSense() {
          if (domDone && perfDone) {
            clearInterval(doneTimer);
            clearTimeout(fstTimer);
            if (senseTime) {
              if (!ignoreFirstScreenImg) {
                caculateImageTiming(_this3.ignoreDom, _this3.imgPattern);
              }
              callback(senseTime);
            } else {
              callback();
            }
          }
        };
        doneTimer = setInterval(getSense, 500);
      }
    }, {
      key: "resetTimer",
      value: function resetTimer(newTimer) {
        var _this4 = this;
        if (domTimer) clearTimeout(domTimer);
        if (newTimer) {
          domTimer = setTimeout(function () {
            Logger$4.logScreen("".concat(_this4.mutaStopTime, "ms\u65F6\u95F4\u5185\u6CA1\u6709\u76D1\u542C\u5230\u65B0\u7684DOM\u53D8\u5316, \u505C\u6B62DOM\u53D8\u5316\u76D1\u542C"));
            _this4.mutaObserverStop();
          }, this.mutaStopTime);
        }
      }
      /**
       * mutation 回调: 记录变更时间和元素集合, 存储到 mutaRecords, 用于 FST 的计算
       * @param mutations
       * @param startTime
       * @param reset 是否重置计时器
       */
    }, {
      key: "mutaCallback",
      value: function mutaCallback(mutations, startTime, reset) {
        var _this5 = this;
        if (reset) this.resetTimer(true);
        startTime = startTime || performance.now();

        // 为什么要用那么多个setTimeout？是否形成了多个闭包从而影响了性能？
        setTimeout(function () {
          // 已达到停止DOM变化监听的条件后, 不再处理还未处理的mutations
          if (domDone) return;
          Logger$4.logScreen('DOM原始变更:', startTime, mutations);
          // 筛选有效的MutationRecord
          mutations.filter(function (mutation) {
            var targetNodeName = (mutation.target.nodeName || '').toUpperCase();
            return mutation.type === 'childList' && targetNodeName && NodesFilter$1.indexOf(targetNodeName) < 0 && mutation.addedNodes && mutation.addedNodes.length;
          }).forEach(function (mutation) {
            if (domDone) return;

            // 筛选有效的新增节点
            var addedNodes = ArraySlice.call(mutation.addedNodes, 0).filter(function (node) {
              var nodeName = (node.nodeName || '').toUpperCase();
              return node.nodeType === 1 &&
              // 忽略非元素节点
              nodeName && NodesFilter$1.indexOf(nodeName) < 0 &&
              // 忽略非视觉元素
              nodeName !== 'IFRAME' &&
              // 忽略iframe
              node.isConnected !== false &&
              // 忽略未挂载至DOM树的元素
              !shouldIgnoreNode(node, _this5.ignoreDom); // 忽略业务手动配置的元素
            });
            if (!(addedNodes && addedNodes.length && addedNodes[0])) return;

            // 记录筛选后的新增节点及其对应时间, 用于之后FST的计算
            mutaRecords.push({
              nodes: addedNodes,
              startTime: startTime
            });
            var firstNode = addedNodes[0];
            // 模拟白屏时间 FCP - first contentful paint
            if (FCP < 0) {
              calcuFCP(firstNode, startTime);
            }

            /* 检测到有效的首屏外mutation的次数达到阈值时, 停止DOM变化监听
               此处的rect可以记录下来供后面使用, 减少getBoundingClientRect的执行次数(important) */
            try {
              if (!_this5.noCheckOuterMutaCount) {
                var rect = firstNode.getBoundingClientRect && firstNode.getBoundingClientRect();
                if (rect && rect.width && rect.height && rect.top >= (window.innerHeight || 0)) {
                  // 此处的判断逻辑是否应该加强？
                  Logger$4.logScreen("\u68C0\u6D4B\u5230\u9996\u5C4F\u5916\u8282\u70B9\u6B21\u6570: ".concat(++outCount, "\u6B21, \u8282\u70B9\u5185\u5BB9\u4E3A:"), addedNodes);
                  if (outCount >= _this5.MaxOutCount) {
                    Logger$4.logScreen("\u68C0\u6D4B\u5230\u9996\u5C4F\u5916mutation\u8FBE\u5230 ".concat(_this5.MaxOutCount, " \u6B21, \u505C\u6B62DOM\u53D8\u5316\u76D1\u542C"));
                    _this5.mutaObserverStop();
                  }
                }
              }
            } catch (e) {
              Util$7.reportSysWarn(e);
            }

            // 支持自定义响应用户交互后停止DOM变化监听
            if (document && document.querySelectorAll) {
              addedNodes.forEach(function (node) {
                _this5.addEventToStopObserver(node);
              });
            }
          });
        }, 0);
      }
      /**
       * 关闭MutationObserver, 并开始进行计算
       *
       * @memberof FirstScreenManager
       */
    }, {
      key: "mutaObserverStop",
      value: function mutaObserverStop() {
        if (this.observer && this.observer.disconnect) {
          try {
            this.observer.disconnect();
            this.observer = null;
            var config = this.cfgManager.get(NAME$4);
            markMeasure(config.sensoryIndex || config.manualReportFST);
            this.resetTimer(false);
          } catch (e) {
            console.log('observer disconnect err');
          }
        }
      }
    }, {
      key: "perfObserverStop",
      value: function perfObserverStop() {
        try {
          if (this.perfObserver && this.perfObserver.disconnect) {
            this.perfObserver.disconnect();
            this.perfObserver = null;
          }
          perfDone = true;
        } catch (e) {
          console.log('perfObserver disconnect err');
        }
      }
      // 支持业务自定义响应用户交互以停止DOM变化监听
    }, {
      key: "addEventToStopObserver",
      value: function addEventToStopObserver(node) {
        var _this6 = this;
        ArraySlice.call(node.querySelectorAll('[interactive]'), 0).forEach(function (eventNode) {
          var type = eventNode.getAttribute('interactive') || 'click';
          var callback = function callback() {
            _this6.mutaObserverStop();
            eventNode.removeEventListener(type, callback);
          };
          eventNode.addEventListener(type, callback);
        });
      }
      // 全局响应用户交互以停止DOM变化监听
    }, {
      key: "interactToStopObserver",
      value: function interactToStopObserver() {
        var _this7 = this;
        if (domDone) return;
        var callback = function callback() {
          if (domDone) {
            removeListener();
            return;
          }
          Logger$4.logScreen('onload后响应到用户交互事件, 停止DOM变化监听');
          _this7.mutaObserverStop();
          removeListener();
        };
        var removeListener = function removeListener() {
          document.removeEventListener('click', callback);
          document.removeEventListener('wheel', callback);
          document.removeEventListener('touchmove', callback);
        };
        document.addEventListener('click', callback, true);
        document.addEventListener('focus', callback, true);
        document.addEventListener('wheel', callback, true);
        document.addEventListener('touchmove', callback, true);
      }
    }, {
      key: "startRouteMutaObserver",
      value: function startRouteMutaObserver(path) {
        var _this8 = this;
        if (!domDone || !this.canStartObserver || !document.body) return;

        // 初始化路由页面的首屏计算信息
        var start = performance.now();
        var routeInfo = {
          start: start,
          pageUrl: '',
          observer: null,
          mutaRecords: [],
          domTimer: null,
          domDone: false,
          outCount: 0,
          fst: 0,
          interactCallback: null
        };
        this.spaRoutesData[path] = routeInfo;
        Logger$4.logScreen("[".concat(path, "] ").concat(start, " \u65F6\u523B\u5F00\u59CB\u9996\u5C4F\u8BA1\u7B97"));
        try {
          routeInfo.observer = new MutationObserver(function (mutations) {
            _this8.routeMutaCallback(path, mutations);
          });
          routeInfo.observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          this.resetRouteTimer(path, true);
          setTimeout(function () {
            _this8.interactToStopRouteObserver(path);
          }, 0);
        } catch (e) {}
      }
    }, {
      key: "stopRouteMutaObserver",
      value: function stopRouteMutaObserver(prevPath) {
        var routeInfo = this.spaRoutesData[prevPath];
        if (routeInfo && !routeInfo.domDone) {
          // 上一页面尚未停止 DOM 变化的监听
          routeInfo.domDone = true;
          this.removeRouteInteractListener(prevPath);
          this.resetRouteTimer(prevPath, false);
          routeInfo.observer.disconnect();
          routeInfo.observer = null;
        }
        delete this.spaRoutesData[prevPath]; // 清空上一个路由数据，避免频繁切换路由清空下的内存溢出
      }
    }, {
      key: "resetRouteTimer",
      value: function resetRouteTimer(path, newTimer) {
        var _this9 = this;
        var routeInfo = this.spaRoutesData[path];
        if (routeInfo) {
          routeInfo.domTimer && clearTimeout(routeInfo.domTimer);
          if (newTimer) {
            routeInfo.domTimer = setTimeout(function () {
              Logger$4.logScreen("[".concat(path, "] ").concat(_this9.mutaStopTime, "ms\u5185\u65E0\u65B0\u7684DOM\u53D8\u5316, \u505C\u6B62\u76D1\u542C"));
              _this9.routeMutaStop(path);
            }, this.mutaStopTime);
          } else {
            routeInfo.domTimer = null;
          }
        }
      }
    }, {
      key: "routeMutaCallback",
      value: function routeMutaCallback(path, mutations) {
        var _this10 = this;
        var routeInfo = this.spaRoutesData[path];
        if (!routeInfo || routeInfo.domDone) return;
        var startTime = performance.now();
        this.resetRouteTimer(path, true);
        Logger$4.logScreen("[".concat(path, "] DOM\u53D8\u5316\u539F\u59CB\u5185\u5BB9: "), startTime, mutations);
        mutations.filter(function (mutation) {
          var targetNodeName = (mutation.target.nodeName || '').toUpperCase();
          return mutation.type === 'childList' && targetNodeName && NodesFilter$1.indexOf(targetNodeName) < 0 && mutation.addedNodes && mutation.addedNodes.length;
        }).forEach(function (mutation) {
          if (!routeInfo || routeInfo.domDone) return;
          var addedNodes = ArraySlice.call(mutation.addedNodes, 0).filter(function (node) {
            var nodeName = (node.nodeName || '').toUpperCase();
            return node.nodeType === 1 && nodeName && NodesFilter$1.indexOf(nodeName) < 0 && nodeName != 'IFRAME' && node.isConnected !== false && !shouldIgnoreNode(node, _this10.ignoreDom);
          });
          if (!(addedNodes && addedNodes.length && addedNodes[0])) return;
          routeInfo.mutaRecords.push({
            nodes: addedNodes,
            startTime: startTime
          });
          try {
            var rect = addedNodes[0].getBoundingClientRect();
            if (rect && rect.width && rect.height && rect.top >= (window.innerHeight || 0)) {
              Logger$4.logScreen("[".concat(path, "] \u68C0\u6D4B\u5230\u9996\u5C4F\u5916mutation ").concat(++routeInfo.outCount, "\u6B21: "), addedNodes);
              if (routeInfo.outCount >= _this10.MaxOutCount) {
                Logger$4.logScreen("[".concat(path, "] \u68C0\u6D4B\u5230\u9996\u5C4F\u5916mutation\u8FBE\u5230 ").concat(_this10.MaxOutCount, "\u6B21, \u505C\u6B62\u76D1\u542C"));
                _this10.routeMutaStop(path);
              }
            }
          } catch (e) {}
        });
      }
    }, {
      key: "routeMutaStop",
      value: function routeMutaStop(path) {
        try {
          var routeInfo = this.spaRoutesData[path];
          if (!routeInfo) return;
          if (routeInfo.domDone) {
            delete this.spaRoutesData[path]; // 清空数据
            return;
          }
          routeInfo.domDone = true;
          routeInfo.observer && routeInfo.observer.disconnect();
          routeInfo.observer = null;
          this.removeRouteInteractListener(path);
          this.resetRouteTimer(path, false);
          var validRecords = [];
          Logger$4.logScreen("[".concat(path, "] \u7B5B\u9009\u540E\u7684\u6709\u6548DOM\u53D8\u5316: "), routeInfo.mutaRecords);
          routeInfo.mutaRecords.forEach(function (_ref) {
            var nodes = _ref.nodes,
              startTime = _ref.startTime;
            var validNodes = [];
            nodes.forEach(function (node) {
              var _ref2 = node.style || {},
                visibility = _ref2.visibility,
                display = _ref2.display;
              if (visibility != 'hidden' && display != 'none') {
                var rect = node.getBoundingClientRect && node.getBoundingClientRect();
                if (inViewPort(rect)) {
                  validNodes.push({
                    node: node,
                    rect: rect
                  });
                }
              }
            });
            if (validNodes.length) {
              var score = calScore(validNodes);
              if (score) {
                validRecords.push({
                  score: score,
                  startTime: startTime,
                  validNodes: validNodes
                });
                Logger$4.logScreen("[".concat(path, "] \u6709\u6548\u7684\u9996\u5C4F\u65B0\u589E\u8282\u70B9, \u6743\u91CD\u53CA\u65F6\u523B: "), validNodes, score, startTime);
              }
            }
          });
          routeInfo.mutaRecords = [];
          var routeFstEnd = getFST(validRecords, path);
          var result = parseInt$3(routeFstEnd - routeInfo.start);
          Logger$4.logScreen("[".concat(path, "] DOM\u9996\u5C4F\u65F6\u95F4\u7684\u8BA1\u7B97\u7ED3\u679C\u4E3A: ").concat(result));
          if (result > 0) {
            routeInfo.fst = result;
            routeInfo.pageUrl = this.cfgManager.get('pageUrl');
            this.pageManager.reportRouteFst(result, routeInfo.pageUrl);
          }
        } catch (e) {}
      }
    }, {
      key: "removeRouteInteractListener",
      value: function removeRouteInteractListener(path) {
        var routeInfo = this.spaRoutesData[path];
        if (!routeInfo || !routeInfo.interactCallback) return;
        document.removeEventListener('click', routeInfo.interactCallback);
        document.removeEventListener('wheel', routeInfo.interactCallback);
        document.removeEventListener('touchmove', routeInfo.interactCallback);
      }
    }, {
      key: "interactToStopRouteObserver",
      value: function interactToStopRouteObserver(path) {
        var _this11 = this;
        var routeInfo = this.spaRoutesData[path];
        if (!routeInfo || routeInfo.domDone) return;
        routeInfo.interactCallback = function () {
          Logger$4.logScreen("[".concat(path, "] \u54CD\u5E94\u5230\u7528\u6237\u4EA4\u4E92\u4E8B\u4EF6, \u505C\u6B62\u76D1\u542C"));
          _this11.routeMutaStop(path);
        };
        document.addEventListener('click', routeInfo.interactCallback, true);
        document.addEventListener('focus', routeInfo.interactCallback, true);
        document.addEventListener('wheel', routeInfo.interactCallback, true);
        document.addEventListener('touchmove', routeInfo.interactCallback, true);
      }
    }]);
    return FirstScreenManager;
  }(); // 使用HTML标签属性自定义忽略一些元素
  function shouldIgnoreNode(node, ignoreDom) {
    var ignore = false;
    if (ignoreDom) {
      ignore = !!(node.closest && node.closest("[".concat(ignoreDom, "]"))) || node.hasAttribute && node.hasAttribute(ignoreDom);
    }
    if (ignore) {
      Logger$4.logScreen('自定义忽略元素: ', node);
    }
    return ignore;
  }

  // 模拟计算首次内容绘制时间
  function calcuFCP(node, time) {
    // 浏览器支持Paint Timing时模拟时间置为0
    if (performance && performance.getEntriesByType && performance.getEntriesByType('paint') && document && document.body && document.body.innerText !== '') {
      FCP = 0;
    } else if (node && (node.nodeType === 3 || node.innerText !== '') || document.querySelector && document.querySelector('img')) {
      FCP = parseInt$3(time || 0);
    }
  }
  function markMeasure(fstFlag) {
    if (domDone) return;
    calcuFST(fstFlag);
  }
  function calcuFST(flag) {
    var validRecords = [];
    if (flag) {
      Logger$4.logScreen('筛选后的有效DOM变更:', mutaRecords);
      mutaRecords.forEach(function (_ref3) {
        var nodes = _ref3.nodes,
          startTime = _ref3.startTime;
        var validNodes = [];
        nodes.forEach(function (node) {
          // 筛选首屏内可见节点
          var _ref4 = node.style || {},
            visibility = _ref4.visibility,
            display = _ref4.display;
          if (visibility !== 'hidden' && display !== 'none') {
            var rect = node.getBoundingClientRect && node.getBoundingClientRect(); // [text]元素无此方法
            if (inViewPort(rect)) {
              validNodes.push({
                node: node,
                rect: rect
              });
            }
          }
        });
        if (validNodes.length) {
          var score = calScore(validNodes);
          if (score) {
            validRecords.push({
              score: score,
              startTime: startTime,
              validNodes: validNodes
            });
            Logger$4.logScreen('有效的首屏内新增节点:', validNodes, '新增节点的权重和发生时间:', score, startTime);
          }
        }
      });
    }
    domDone = true;
    mutaRecords = [];
    var FST = getFST(validRecords);
    senseTime = {
      FST: FST,
      FCP: FCP || 0
    };
    Logger$4.logScreen('最终DOM首屏时间的计算结果为: ', FST);
  }

  // 判断节点是否在视口范围内
  function inViewPort(rect) {
    var _ref5 = rect || {},
      width = _ref5.width,
      height = _ref5.height,
      top = _ref5.top,
      right = _ref5.right,
      bottom = _ref5.bottom,
      left = _ref5.left;
    var windowHeight = window.innerHeight || 0;
    var windowWidth = window.innerWidth || 0;
    // 节点在视口外的条件: 节点和视口无重合区域
    return width > 0 && height > 0 && bottom > 0 && top < windowHeight && right > 0 && left < windowWidth;
  }

  // 计算新增节点的权重和
  function calScore(wrapedNodes) {
    return wrapedNodes.reduce(function (score, it) {
      return score + depScore(it, 0);
    }, 0);
  }

  // 遍历子节点计算权重 (深度优先)
  function depScore(wrapedNode, dep) {
    // 优先使用缓存数据
    var node = wrapedNode.node,
      rect = wrapedNode.rect;
    var _ref6 = node.style || {},
      visibility = _ref6.visibility,
      display = _ref6.display;

    // 1.隐藏元素直接返回
    if (visibility === 'hidden' || display === 'none') return 0;

    // 2.文本元素: 首字符非回车换行 (浏览器注入较多空白文本元素)
    if (node.nodeType === 3) {
      if (node.textContent) {
        var firstChar = node.textContent.charCodeAt(0);
        if (firstChar !== 10 && firstChar !== 13) {
          return dep + ELEMENT_WEIGHT;
        }
      }
      return 0;
    }

    // 3.遍历子元素: 若子元素均不可见则退化为叶节点
    if (node.childNodes && node.childNodes.length) {
      var subScore = ArraySlice.call(node.childNodes, 0).reduce(function (score, node) {
        return score + depScore({
          node: node
        }, dep + DEP_WEIGHT);
      }, 0);
      if (subScore > 0) return subScore + ELEMENT_WEIGHT;
    }

    // 4.叶节点
    var _ref7 = rect || {
        width: node.clientWidth,
        height: node.clientHeight
      },
      width = _ref7.width,
      height = _ref7.height;
    return width > 0 && height > 0 ? dep + ELEMENT_WEIGHT : 0;
  }

  // 选取权重大于阈值的最后一次变更
  function getFST(records, routePath) {
    if (!(records && records.length)) return 0;

    // 合并同时或紧邻的两次记录 (startTime差小于1)
    var batchRecords = records.reduce(function (tempArr, current) {
      var prev = tempArr[tempArr.length - 1];
      if (prev && current.startTime - prev.startTime < 1) {
        prev.score += current.score;
      } else {
        tempArr.push({
          score: current.score,
          startTime: current.startTime,
          nodes: current.validNodes
        });
      }
      return tempArr;
    }, []);
    Logger$4.logScreen('合并后的首屏新增节点权重记录:', batchRecords);

    // 选择最后一次有效的首屏内DOM变更记录 (最后一次新增节点权重大于阈值3的变更)
    var bestMatch = batchRecords.reduce(function (prev, current) {
      return !prev || current.score > Math.min(prev.score, MinScore) ? current : prev;
    }, null);
    var result = parseInt$3(bestMatch && bestMatch.startTime || 0);
    if (!routePath && window.Owl && bestMatch) {
      window.Owl.fstInfo = {
        domFST: result,
        decisiveNode: bestMatch.nodes && bestMatch.nodes[0] ? bestMatch.nodes[0].node : ''
      };
    }
    return result;
  }
  function caculateImageTiming(ignoreTag, imgPattern) {
    var inScreenImgTimes = ImgUtils.getImageTimingsInFirstScreen(ignoreTag, imgPattern, scrollDom);
    if (senseTime && inScreenImgTimes.length) {
      var imageFST = Math.round(inScreenImgTimes[0]);
      senseTime.FST = Math.max(senseTime.FST, imageFST);
      Logger$4.logScreen('首屏图片时间: ', imageFST);
      Logger$4.logScreen('最终首屏时间: ', senseTime.FST);
      if (window.Owl && window.Owl.fstInfo) {
        window.Owl.fstInfo.imgFST = imageFST;
      }
    }
  }
  var firstScreen = FirstScreenManager$1;

  var Ajax$3 = xhr$1;
  var Url$2 = url;
  var Extend = extend$5;
  var Logan$3 = logan;
  var Logger$3 = require$$12["default"];
  var CanIUse = caniuse;
  var jsPattern$1 = patterns.jsPattern,
    cssPattern$1 = patterns.cssPattern,
    imgPattern$1 = patterns.imgPattern,
    urlPattern = patterns.urlPattern;
  var FirstScreenManager = firstScreen;
  var parseInt$2 = Number.parseInt || window.parseInt;
  var NAME$3 = 'page';
  var parseTime = function parseTime(time) {
    var temp = Math && Math.round ? Math.round(time) : time;
    return parseInt$2(temp);
  };
  var PageManager$1 = /*#__PURE__*/function () {
    function PageManager(cfgManager, errManager) {
      _classCallCheck(this, PageManager);
      this.cfgManager = cfgManager;
      this.errManager = errManager;
      this.points = [];
      this.pointsCustom = [];
      this.noCache = 'false';
      this.titansTags = {};
    }
    /* 因为FST指标是load后计算，期间用户可能跳转页面或对config进行设置，所以预先存储pageUrl和project
       如果用户是手动调用fst计算，那初始预存的值可能不正确，用户可以自行指定需要上报的pageUrl和project */
    _createClass(PageManager, [{
      key: "setInitConfig",
      value: function setInitConfig(initConfig) {
        initConfig = initConfig || {};
        this.initialPage = initConfig.pageUrl || this.cfgManager.get('pageUrl');
        this.initialProject = initConfig.project || this.cfgManager.get('project');
      }
      // custom points ready
    }, {
      key: "setUserReady",
      value: function setUserReady() {
        if (this.cfgManager.get(NAME$3).auto) return;
        this.cfgManager.set({
          page: {
            auto: true
          }
        });
      }
    }, {
      key: "getUserReady",
      value: function getUserReady() {
        return this.cfgManager.get(NAME$3).auto;
      }
      // default points ready
    }, {
      key: "setReady",
      value: function setReady() {
        this.isReady = true;
      }
    }, {
      key: "getReady",
      value: function getReady() {
        return this.isReady;
      }
    }, {
      key: "getPerformaceTiming",
      value: function getPerformaceTiming() {
        return {
          perf: window.performance && window.performance.timing,
          paint: window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('paint')
        };
      }
      // get resource timing of critical resources
    }, {
      key: "getMainResourceTiming",
      value: function getMainResourceTiming() {
        var resourceTiming = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('resource');
        var filter = this.cfgManager.get(NAME$3).isMainResource;
        var mainResourceTiming = [];
        try {
          if (!resourceTiming) return;
          if (typeof filter === 'function') {
            for (var i = 0; i < resourceTiming.length; i++) {
              var item = resourceTiming[i];
              if (filter(item)) {
                mainResourceTiming.push(item);
              }
            }
            return mainResourceTiming;
          } else {
            for (var _i = 0; _i < resourceTiming.length; _i++) {
              var resource = resourceTiming[_i];
              if (resource.initiatorType === 'link' || resource.initiatorType === 'script') {
                mainResourceTiming.push(resource);
              }
            }
            var size = this.cfgManager.get(NAME$3).mainResourceNumber;
            if (mainResourceTiming.length <= size) {
              return mainResourceTiming;
            } else {
              return mainResourceTiming.splice(0, size);
            }
          }
        } catch (e) {
          Logger$3.ignore(e);
        }
      }
      // 启动首屏时间 FST 的计算
    }, {
      key: "sensoryObserver",
      value: function sensoryObserver() {
        this.firstScreenManager = new FirstScreenManager(this.cfgManager, this);
        this.firstScreenManager.mutaObserver();
      }
    }, {
      key: "getRouteFst",
      value: function getRouteFst(path, prevPath) {
        if (this.firstScreenManager && path) {
          if (prevPath) {
            this.firstScreenManager.stopRouteMutaObserver(prevPath);
          }
          if (this.cfgManager.isSampleHit(NAME$3)) {
            this.firstScreenManager.startRouteMutaObserver(path);
          }
        }
      }
    }, {
      key: "reportRouteFst",
      value: function reportRouteFst(result, pageUrl) {
        var _this = this;
        var cfgManager = this.cfgManager;
        setTimeout(function () {
          var points = [];
          points[27] = result;
          var data = Extend({
            project: cfgManager.get('project'),
            pageurl: encodeURIComponent(pageUrl),
            speed: encodeURIComponent(points.join('|')),
            customspeed: '',
            timestamp: +new Date(),
            noCache: _this.noCache,
            pageId: cfgManager.get('pageId'),
            ctags: encodeURIComponent(JSON.stringify(cfgManager.getCustomTags()))
          }, cfgManager.getExtension());
          var url = Url$2.stringify(cfgManager.getApiPath(NAME$3), data);
          Ajax$3({
            url: url,
            method: 'GET'
          });
        }, 0);
      }
    }, {
      key: "parsePageTimeWithDefer",
      value: function parsePageTimeWithDefer() {
        var _this2 = this;
        setTimeout(function () {
          try {
            if (_this2.cfgManager.get(NAME$3).sensoryIndex) {
              _this2.firstScreenManager.getSensoryIndex(function (senseTime) {
                _this2.parsePageTime(senseTime); // W3C points and paint time (FST, FP, FCP)
                _this2.parseFirstScreenPerf(senseTime); // first screen performance analysis
              });
            } else {
              _this2.parsePageTime();
            }
          } catch (e) {
            _this2.parsePageTime();
          }
        }, 0);
      }
    }, {
      key: "parsePageTime",
      value: function parsePageTime(senseTime) {
        var _this$getPerformaceTi = this.getPerformaceTiming(),
          perf = _this$getPerformaceTi.perf,
          paint = _this$getPerformaceTi.paint;
        if (!perf) return this.setReady();
        var navStart = perf.navigationStart;
        var perfMap = {
          unloadEventStart: 1,
          unloadEventEnd: 2,
          redirectStart: 3,
          redirectEnd: 4,
          fetchStart: 5,
          domainLookupStart: 6,
          domainLookupEnd: 7,
          connectStart: 8,
          // secureConnectionStart
          connectEnd: 9,
          requestStart: 10,
          responseStart: 11,
          responseEnd: 12,
          domLoading: 13,
          domInteractive: 14,
          domContentLoadedEventStart: 15,
          domContentLoadedEventEnd: 16,
          domComplete: 17,
          loadEventStart: 18,
          loadEventEnd: 19
        };
        for (var key in perfMap) {
          var value = perf[key] || 0;
          this.points[perfMap[key]] = value ? value - navStart : 0;
        }
        this.points[20] = perf.domainLookupEnd - perf.domainLookupStart; // dns
        this.points[21] = perf.connectEnd - perf.connectStart; // tcp
        this.points[22] = perf.responseEnd - perf.requestStart; // download

        var firstPaint = 0;
        var firstContentfulPaint = 0;
        if (paint && paint.length) {
          for (var i = 0; i < paint.length; i++) {
            var item = paint[i];
            if (item.name === 'first-paint') {
              firstPaint = parseInt$2(item.startTime);
            } else if (item.name === 'first-contentful-paint') {
              firstContentfulPaint = parseInt$2(item.startTime);
            }
          }
          if (firstPaint && firstContentfulPaint) {
            this.points[23] = firstPaint;
            this.points[24] = firstContentfulPaint;
          }
        }
        if (senseTime) {
          this.points[25] = senseTime.FST && senseTime.FST > firstContentfulPaint ? senseTime.FST : firstContentfulPaint;
          this.points[26] = senseTime.FCP || firstContentfulPaint || this.points[15];
        }
        if (window.Owl && window.Owl.fstInfo) {
          window.Owl.fstInfo.FST = this.points[25];
        }
        try {
          // handle titans perf timing
          var titansData = window.titansReport;
          if (!titansData && window.KNBTitansXSync && typeof window.KNBTitansXSync.getTitansReport === 'function') {
            var result = window.KNBTitansXSync.getTitansReport();
            titansData = result && JSON.parse(result);
          }
          if (titansData) {
            if (titansData.h5Env) {
              var envInfo = titansData.h5Env;
              if (envInfo.timestamp && envInfo.timestamp.h5EnvInit) {
                this.points[28] = perf.loadEventStart - envInfo.timestamp.h5EnvInit;
              }
              if (envInfo.timing) {
                this.points[29] = envInfo.timing.h5EnvPrepare;
                this.points[30] = envInfo.timing.pagePreprocess;
                this.points[31] = envInfo.timing.webviewPrepare;
              }
              if (envInfo.tag && typeof envInfo.tag.isWebViewInitialed != 'undefined') {
                this.titansTags.isWebViewInitialed = envInfo.tag.isWebViewInitialed ? 'true' : 'false';
              }
            }
            if (titansData.urlPreprocess) {
              var urlPreInfo = titansData.urlPreprocess;
              if (urlPreInfo.timing) {
                this.points[32] = urlPreInfo.timing.urlPreprocess;
              }
              if (urlPreInfo.tag && typeof urlPreInfo.tag.isInterJump != 'undefined') {
                this.titansTags.isInterJump = urlPreInfo.tag.isInterJump ? 'true' : 'false';
              }
            }
            if (titansData.commonTag && titansData.commonTag.titansCoreVersion) {
              this.titansTags.titansCoreVersion = titansData.commonTag.titansCoreVersion;
            }
          }
        } catch (e) {
          this.errManager.reportSystemWarn(e);
        }
        for (var _i2 = 0; _i2 < this.points.length; _i2++) {
          if (isNaN(this.points[_i2]) || this.points[_i2] < 0) {
            this.points[_i2] = 0;
          }
        }
        var cfgManager = this.cfgManager;
        var logInfo = {
          project: cfgManager.get('project'),
          pageUrl: cfgManager.get('pageUrl'),
          start: this.points[11],
          dcl: this.points[16],
          load: this.points[18],
          fst: this.points[25] || 0
        };
        Logan$3._log("[Performance]:".concat(JSON.stringify(logInfo)), 'owl', 'info', ['perf']);

        // is cache hit
        var resTiming = this.getMainResourceTiming();
        if (resTiming) {
          var timeThreshold = cfgManager.get(NAME$3).timeThreshold;
          for (var _i3 = 0; _i3 < resTiming.length; _i3++) {
            var res = resTiming[_i3];
            if (res.transferSize !== undefined) {
              if (res.transferSize !== 0) this.noCache = 'true';
            } else if (res.duration !== undefined) {
              if (res.duration > timeThreshold) this.noCache = 'true';
            }
          }
        }
        this.setReady();
        this.report();
      }
      // handle custom points
    }, {
      key: "push",
      value: function push(point) {
        if (!point || typeof point.position != 'number' || point.position < 0 || point.position > 31) return;
        this.pointsCustom[point.position] = point.duration || 0;
        this.report();
      }
    }, {
      key: "clearTimeout",
      value: function (_clearTimeout) {
        function clearTimeout() {
          return _clearTimeout.apply(this, arguments);
        }
        clearTimeout.toString = function () {
          return _clearTimeout.toString();
        };
        return clearTimeout;
      }(function () {
        clearTimeout(this.timeout);
        this.timeout = undefined;
      })
    }, {
      key: "report",
      value: function report(reportNow) {
        var _this3 = this;
        var cfgManager = this.cfgManager;
        var catchPage = cfgManager.get('autoCatch').page;
        if (catchPage && !this.getReady()) return;
        if (!this.getUserReady()) return;
        if (!this.points.length && !this.pointsCustom.length) return;
        if (!this.cfgManager.isSampleHit(NAME$3)) return;
        try {
          if (this.timeout) {
            this.clearTimeout();
          }
        } catch (e) {
          this.errManager.reportSystemError(e);
        }
        var doSend = function doSend() {
          _this3.clearTimeout();
          if (!_this3.points.length && !_this3.pointsCustom.length) return;

          // 默认性能指标上报至最先设置的pageUrl内容
          var pageUrl = _this3.points.length && _this3.initialPage || cfgManager.get('pageUrl');
          var project = _this3.points.length && _this3.initialProject || cfgManager.get('project');
          var ext = cfgManager.getExtension();
          var data = Extend({
            project: project,
            pageurl: encodeURIComponent(pageUrl),
            speed: encodeURIComponent(_this3.points.join('|')),
            customspeed: encodeURIComponent(_this3.pointsCustom.join('|')),
            timestamp: +new Date(),
            noCache: _this3.noCache,
            ctags: encodeURIComponent(JSON.stringify(cfgManager.getCustomTags())),
            pageId: cfgManager.get('pageId')
          }, ext);
          data = Extend(data, _this3.titansTags);
          var url = Url$2.stringify(cfgManager.getApiPath(NAME$3), data);
          _this3.points = [];
          _this3.pointsCustom = [];
          Ajax$3({
            method: 'GET',
            url: url,
            xhrRewritten: cfgManager.get('autoCatch').ajax ? true : false,
            success: function success(res) {
              return cfgManager.handleRemoteConfig(res);
            }
          });
        };
        var delay = cfgManager.get(NAME$3).delay || 0;
        if (reportNow) {
          doSend();
        } else if (delay >= 0) {
          this.timeout = setTimeout(function () {
            doSend();
          }, delay);
        }
      }
      // 解析并上报页面首屏的性能指标及慢访问个案数据
    }, {
      key: "parseFirstScreenPerf",
      value: function parseFirstScreenPerf(senseTime) {
        var _this4 = this;
        var cfgManager = this.cfgManager;
        var pageConfig = cfgManager.get(NAME$3);
        // 确保测速点上报之后再开始解析首屏性能指标
        var delay = pageConfig.delay || 0;
        setTimeout(function () {
          if (pageConfig.fstPerfAnalysis === true && senseTime && senseTime.FST) {
            var resEntries = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('resource');
            if (resEntries && resEntries.length) {
              var fst = parseInt$2(senseTime.FST || 0);
              var random = Math.random();
              var logSumInfo = random < pageConfig.fstPerfSample;
              // 首屏时间超过 1s 且命中采样率时上报慢访问的个案数据, 暂不支持不同区间内采样率的可配置
              var sampleRate = fst < 2000 ? 0.05 : 0.1;
              var logSlowView = pageConfig.logSlowView === true && fst > 1000 && random < sampleRate;
              if (logSumInfo) {
                // 首屏性能指标汇总数据
                var sumInfo = {
                  picCount: 0,
                  picSize: 0,
                  jsCount: 0,
                  jsSize: 0,
                  cssCount: 0,
                  cssSize: 0,
                  ajaxCount: 0
                };
                // 慢访问个案数据
                var resList = {
                  js: {},
                  css: {},
                  img: {},
                  ajax: {}
                };
                // initiatorType 不能代表请求资源的类型, 需要进一步通过以下正则做匹配
                var time, start, stalled, dns, tcp, ssl, ttfb, load, hit, logStr;
                try {
                  resEntries.filter(function (res) {
                    // 筛选 fetchStart 在 fst 之前的资源请求
                    return res.fetchStart && res.fetchStart < fst;
                  }).forEach(function (res) {
                    var type = '';
                    var name = res.name || '';
                    var initType = res.initiatorType || '';
                    var size = res.transferSize || 0;
                    if (name && initType) {
                      if (initType === 'img' || name.match(imgPattern$1)) {
                        type = 'img';
                        sumInfo.picCount++;
                        sumInfo.picSize += size;
                      } else if (initType === 'script' || initType === 'link' && name.match(jsPattern$1)) {
                        type = 'js';
                        sumInfo.jsCount++;
                        sumInfo.jsSize += size;
                      } else if (initType === 'css' || initType === 'link' && name.match(cssPattern$1)) {
                        type = 'css';
                        sumInfo.cssCount++;
                        sumInfo.cssSize += size;
                      } else if (initType === 'xmlhttprequest' || initType === 'fetch' || initType === 'beacon') {
                        type = 'ajax';
                        sumInfo.ajaxCount++;
                      }
                    }
                    if (logSlowView && type && name) {
                      var matches = name.match(urlPattern);
                      if (matches && matches[1] && matches[2]) {
                        var bodySize = res.decodedBodySize || 0;
                        var duration = res.duration || 0;
                        time = parseTime(res.responseEnd - res.fetchStart);
                        start = parseTime(res.fetchStart);
                        stalled = parseTime(res.domainLookupStart - res.fetchStart);
                        dns = parseTime(res.domainLookupEnd - res.domainLookupStart);
                        tcp = parseTime(res.connectEnd - res.connectStart);
                        ssl = parseTime(res.connectEnd - res.secureConnectionStart);
                        ttfb = parseTime(res.responseStart - res.requestStart);
                        load = parseTime(res.responseEnd - res.responseStart);
                        hit = (size > 0 ? false : bodySize > 0 ? true : duration < 30) ? 1 : 0;
                        logStr = '' + size + ',' + time + ',' + start + ',' + dns + ',' + tcp + ',' + ssl + ',' + ttfb + ',' + load + ',' + stalled + ',' + hit;
                        if (resList[type][matches[1]] instanceof Array) {
                          resList[type][matches[1]].push([matches[2], logStr]);
                        } else {
                          resList[type][matches[1]] = [[matches[2], logStr]];
                        }
                      }
                    }
                  });

                  // 上报首屏性能的汇总数据
                  var url = Url$2.stringify(cfgManager.getApiPath('fstInfo'));
                  var data = Extend({
                    p: _this4.initialProject || cfgManager.get('project'),
                    page: _this4.initialPage || cfgManager.get('pageUrl'),
                    ts: Date.now(),
                    pageId: cfgManager.get('pageId'),
                    unionId: cfgManager.getExtension('unionId'),
                    respTime: fst,
                    ctags: cfgManager.getCustomTags()
                  }, sumInfo);
                  Ajax$3({
                    type: 'POST',
                    url: url,
                    header: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: 'data=' + encodeURIComponent(JSON.stringify(data))
                  });
                  // 上报慢访问个案数据
                  if (logSlowView) {
                    var _url = Url$2.stringify(cfgManager.getApiPath('fstLog'));
                    var _data = {
                      p: _this4.initialProject || cfgManager.get('project'),
                      page: _this4.initialPage || cfgManager.get('pageUrl'),
                      ts: Date.now(),
                      pageId: cfgManager.get('pageId'),
                      unionId: cfgManager.getExtension('unionId'),
                      respTime: fst,
                      content: JSON.stringify(resList),
                      ctags: cfgManager.getCustomTags()
                    };
                    Ajax$3({
                      type: 'POST',
                      url: _url,
                      header: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                      },
                      data: 'data=' + encodeURIComponent(JSON.stringify(_data))
                    });
                  }
                  // 首屏最后一次DOM变更的时间及其Xpath路径
                } catch (e) {
                  _this4.errManager.reportSystemError(e);
                }
              }
            }
          }
        }, delay);
      }
    }, {
      key: "manualReportFST",
      value: function manualReportFST(initInfo) {
        var _this5 = this;
        initInfo = initInfo || {};
        var pageConfig = this.cfgManager.get(NAME$3);
        if (pageConfig.sensoryIndex || !pageConfig.manualReportFST || this.firstScreenManager) return;
        if (!CanIUse.PerformanceNow()) return;

        // 清空数据
        this.points = [];
        this.pointsCustom = [];
        if (window._Owl_ && window._Owl_.pageData) {
          window._Owl_.pageData = [];
        }
        // 设置计时起点
        var time = parseInt$2(initInfo.startTime || performance.now());
        // 开启 FST 的监听计算
        this.sensoryObserver();
        // 等待 FST 计算完成并上报
        setTimeout(function () {
          try {
            if (pageConfig && pageConfig.manualReportFST) {
              _this5.firstScreenManager.getSensoryIndex(function (senseTime) {
                _this5.parseAsyncFST(senseTime, time);
              });
            }
          } catch (e) {
            Logger$3.ignore(e);
          }
        }, 0);
      }
    }, {
      key: "parseAsyncFST",
      value: function parseAsyncFST(senseTime, startTime) {
        if (senseTime) {
          var fst = parseInt$2(senseTime.FST || 0) - startTime;
          var fcp = parseInt$2(senseTime.FCP || 0) - startTime;
          if (fst > 0) {
            this.points[25] = fst;
            this.points[26] = fcp > 0 ? fcp : 0;
          }
        }

        // 其他默认测速点置为 0
        for (var i = 0; i < this.points.length; i++) {
          if (isNaN(this.points[i])) {
            this.points[i] = 0;
          }
        }
        this.setReady();
        this.report();
      }
    }]);
    return PageManager;
  }();
  var page = PageManager$1;

  var keys = ['resourceUrl', 'connectType', 'type', 'timestamp', 'requestbyte', 'responsebyte', 'responsetime', 'project', 'pageUrl', 'realUrl', 'statusCode', 'firstCategory', 'secondCategory', 'logContent', 'traceid', 'ctags'];
  var uploadKeys = keys;

  /**
   * 资源信息数据模型
   *
   * @param {string} project - 资源所在项目
   * @param {string} pageUrl - 资源聚合页面地址
   * @param {string} realUrl - 页面真实地址
   * @param {string} resourceUrl - 资源的名称，通常是url，也可以是其他字符串
   * @param {String} type - 资源类型,包括link,script,img,ajax,api
   * @param {Number} timestamp - 时间戳
   * @param {Number} requestbyte - 资源请求大小
   * @param {Number} responsebyte - 资源响应大小
   * @param {Number} responsetime - 资源响应时间
   * @param {string} statusCode - 资源状态码, 格式为：'网络状态码|业务状态码', 一般有一个状态码即可
   * @param {string} firstCategory - 资源出错时的错误分类
   * @param {string} secondCategory - 资源出错时的子分类
   * @param {string} logContent - 资源出错时的详情
   * @param {string} traceid
   *
   * @class ResourceModel
   */
  var ResourceModel = /*#__PURE__*/function () {
    function ResourceModel(data) {
      var _this = this;
      _classCallCheck(this, ResourceModel);
      keys.forEach(function (key) {
        _this[key] = data[key];
      });
      this.parse();
    }
    _createClass(ResourceModel, [{
      key: "parse",
      value: function parse() {
        this.timestamp = this.timestamp || Date.now().toString();
        this.requestbyte = this.requestbyte || '0';
        this.responsebyte = this.responsebyte || '0';
      }
    }, {
      key: "update",
      value: function update(obj) {
        for (var key in obj) {
          if (obj.hasOwnProperty(key) && keys.indexOf(key) > -1) {
            this[key] = obj[key];
          }
        }
      }
    }, {
      key: "stringify",
      value: function stringify() {
        var _this2 = this;
        var ret = uploadKeys.map(function (key) {
          return _this2[key];
        });
        return ret.join('\t');
      }
    }]);
    return ResourceModel;
  }();
  var model = ResourceModel;

  var minimal = {};

  var utf8 = {};

  var hasRequiredUtf8;
  function requireUtf8() {
    if (hasRequiredUtf8) return utf8;
    hasRequiredUtf8 = 1;
    (function (exports) {

      /**
       * A minimal UTF8 implementation for number arrays.
       * @memberof util
       * @namespace
       */
      var utf8 = exports;

      /**
       * Calculates the UTF8 byte length of a string.
       * @param {string} string String
       * @returns {number} Byte length
       */
      utf8.length = function utf8_length(string) {
        var len = 0,
          c = 0;
        for (var i = 0; i < string.length; ++i) {
          c = string.charCodeAt(i);
          if (c < 128) len += 1;else if (c < 2048) len += 2;else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
          } else len += 3;
        }
        return len;
      };

      /**
       * Writes a string as UTF8 bytes.
       * @param {string} string Source string
       * @param {Uint8Array} buffer Destination buffer
       * @param {number} offset Destination offset
       * @returns {number} Bytes written
       */
      utf8.write = function utf8_write(string, buffer, offset) {
        var start = offset,
          c1,
          // character 1
          c2; // character 2
        for (var i = 0; i < string.length; ++i) {
          c1 = string.charCodeAt(i);
          if (c1 < 128) {
            buffer[offset++] = c1;
          } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6 | 192;
            buffer[offset++] = c1 & 63 | 128;
          } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18 | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
          } else {
            buffer[offset++] = c1 >> 12 | 224;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
          }
        }
        return offset - start;
      };
    })(utf8);
    return utf8;
  }

  var pool_1;
  var hasRequiredPool;
  function requirePool() {
    if (hasRequiredPool) return pool_1;
    hasRequiredPool = 1;
    pool_1 = pool;

    /**
     * An allocator as used by {@link util.pool}.
     * @typedef PoolAllocator
     * @type {function}
     * @param {number} size Buffer size
     * @returns {Uint8Array} Buffer
     */

    /**
     * A slicer as used by {@link util.pool}.
     * @typedef PoolSlicer
     * @type {function}
     * @param {number} start Start offset
     * @param {number} end End offset
     * @returns {Uint8Array} Buffer slice
     * @this {Uint8Array}
     */

    /**
     * A general purpose buffer pool.
     * @memberof util
     * @function
     * @param {PoolAllocator} alloc Allocator
     * @param {PoolSlicer} slice Slicer
     * @param {number} [size=8192] Slab size
     * @returns {PoolAllocator} Pooled allocator
     */
    function pool(alloc, slice, size) {
      var SIZE = size || 8192;
      var MAX = SIZE >>> 1;
      var slab = null;
      var offset = SIZE;
      return function pool_alloc(size) {
        if (size < 1 || size > MAX) return alloc(size);
        if (offset + size > SIZE) {
          slab = alloc(SIZE);
          offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7)
          // align to 32 bit
          offset = (offset | 7) + 1;
        return buf;
      };
    }
    return pool_1;
  }

  var hasRequiredMinimal;
  function requireMinimal() {
    if (hasRequiredMinimal) return minimal;
    hasRequiredMinimal = 1;
    (function (exports) {

      var util = exports;

      // converts to / from utf8 encoded strings
      util.utf8 = requireUtf8();

      // provides a node-like buffer pool in the browser
      util.pool = requirePool();

      /**
       * Global object reference.
       * @memberof util
       * @type {Object}
       */
      util.global = typeof window !== "undefined" && window || typeof self !== "undefined" && self || commonjsGlobal; // eslint-disable-line no-invalid-this

      /**
       * An immuable empty array.
       * @memberof util
       * @type {Array.<*>}
       * @const
       */
      util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */[]; // used on prototypes

      /**
       * An immutable empty object.
       * @type {Object}
       * @const
       */
      util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */{}; // used on prototypes

      /**
       * Tests if the specified value is an integer.
       * @function
       * @param {*} value Value to test
       * @returns {boolean} `true` if the value is an integer
       */
      util.isInteger = Number.isInteger || /* istanbul ignore next */function isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
      };

      /**
       * Tests if the specified value is a string.
       * @param {*} value Value to test
       * @returns {boolean} `true` if the value is a string
       */
      util.isString = function isString(value) {
        return typeof value === "string" || value instanceof String;
      };

      /**
       * Tests if the specified value is a non-null object.
       * @param {*} value Value to test
       * @returns {boolean} `true` if the value is a non-null object
       */
      util.isObject = function isObject(value) {
        return value && _typeof(value) === "object";
      };

      /**
       * Checks if a property on a message is considered to be present.
       * This is an alias of {@link util.isSet}.
       * @function
       * @param {Object} obj Plain object or message instance
       * @param {string} prop Property name
       * @returns {boolean} `true` if considered to be present, otherwise `false`
       */
      util.isset =
      /**
       * Checks if a property on a message is considered to be present.
       * @param {Object} obj Plain object or message instance
       * @param {string} prop Property name
       * @returns {boolean} `true` if considered to be present, otherwise `false`
       */
      util.isSet = function isSet(obj, prop) {
        var value = obj[prop];
        if (value != null && obj.hasOwnProperty(prop))
          // eslint-disable-line eqeqeq, no-prototype-builtins
          return _typeof(value) !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
        return false;
      };

      /**
       * Any compatible Buffer instance.
       * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
       * @interface Buffer
       * @extends Uint8Array
       */

      // Internal alias of or polyfull for Buffer.from.
      util._Buffer_from = null;

      // Internal alias of or polyfill for Buffer.allocUnsafe.
      util._Buffer_allocUnsafe = null;

      /**
       * Creates a new buffer of whatever type supported by the environment.
       * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
       * @returns {Uint8Array|Buffer} Buffer
       */
      util.newBuffer = function newBuffer(sizeOrArray) {
        /* istanbul ignore next */
        return typeof sizeOrArray === "number" ? new util.Array(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
      };

      /**
       * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
       * @type {Constructor<Uint8Array>}
       */
      util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

      /**
       * Merges the properties of the source object into the destination object.
       * @memberof util
       * @param {Object.<string,*>} dst Destination object
       * @param {Object.<string,*>} src Source object
       * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
       * @returns {Object.<string,*>} Destination object
       */
      function merge(dst, src, ifNotSet) {
        // used by converters
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i) if (dst[keys[i]] === undefined || !ifNotSet) dst[keys[i]] = src[keys[i]];
        return dst;
      }
      util.merge = merge;

      /**
       * Converts the first character of a string to lower case.
       * @param {string} str String to convert
       * @returns {string} Converted string
       */
      util.lcFirst = function lcFirst(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
      };

      /**
       * Constructs a new protocol error.
       * @classdesc Error subclass indicating a protocol specifc error.
       * @memberof util
       * @extends Error
       * @template T extends Message<T>
       * @constructor
       * @param {string} message Error message
       * @param {Object.<string,*>} [properties] Additional properties
       * @example
       * try {
       *     MyMessage.decode(someBuffer); // throws if required fields are missing
       * } catch (e) {
       *     if (e instanceof ProtocolError && e.instance)
       *         console.log("decoded so far: " + JSON.stringify(e.instance));
       * }
       */
      // util.ProtocolError = newError("ProtocolError");

      /**
       * So far decoded message instance.
       * @name util.ProtocolError#instance
       * @type {Message<T>}
       */

      /**
       * A OneOf getter as returned by {@link util.oneOfGetter}.
       * @typedef OneOfGetter
       * @type {function}
       * @returns {string|undefined} Set field name, if any
       */

      /**
       * Builds a getter for a oneof's present field name.
       * @param {string[]} fieldNames Field names
       * @returns {OneOfGetter} Unbound getter
       */
      util.oneOfGetter = function getOneOf(fieldNames) {
        var fieldMap = {};
        for (var i = 0; i < fieldNames.length; ++i) fieldMap[fieldNames[i]] = 1;

        /**
         * @returns {string|undefined} Set field name, if any
         * @this Object
         * @ignore
         */
        return function () {
          // eslint-disable-line consistent-return
          for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i) if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null) return keys[i];
        };
      };

      /**
       * A OneOf setter as returned by {@link util.oneOfSetter}.
       * @typedef OneOfSetter
       * @type {function}
       * @param {string|undefined} value Field name
       * @returns {undefined}
       */

      /**
       * Builds a setter for a oneof's present field name.
       * @param {string[]} fieldNames Field names
       * @returns {OneOfSetter} Unbound setter
       */
      util.oneOfSetter = function setOneOf(fieldNames) {
        /**
         * @param {string} name Field name
         * @returns {undefined}
         * @this Object
         * @ignore
         */
        return function (name) {
          for (var i = 0; i < fieldNames.length; ++i) if (fieldNames[i] !== name) delete this[fieldNames[i]];
        };
      };

      // Sets up buffer utility according to the environment (called in index-minimal)
      util._configure = function () {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
      };
    })(minimal);
    return minimal;
  }

  var writer;
  var hasRequiredWriter;
  function requireWriter() {
    if (hasRequiredWriter) return writer;
    hasRequiredWriter = 1;
    writer = Writer;
    var util = requireMinimal();
    var BufferWriter; // cyclic

    var utf8 = util.utf8;

    /**
     * Constructs a new writer operation instance.
     * @classdesc Scheduled writer operation.
     * @constructor
     * @param {function(*, Uint8Array, number)} fn Function to call
     * @param {number} len Value byte length
     * @param {*} val Value to write
     * @ignore
     */
    function Op(fn, len, val) {
      /**
       * Function to call.
       * @type {function(Uint8Array, number, *)}
       */
      this.fn = fn;

      /**
       * Value byte length.
       * @type {number}
       */
      this.len = len;

      /**
       * Next operation.
       * @type {Writer.Op|undefined}
       */
      this.next = undefined;

      /**
       * Value to write.
       * @type {*}
       */
      this.val = val; // type varies
    }

    /* istanbul ignore next */
    function noop() {} // eslint-disable-line no-empty-function

    /**
     * Constructs a new writer state instance.
     * @classdesc Copied writer state.
     * @memberof Writer
     * @constructor
     * @param {Writer} writer Writer to copy state from
     * @ignore
     */
    function State(writer) {
      /**
       * Current head.
       * @type {Writer.Op}
       */
      this.head = writer.head;

      /**
       * Current tail.
       * @type {Writer.Op}
       */
      this.tail = writer.tail;

      /**
       * Current buffer length.
       * @type {number}
       */
      this.len = writer.len;

      /**
       * Next state.
       * @type {State|null}
       */
      this.next = writer.states;
    }

    /**
     * Constructs a new writer instance.
     * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
     * @constructor
     */
    function Writer() {
      /**
       * Current length.
       * @type {number}
       */
      this.len = 0;

      /**
       * Operations head.
       * @type {Object}
       */
      this.head = new Op(noop, 0, 0);

      /**
       * Operations tail
       * @type {Object}
       */
      this.tail = this.head;

      /**
       * Linked forked states.
       * @type {Object|null}
       */
      this.states = null;

      // When a value is written, the writer calculates its byte length and puts it into a linked
      // list of operations to perform when finish() is called. This both allows us to allocate
      // buffers of the exact required size and reduces the amount of work we have to do compared
      // to first calculating over objects and then encoding over objects. In our case, the encoding
      // part is just a linked list walk calling operations with already prepared values.
    }
    var create = function create() {
      return function create_array() {
        return new Writer();
      };
    };

    /**
     * Creates a new writer.
     * @function
     * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
     */
    Writer.create = create();

    /**
     * Allocates a buffer of the specified size.
     * @param {number} size Buffer size
     * @returns {Uint8Array} Buffer
     */
    Writer.alloc = function alloc(size) {
      return new util.Array(size);
    };

    // Use Uint8Array buffer pool in the browser, just like node does with buffers
    /* istanbul ignore else */
    if (util.Array !== Array) Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);

    /**
     * Pushes a new operation to the queue.
     * @param {function(Uint8Array, number, *)} fn Function to call
     * @param {number} len Value byte length
     * @param {number} val Value to write
     * @returns {Writer} `this`
     * @private
     */
    Writer.prototype._push = function push(fn, len, val) {
      this.tail = this.tail.next = new Op(fn, len, val);
      this.len += len;
      return this;
    };
    function writeByte(val, buf, pos) {
      buf[pos] = val & 255;
    }
    function writeVarint32(val, buf, pos) {
      while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
      }
      buf[pos] = val;
    }

    /**
     * Constructs a new varint writer operation instance.
     * @classdesc Scheduled varint writer operation.
     * @extends Op
     * @constructor
     * @param {number} len Value byte length
     * @param {number} val Value to write
     * @ignore
     */
    function VarintOp(len, val) {
      this.len = len;
      this.next = undefined;
      this.val = val;
    }
    VarintOp.prototype = Object.create(Op.prototype);
    VarintOp.prototype.fn = writeVarint32;

    /**
     * Writes an unsigned 32 bit value as a varint.
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.uint32 = function write_uint32(value) {
      // here, the call to this.push has been inlined and a varint specific Op subclass is used.
      // uint32 is by far the most frequently used operation and benefits significantly from this.
      this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
      return this;
    };

    /**
     * Writes a boolish value as a varint.
     * @param {boolean} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.bool = function write_bool(value) {
      return this._push(writeByte, 1, value ? 1 : 0);
    };

    // var writeBytes = util.Array.prototype.set
    //     ? function writeBytes_set(val, buf, pos) {
    //         buf.set(val, pos); // also works for plain array values
    //     }
    //     /* istanbul ignore next */
    //     : function writeBytes_for(val, buf, pos) {
    //         for (var i = 0; i < val.length; ++i)
    //             buf[pos + i] = val[i];
    //     };

    /**
     * Writes a sequence of bytes.
     * @param {Uint8Array|string} value Buffer or base64 encoded string to write
     * @returns {Writer} `this`
     */
    // Writer.prototype.bytes = function write_bytes(value) {
    //     var len = value.length >>> 0;
    //     if (!len)
    //         return this._push(writeByte, 1, 0);
    //     if (util.isString(value)) {
    //         var buf = Writer.alloc(len = base64.length(value));
    //         base64.decode(value, buf, 0);
    //         value = buf;
    //     }
    //     return this.uint32(len)._push(writeBytes, len, value);
    // };

    /**
     * Writes a string.
     * @param {string} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.string = function write_string(value) {
      var len = utf8.length(value);
      return len ? this.uint32(len)._push(utf8.write, len, value) : this._push(writeByte, 1, 0);
    };

    /**
     * Forks this writer's state by pushing it to a stack.
     * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
     * @returns {Writer} `this`
     */
    Writer.prototype.fork = function fork() {
      this.states = new State(this);
      this.head = this.tail = new Op(noop, 0, 0);
      this.len = 0;
      return this;
    };

    /**
     * Resets this instance to the last state.
     * @returns {Writer} `this`
     */
    Writer.prototype.reset = function reset() {
      if (this.states) {
        this.head = this.states.head;
        this.tail = this.states.tail;
        this.len = this.states.len;
        this.states = this.states.next;
      } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len = 0;
      }
      return this;
    };

    /**
     * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
     * @returns {Writer} `this`
     */
    Writer.prototype.ldelim = function ldelim() {
      var head = this.head,
        tail = this.tail,
        len = this.len;
      this.reset().uint32(len);
      if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
      }
      return this;
    };

    /**
     * Finishes the write operation.
     * @returns {Uint8Array} Finished buffer
     */
    Writer.prototype.finish = function finish() {
      var head = this.head.next,
        // skip noop
        buf = this.constructor.alloc(this.len),
        pos = 0;
      while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
      }
      // this.head = this.tail = null;
      return buf;
    };
    Writer._configure = function (BufferWriter_) {
      BufferWriter = BufferWriter_;
      Writer.create = create();
      BufferWriter._configure();
    };
    return writer;
  }

  var writer_buffer;
  var hasRequiredWriter_buffer;
  function requireWriter_buffer() {
    if (hasRequiredWriter_buffer) return writer_buffer;
    hasRequiredWriter_buffer = 1;
    writer_buffer = BufferWriter;

    // extends Writer
    var Writer = requireWriter();
    (BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
    var util = requireMinimal();

    /**
     * Constructs a new buffer writer instance.
     * @classdesc Wire format writer using node buffers.
     * @extends Writer
     * @constructor
     */
    function BufferWriter() {
      Writer.call(this);
    }
    BufferWriter._configure = function () {
      /**
       * Allocates a buffer of the specified size.
       * @function
       * @param {number} size Buffer size
       * @returns {Buffer} Buffer
       */
      BufferWriter.alloc = util._Buffer_allocUnsafe;
      BufferWriter.writeBytesBuffer = util.Buffer && util.Buffer.prototype instanceof Uint8Array && util.Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
        buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
        // also works for plain array values
      }
      /* istanbul ignore next */ : function writeBytesBuffer_copy(val, buf, pos) {
        if (val.copy)
          // Buffer values
          val.copy(buf, pos, 0, val.length);else for (var i = 0; i < val.length;)
        // plain array values
        buf[pos++] = val[i++];
      };
    };
    function writeStringBuffer(val, buf, pos) {
      if (val.length < 40)
        // plain js is faster for short strings (probably due to redundant assertions)
        util.utf8.write(val, buf, pos);else if (buf.utf8Write) buf.utf8Write(val, pos);else buf.write(val, pos);
    }

    /**
     * @override
     */
    BufferWriter.prototype.string = function write_string_buffer(value) {
      var len = util.Buffer.byteLength(value);
      this.uint32(len);
      if (len) this._push(writeStringBuffer, len, value);
      return this;
    };

    /**
     * Finishes the write operation.
     * @name BufferWriter#finish
     * @function
     * @returns {Buffer} Finished buffer
     */

    BufferWriter._configure();
    return writer_buffer;
  }

  var protobuf_1;
  var hasRequiredProtobuf;
  function requireProtobuf() {
    if (hasRequiredProtobuf) return protobuf_1;
    hasRequiredProtobuf = 1;
    var protobuf = {};

    /**
     * Build type, one of `"full"`, `"light"` or `"minimal"`.
     * @name build
     * @type {string}
     * @const
     */
    protobuf.build = "minimal";

    // Serialization
    protobuf.Writer = requireWriter();
    protobuf.BufferWriter = requireWriter_buffer();

    // Utility
    protobuf.util = requireMinimal();
    // protobuf.rpc          = require("./rpc");
    protobuf.roots = {};
    protobuf.configure = configure;

    /* istanbul ignore next */
    /**
     * Reconfigures the library according to the environment.
     * @returns {undefined}
     */
    function configure() {
      protobuf.util._configure();
      protobuf.Writer._configure(protobuf.BufferWriter);
      // protobuf.Reader._configure(protobuf.BufferReader);
    }

    // Set up buffer utility according to the environment
    configure();
    protobuf_1 = protobuf;
    return protobuf_1;
  }

  var protobuf_batch;
  var hasRequiredProtobuf_batch;
  function requireProtobuf_batch() {
    if (hasRequiredProtobuf_batch) return protobuf_batch;
    hasRequiredProtobuf_batch = 1;
    var $protobuf = requireProtobuf();
    var $Writer = $protobuf.Writer,
      $util = $protobuf.util;
    var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
    var $oneOfFields;
    function definePropertyFn(keys, Inst) {
      keys.forEach(function (key) {
        Inst.prototype[key] = null;
        Object.defineProperty(Inst.prototype, "_".concat(key), {
          get: $util.oneOfGetter($oneOfFields = [key]),
          set: $util.oneOfSetter($oneOfFields)
        });
      });
    }
    function encodeFn(keyArr, lenArr, m, w) {
      keyArr.forEach(function (key, i) {
        if (m[key] != null && Object.hasOwnProperty.call(m, key)) w.uint32(lenArr[i]).string(m[key]);
      });
    }
    var batchpackage = $root.batchpackage = function () {
      var batchpackage = {};
      batchpackage.BatchInfo = function () {
        function BatchInfo(p) {
          if (p) for (var ks = Object.keys(p), i = 0; i < ks.length; ++i) if (p[ks[i]] != null) this[ks[i]] = p[ks[i]];
        }
        var batchInfoStringKeys = ['project', 'pageUrl', 'realUrl', 'type', 'resourceUrl', 'connectType', 'requestbyte', 'responsetime', 'responsebyte', 'statusCode', 'timestamp', 'resourceType'];
        var batchInfoOptionKeys = ['firstCategory', 'secondCategory', 'content', 'traceid', 'ctags'];
        batchInfoStringKeys.forEach(function (key) {
          BatchInfo.prototype[key] = '';
        });
        definePropertyFn(batchInfoOptionKeys, BatchInfo);
        BatchInfo.create = function create(properties) {
          return new BatchInfo(properties);
        };
        BatchInfo.encode = function encode(m, w) {
          if (!w) w = $Writer.create();
          var lenArr = [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 114, 130, 90, 98, 106, 122, 138];
          var keyArr = batchInfoStringKeys.concat(batchInfoOptionKeys);
          encodeFn(keyArr, lenArr, m, w);
          return w;
        };
        return BatchInfo;
      }();
      batchpackage.Batch = function () {
        function Batch(p) {
          this.infos = [];
          if (p) for (var ks = Object.keys(p), i = 0; i < ks.length; ++i) if (p[ks[i]] != null) this[ks[i]] = p[ks[i]];
        }
        Batch.prototype.infos = $util.emptyArray;
        var batchOptionKeys = ['region', 'operator', 'network', 'container', 'os', 'connectType', 'unionId'];
        definePropertyFn(batchOptionKeys, Batch);
        Batch.create = function create(properties) {
          return new Batch(properties);
        };
        Batch.encode = function encode(m, w) {
          if (!w) w = $Writer.create();
          if (m.infos != null && m.infos.length) {
            for (var i = 0; i < m.infos.length; ++i) $root.batchpackage.BatchInfo.encode(m.infos[i], w.uint32(10).fork()).ldelim();
          }
          var lenArr = [18, 26, 34, 42, 50, 58, 66];
          encodeFn(batchOptionKeys, lenArr, m, w);
          return w;
        };
        return Batch;
      }();
      return batchpackage;
    }();
    protobuf_batch = batchpackage.Batch;
    return protobuf_batch;
  }

  var Ajax$2 = xhr$1;
  var RM = model;
  var Category = category$1;
  var jsPattern = patterns.jsPattern,
    cssPattern = patterns.cssPattern,
    imgPattern = patterns.imgPattern;
  var Util$6 = require$$9;
  var util$1 = util$4;
  var Event$4 = event;
  var Logger$2 = require$$12["default"];
  var Logan$2 = logan;
  var protocol = protocol_1;
  /* const BatchMessage = require('./protobuf_batch')
     const BatchMessageBackup = require('./protobuf_batch_backup'); */
  var canIUse = caniuse;
  var CACHE_SEND_TRIGGER = 5;
  var parseInt$1 = Number.parseInt || window.parseInt;
  var NAME$2 = 'resource';
  var getImageDomain = function getImageDomain(url) {
    var arr = url.split('//');
    if (arr && arr.length > 1) {
      return arr[0] + '//' + arr[1].split('/')[0] + '/images';
    }
  };
  var ResManager$1 = /*#__PURE__*/function () {
    function ResManager(cfgManager, errManager) {
      _classCallCheck(this, ResManager);
      this.cfgManager = cfgManager;
      this.errManager = errManager;
      this.cache = [];
      this.entryCache = [];
      this.comboTimeout = 0;
      this.isSupportGetEntries = canIUse.GetEntries();
    }
    // parse xhr info
    _createClass(ResManager, [{
      key: "parseAjax",
      value: function parseAjax(event) {
        try {
          if (!event || !event.currentTarget || isNaN(event.duration)) return;
          var state = event.type;
          var duration = event.duration;
          var _byte = event.total;
          var currTarget = event.currentTarget;
          var statusCode = currTarget.status;
          var url = Util$6.getFullUrl(currTarget.responseURL || currTarget.url);
          if (!this.checkUrlValid(url)) return;
          if (this.checkMTSIForbid(currTarget)) return;
          var cfgManager = this.cfgManager;
          var resReg = cfgManager.get('resourceReg');
          var isUrlValid = cfgManager.get('devMode') || resReg instanceof RegExp && resReg.test(url);
          var ajaxConfig = cfgManager.get('ajax');
          var config = cfgManager.get(NAME$2);
          var responsetime = duration.toString();
          var traceid = currTarget.traceid || '';
          var logInfo = {
            project: cfgManager.get('project'),
            url: url,
            method: currTarget.method || '',
            duration: responsetime,
            traceid: traceid,
            timestamp: +new Date()
          };
          if (isUrlValid) {
            if (!ajaxConfig.flag || duration < ajaxConfig.duration) {
              var isSuccess;
              var httpCode;
              var businessCode;
              var content = '';
              if (config.enableStatusCheck) {
                httpCode = statusCode || (state === 'load' ? 200 : 500);
                isSuccess = (state === 'load' || state === 'readystatechange') && (httpCode >= 200 && httpCode < 300 || httpCode === 304);
                if (!isSuccess) {
                  content = state === 'load' ? '' : "from: xhr ".concat(state, ".");
                  content += currTarget.statusText ? httpCode + ' ' + currTarget.statusText : '';
                }
              } else {
                isSuccess = state === 'load' || state === 'readystatechange' && statusCode === 200;
                httpCode = isSuccess ? 200 : 500;
                content = isSuccess ? '' : "from: xhr ".concat(state);
              }
              if (isSuccess && ajaxConfig.autoBusinessCode && typeof currTarget.getResponseHeader === 'function' && typeof ajaxConfig.parseResponse === 'function') {
                try {
                  var contentType = currTarget.getResponseHeader('Content-Type');
                  if (!contentType || !/(text)|(json)/.test(contentType)) return;
                  var responseType = currTarget.responseType;
                  var response;
                  if (!responseType || responseType === 'text') {
                    response = currTarget.responseText;
                  } else if (responseType === 'json') {
                    response = currTarget.response;
                  }
                  try {
                    response = response && typeof response === 'string' ? JSON.parse(response) : response;
                  } catch (e) {}
                  var result = ajaxConfig.parseResponse(response);
                  businessCode = result.code;
                } catch (e) {
                  Util$6.reportSysError(e);
                }
              }
              this.pushApi({
                type: 'ajax',
                resourceUrl: url,
                connectType: this.getConnectTypeByUrl(url),
                responsetime: responsetime,
                responsebyte: _byte && _byte.toString() ? _byte.toString() : '0',
                statusCode: "".concat(httpCode, "|").concat(typeof businessCode === 'undefined' ? '' : businessCode),
                firstCategory: isSuccess ? '' : Category.AJAX,
                logContent: content,
                traceid: traceid
              });
              logInfo.code = httpCode;
              var logLevel = 'info';
              var logTag = 'ajax';
              if (!isSuccess) {
                logInfo.error = {
                  type: 'default',
                  content: content
                };
                logLevel = 'error';
                logTag = 'ajaxError';
              }
              Logan$2._log("[Ajax]:".concat(JSON.stringify(logInfo)), 'owl', logLevel, [logTag]);
            } else if (cfgManager.isSampleHit('api')) {
              var msg = "ajax\u8BF7\u6C42\u65F6\u95F4\u8D85\u8FC7\u8BBE\u5B9A ".concat(url);
              this.errManager.push({
                name: 'TIMEOUT_AJAX',
                msg: msg
              }, {
                category: Category.AJAX
              });
              logInfo.error = {
                type: 'timeout',
                content: msg
              };
              Logan$2._log("[Ajax]:".concat(JSON.stringify(logInfo)), 'owl', 'error', ['ajaxError']);
            }
          } else if (cfgManager.get('invalid').ajax && ajaxConfig.invalid && cfgManager.isSampleHit(NAME$2)) {
            this.errManager.push({
              name: 'INVALID_AJAX',
              msg: url
            }, {
              category: Category.AJAX
            });
            logInfo.error = {
              type: 'invalidUrl',
              content: url
            };
            Logan$2._log("[Ajax]:".concat(JSON.stringify(logInfo)), 'owl', 'error', ['ajaxError']);
          }
        } catch (e) {
          Util$6.reportSysError(e);
        }
      }
      // parse fetch info
    }, {
      key: "parseFetch",
      value: function parseFetch(info) {
        try {
          var url = info.url,
            duration = info.duration,
            isSuccess = info.isSuccess;
          if (!url || isNaN(duration) || isSuccess === undefined) return;
          url = Util$6.getFullUrl(url);
          if (!this.checkUrlValid(url)) return;
          var cfgManager = this.cfgManager;
          var ajaxConfig = cfgManager.get('ajax');
          var resReg = cfgManager.get('resourceReg');
          if (!(cfgManager.get('devMode') || resReg instanceof RegExp && resReg.test(url))) return;
          if (cfgManager.get(NAME$2).ignoreMTSIForbidRequest && info.xForbidReason && info.statusCode === 403) return;
          Logan$2.log("[Fetch]:".concat(JSON.stringify(info)), 'owl', 'error', ['ajaxError']);
          var statusCode;
          var firstCategory;
          var logContent;
          var businessCode;
          var response = info.response;
          if (isSuccess) {
            var ok = info.ok ? true : false;
            var defaultCode = ok ? 200 : 404;
            statusCode = info.statusCode || defaultCode;
            firstCategory = ok ? '' : Category.AJAX;
            logContent = ok ? '' : statusCode + ' ' + (info.statusText || '');
            if (ajaxConfig.autoBusinessCode) {
              try {
                response = response && typeof response === 'string' ? JSON.parse(response) : response;
                var result = ajaxConfig.parseResponse(response);
                businessCode = result.code;
              } catch (e) {}
            }
          } else {
            statusCode = '500';
            firstCategory = Category.AJAX;
            logContent = info.errMsg || info.errName || '';
          }
          this.pushApi({
            type: 'fetch',
            resourceUrl: url,
            connectType: this.getConnectTypeByUrl(url),
            responsetime: duration.toString() || '0',
            responsebyte: '0',
            statusCode: "".concat(statusCode, "|").concat(typeof businessCode === 'undefined' ? '' : businessCode),
            firstCategory: firstCategory,
            logContent: logContent,
            traceid: info.traceid
          });
        } catch (e) {
          Util$6.reportSysError(e);
        }
      }
    }, {
      key: "checkUrlValid",
      value: function checkUrlValid(url) {
        try {
          var ignoreList = this.cfgManager.get('ignoreList').ajax || [];
          for (var i = 0; i < ignoreList.length; i++) {
            var urlReg = new RegExp(ignoreList[i]);
            if (urlReg.test(url)) return false;
          }
        } catch (e) {
          Util$6.reportSysError(e);
          return false;
        }
        return true;
      }
      // 过滤 MTSI 反爬拦截的请求
    }, {
      key: "checkMTSIForbid",
      value: function checkMTSIForbid(target) {
        if (!target || !this.cfgManager.get(NAME$2).ignoreMTSIForbidRequest) return false;
        try {
          if (target.status === 403 && typeof target.getAllResponseHeaders === 'function') {
            var headers = target.getAllResponseHeaders();
            if (headers && headers.indexOf('x-forbid-reason') > -1) {
              return true;
            }
          }
        } catch (e) {
          Util$6.reportSysError(e);
        }
        return false;
      }
    }, {
      key: "parseType",
      value: function parseType(type) {
        var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
        if (!(type && url)) return '';
        // type: script link img css
        if (type === 'img' || url.match(imgPattern)) {
          type = 'image';
        } else if (type === 'script' || type === 'link' && url.match(jsPattern)) {
          type = 'js';
        } else if (type === 'css' || type === 'link' && url.match(cssPattern)) {
          type = 'css';
        }
        return type;
      }
    }, {
      key: "filterResource",
      value: function filterResource(url) {
        try {
          var filters = this.cfgManager.get('ignoreList').resource;
          for (var i = 0; i < filters.length; i++) {
            var tempReg = new RegExp(filters[i]);
            if (tempReg.test(url)) return false;
          }
          return true;
        } catch (e) {
          Util$6.reportSysError(e);
          return false;
        }
      }
      // 解析性能条目的列表数据
    }, {
      key: "parsePerformanceEntries",
      value: function parsePerformanceEntries(entries) {
        entries = this.filterEntries(entries);
        if (!(entries && entries.length)) return;
        var cfgManager = this.cfgManager;
        var devMode = cfgManager.get('devMode');
        var resReg = cfgManager.get('resourceReg');
        var imgConfig = cfgManager.get('image');
        var entryCache = this.entryCache;
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var url = entry.name;
          var urlValid = this.filterResource(url);
          if (!(urlValid && (devMode || resReg instanceof RegExp && resReg.test(url)))) continue;
          entryCache.push(url);
          var hasError = false;
          var type = this.parseType(entry.initiatorType, url);
          var isImg = type === 'image';
          var duration = parseInt$1(entry.duration || 0) || 0;
          if (imgConfig.flag && isImg) {
            var filter = imgConfig.filter;
            if (!filter || typeof filter === 'function' && !filter(url)) {
              var sec_category = void 0;
              var size = entry.transferSize;
              if (size && size > imgConfig.fileSize * 1000) {
                sec_category = 'IMAGE_SIZE_EXCEED';
              } else if (duration && duration > imgConfig.duration) {
                sec_category = 'IMAGE_DURATION_EXCEED';
              }
              if (sec_category) {
                hasError = true;
                this.errManager._pushResource({
                  category: Category.RESOURCE,
                  sec_category: sec_category,
                  content: url
                });
              }
            }
          }
          if (!hasError) {
            this.push({
              type: type,
              connectType: this.getConnectTypeByUrl(url),
              resourceUrl: isImg ? getImageDomain(url) : url,
              responsetime: duration.toString() || '0',
              responsebyte: entry.transferSize && entry.transferSize.toString() || '0',
              statusCode: '200|',
              logContent: isImg ? url : ''
            });
          }
        }
        this.triggerReport();
      }
    }, {
      key: "filterEntries",
      value: function filterEntries(entries) {
        // 筛选静态资源类型
        var ret = [];
        var validList = ['link', 'script', 'img', 'css'];
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (validList.indexOf(entry.initiatorType) > -1) {
            ret.push(entry);
          }
        }
        return ret;
      }
      // 资源加载的动态监测
    }, {
      key: "observeResourceTiming",
      value: function observeResourceTiming() {
        var _this = this;
        if (this.resTimingObserved) return;
        this.resTimingObserved = true;
        var disableObserver = this.cfgManager.get(NAME$2).disablePerformanceObserver || false;
        if (!disableObserver && canIUse.PerformanceObserver()) {
          var observer = new window.PerformanceObserver(function (list) {
            try {
              var entries = list.getEntries();
              _this.parsePerformanceEntries(entries);
            } catch (e) {
              Util$6.reportSysError(e);
            }
          });
          observer.observe({
            entryTypes: ['resource']
          });
        } else {
          // 通过响应 ajax 请求实现动态监测
          Event$4.on('ajaxCall', function () {
            setTimeout(function () {
              try {
                var entryCache = _this.entryCache;
                var nextEntries = window.performance.getEntries();
                if (nextEntries.length === entryCache.length) {
                  return;
                } else if (nextEntries.length > entryCache.length) {
                  var diffEntries = [];
                  for (var i = 0; i < nextEntries.length; i++) {
                    if (entryCache.indexOf(nextEntries[i].name) === -1) {
                      diffEntries.push(nextEntries[i]);
                    }
                  }
                  entryCache = nextEntries;
                  _this.parsePerformanceEntries(diffEntries);
                }
              } catch (err) {
                Util$6.reportSysError(err);
              }
            }, 1500);
          });
        }
      }
    }, {
      key: "handleResourceTiming",
      value: function handleResourceTiming() {
        try {
          if (this.isSupportGetEntries) {
            var entries = window.performance.getEntries();
            this.parsePerformanceEntries(entries);
            this.observeResourceTiming();
          }
        } catch (e) {
          Util$6.reportSysWarn(e);
        }
      }
    }, {
      key: "handleResourceLoadError",
      value: function handleResourceLoadError(event) {
        var _this2 = this;
        var target = event.target || event.srcElement;
        var doTask = function doTask() {
          var url = target.src || target.href;
          var href = Util$6.getHref();
          if (!url || !href || href.indexOf(url) === 0) return; // 过滤图片懒加载触发的error (url等于前部分href)

          var sec_category = (target.nodeName || '').toLowerCase();
          if (!sec_category) return;
          var urlShort = sec_category === 'img' ? getImageDomain(url) : url;
          if (!urlShort) return;
          var urlValid = _this2.filterResource(urlShort);
          if (!urlValid) return;
          if (jsPattern.test(url)) {
            Logan$2._log("[Error]:".concat(JSON.stringify({
              type: 'js',
              url: url
            })), 'owl', 'error', ['resourceError']);
          }
          var xpath = Util$6.getXPath(target);
          var content = url + (xpath ? '\n' + xpath : '');
          if (_this2.isSupportGetEntries) {
            _this2.pushApi({
              type: _this2.parseType(sec_category, url),
              resourceUrl: urlShort,
              connectType: _this2.getConnectTypeByUrl(urlShort),
              responsetime: '0',
              statusCode: '500|',
              firstCategory: Category.RESOURCE,
              secondCategory: sec_category,
              logContent: content
            });
          } else {
            _this2.errManager._pushResource({
              category: Category.RESOURCE,
              sec_category: sec_category,
              content: content
            });
          }
        };
        try {
          if (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement) {
            doTask();
          }
        } catch (e) {
          Util$6.reportSysError(e);
        }
      }
    }, {
      key: "_stringify",
      value: function _stringify() {
        var cache = this.cache;
        if (!(cache && cache.length)) return;
        var ext = this.cfgManager.getExtension();
        var ret = {
          region: '',
          operator: '',
          network: '',
          container: '',
          os: '',
          unionId: ''
        };
        for (var key in ret) {
          if (ret.hasOwnProperty(key)) {
            ret[key] = ext[key] || '';
          }
        }
        var infos = [];
        for (var i = 0; i < cache.length; i++) {
          infos.push(cache[i]);
        }
        ret['infos'] = infos;
        return ret;
      }
    }, {
      key: "doBatchPush",
      value: function doBatchPush(data) {
        data = this.parse(data);
        var instance = new RM(data);
        var shouldPush = true;
        var onBatchPush = this.cfgManager.get('onBatchPush');
        if (typeof onBatchPush === 'function') {
          try {
            shouldPush = onBatchPush(instance);
          } catch (e) {
            Logger$2.ignore(e);
          }
        }
        if (!shouldPush) return;
        this.cache.push(instance);
      }
    }, {
      key: "push",
      value: function push(resource) {
        if (!this.cfgManager.isSampleHit(NAME$2)) return;
        this.doBatchPush(resource);
        if (this.cache.length >= CACHE_SEND_TRIGGER) {
          this.report(true);
        } else {
          this.triggerReport();
        }
      }
    }, {
      key: "parse",
      value: function parse(res) {
        res.pageUrl = res.pageUrl || this.cfgManager.get('pageUrl');
        res.project = res.project || this.cfgManager.get('project');
        res.realUrl = res.realUrl || location.href;
        return res;
      }
    }, {
      key: "pushApi",
      value: function pushApi(api) {
        if (!this.cfgManager.isSampleHit('api')) return;
        api.ctags = JSON.stringify(util$1.isFlatObj(api.ctags) ? api.ctags : this.cfgManager.getCustomTags());
        this.doBatchPush(api);
        this.triggerReport();
      }
    }, {
      key: "report",
      value: function report() {
        this.triggerReport(true);
      }
    }, {
      key: "triggerReport",
      value: function triggerReport(reportNow) {
        var _this3 = this;
        if (!this.cache.length) return;
        var comboReport = function comboReport() {
          clearTimeout(_this3.comboTimeout);
          _this3.comboTimeout = 0;
          _this3.send();
        };
        var delay = this.cfgManager.get(NAME$2).delay;
        if (reportNow) {
          this.send();
        } else if (!this.comboTimeout && delay !== -1) {
          this.comboTimeout = setTimeout(comboReport, delay);
        }
      }
    }, {
      key: "send",
      value: function send() {
        var _this4 = this;
        var data = this._stringify();
        if (!data) return;
        var apiPath = '';
        var buffer = '';
        if (!this.cfgManager.get('devMode')) {
          var BatchMessage = requireProtobuf_batch();
          var message = BatchMessage.create(data);
          apiPath = this.cfgManager.getApiPath('resource_pbbatch');
          buffer = BatchMessage.encode(message).finish();
        } else {
          apiPath = this.cfgManager.getApiPath(NAME$2);
          buffer = JSON.stringify(data);
        }
        Ajax$2({
          type: 'POST',
          url: apiPath + "&pageId=".concat(this.cfgManager.get('pageId'), "&p=").concat(this.cfgManager.get('project')),
          data: buffer,
          success: function success(res) {
            return _this4.cfgManager.handleRemoteConfig(res);
          }
        });
        /* 线下验证代码，勿删
           var decodedMessage = BatchMessageBackup.decode(buffer);
           var object = BatchMessageBackup.toObject(decodedMessage);
           object.infos && object.infos.forEach(info => {
               if (info.statusCode.indexOf('200|') === -1) {
                   Util.reportSysWarn({
                       name: 'protobuf_error' + info.statusCode,
                       stack: {
                           statusCode: info.statusCode,
                           data: data,
                           object: object
                       }
                   });
               }
           }) */

        this.cache = [];
      }
    }, {
      key: "getConnectTypeByUrl",
      value: function getConnectTypeByUrl(url) {
        if (url.indexOf('https') === 0) {
          return 'https';
        } else if (url.indexOf('http') === 0) {
          return 'http';
        }
        return protocol.indexOf('https') === 0 ? 'https' : 'http';
      }
    }]);
    return ResManager;
  }();
  var manager$1 = ResManager$1;

  var extend$2 = extend$5;
  var Ajax$1 = xhr$1;
  var Logger$1 = require$$12["default"];
  var Util$5 = require$$9;
  var Url$1 = url;
  var reportSysError = require$$9.reportSysError;
  var NAME$1 = 'metric';
  var MetricManager$1 = /*#__PURE__*/function () {
    function MetricManager(cfgManager) {
      _classCallCheck(this, MetricManager);
      this.cfgManager = cfgManager;
      this.tags = {};
      this.kvs = {};
      this.extraData = '';
    }
    /**
     * 设置维度信息
     *
     * @param {Object} tags - key为维度名称，value为维度数据
     * @memberof MetricManager
     */
    _createClass(MetricManager, [{
      key: "setTags",
      value: function setTags(tags) {
        var formattedTags = Util$5.formatTags(tags);
        this.tags = extend$2(this.tags, formattedTags);
      }
    }, {
      key: "getTags",
      value: function getTags(tagName) {
        return tagName ? this.tags[tagName] : this.tags;
      }
      /**
       * 增加metric数据
       *
       * @param {string} name - metric名称
       * @param {number} value  - metric值
       * @param {object} tags - 指标维度
       * @memberof MetricManager
       */
    }, {
      key: "setMetric",
      value: function setMetric(name, value, tags) {
        var _this = this;
        if (typeof name !== 'string') {
          return Logger$1.log('metric名称必须是string类型');
        }
        if (typeof value !== 'number') {
          return Logger$1.log("metric\u503C\u5FC5\u987B\u662Fnumber\u7C7B\u578B,\u5F53\u524D\u4E3A".concat(name, "-").concat(value));
        }
        if (!this.cfgManager.isSampleHit(name)) return;
        if (!this.kvs[name]) {
          this.kvs[name] = [];
        }
        this.kvs[name].push({
          key: name,
          vs: [value],
          tvs: Util$5.formatTags(tags),
          ts: parseInt(+new Date() / 1000)
        });
        try {
          if (this.cfgManager.get(NAME$1).combo) {
            if (this.timeout) {
              clearTimeout(this.timeout);
              this.timeout = null;
            }
            this.timeout = setTimeout(function () {
              _this.report();
            }, this.cfgManager.get(NAME$1).delay || 1500);
          }
        } catch (e) {}
      }
    }, {
      key: "setExtraData",
      value: function setExtraData(msg) {
        this.extraData = msg || '';
      }
    }, {
      key: "getMetric",
      value: function getMetric(name) {
        return name ? this.kvs[name] : this.kvs;
      }
    }, {
      key: "clearMetric",
      value: function clearMetric() {
        this.kvs = {};
      }
    }, {
      key: "_rollbackMetric",
      value: function _rollbackMetric(preMetric) {
        if (preMetric) {
          for (var name in preMetric) {
            if (preMetric.hasOwnProperty(name)) {
              this.kvs[name] = preMetric[name].concat(this.kvs[name] || []);
            }
          }
        }
      }
    }, {
      key: "report",
      value: function report() {
        var _this2 = this;
        try {
          if (!this.kvs || Object.keys(this.kvs).length === 0) return;
          var reportData = {
            tvs: this.tags,
            datas: Object.keys(this.kvs).reduce(function (datas, key) {
              var metrics = _this2.kvs[key];
              metrics.forEach(function (metric) {
                datas.push(_objectSpread2(_objectSpread2({}, metric), {}, {
                  extra: _this2.extraData
                }));
              });
              return datas;
            }, [])
          };
          // let preMetric = this.kvs
          this.clearMetric();
          var cfgManager = this.cfgManager;
          var url = Url$1.stringify(cfgManager.getApiPath(NAME$1), {
            p: cfgManager.get('project'),
            pageId: cfgManager.get('pageId'),
            unionId: cfgManager.getExtension('unionId')
          });
          var dataStr = JSON.stringify(reportData);
          Ajax$1({
            url: url,
            type: 'POST',
            header: {
              'Content-Type': 'application/json'
            },
            data: dataStr,
            fail: function fail(event) {
              try {
                event = event || {};
                var eventType = event.type || 'Unknown';
                var target = event.currentTarget || {};
                var statusCode = target.status;
                var urlStr = target.url;
                Util$5.reportSysWarn({
                  name: '自定义指标上报失败，失败类型：' + eventType,
                  msg: dataStr,
                  // why 需要使用addError处理，addError的stack是通过传msg字段处理的
                  stack: dataStr
                }, {
                  tags: {
                    eventType: eventType,
                    statusCode: statusCode,
                    urlStr: urlStr
                  }
                });
                // this._rollbackMetric(preMetric)
              } catch (e) {}
            },
            success: function success(res) {
              return cfgManager.handleRemoteConfig(res);
            }
          });
        } catch (err) {
          reportSysError(err);
        }
      }
    }]);
    return MetricManager;
  }();
  var metric = MetricManager$1;

  var Ajax = xhr$1;
  var Url = url;
  var NAME = 'pv';
  var PvManager$1 = /*#__PURE__*/function () {
    function PvManager(cfgManager) {
      _classCallCheck(this, PvManager);
      this.cfgManager = cfgManager;
    }
    _createClass(PvManager, [{
      key: "report",
      value: function report(opts) {
        opts = opts || {};
        var cfgManager = this.cfgManager;
        var ext = cfgManager.getExtension();
        var url = Url.stringify(cfgManager.getApiPath(NAME), {
          project: opts.project || cfgManager.get('project'),
          pageurl: encodeURIComponent(opts.pageUrl || cfgManager.get('pageUrl')),
          pageId: opts.pageId || cfgManager.get('pageId'),
          timestamp: Date.now(),
          region: ext.region || '',
          operator: ext.operator || '',
          network: ext.network || '',
          container: ext.container || '',
          os: ext.os || '',
          unionid: ext.unionId || '',
          ctags: encodeURIComponent(JSON.stringify(opts.ctags || {}))
        });
        Ajax({
          url: url,
          type: 'POST',
          header: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          success: function success(res) {
            return cfgManager.handleRemoteConfig(res);
          }
        });
      }
    }]);
    return PvManager;
  }();
  var pv = PvManager$1;

  var Logan$1 = logan;
  var LogManager$1 = /*#__PURE__*/function () {
    function LogManager(cfgManager) {
      _classCallCheck(this, LogManager);
      this.cfgManager = cfgManager;
    }
    _createClass(LogManager, [{
      key: "addLog",
      value: function addLog(log) {
        Logan$1.log("[Log]: ".concat(log), {
          noType: true
        });
      }
    }]);
    return LogManager;
  }();
  var manager = LogManager$1;

  /**
   * @description: 读取cookie值
   * @param {*} name
   * @return {*}
   */
  function getCookie$1(name) {
      var nameEQ = name + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ')
              c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0)
              return c.substring(nameEQ.length, c.length);
      }
      return null;
  }

  var cookie = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': getCookie$1
  });

  function deepCopy(target) {
      if (target === null) {
          return target;
      }
      if (target instanceof Array) {
          var cp_1 = [];
          target.forEach(function (v) {
              cp_1.push(v);
          });
          return cp_1.map(function (n) { return deepCopy(n); });
      }
      if (typeof target === 'object') {
          var cp_2 = __assign({}, target);
          Object.keys(cp_2).forEach(function (k) {
              cp_2[k] = deepCopy(cp_2[k]);
          });
          return cp_2;
      }
      return target;
  }
  function getPageUrl() {
      return window.location.href || '';
  }
  function isFunction(fn) {
      return typeof fn === 'function';
  }
  function isObject(val) {
      return val !== null && typeof val === 'object';
  }
  function stringify(obj) {
      if (window.JSON && isFunction(JSON.stringify)) {
          var result = '';
          try {
              result = JSON.stringify(obj);
          }
          catch (error) {
              var cache_1 = [];
              result = JSON.stringify(obj, function (key, value) {
                  if (typeof value === 'object' && value !== null) {
                      if (cache_1.indexOf(value) !== -1) {
                          // Circular reference found, discard key
                          return;
                      }
                      // Store value in our collection
                      cache_1.push(value);
                  }
                  return value;
              });
          }
          return result;
      }
      return obj === null || obj === undefined ? obj : obj.toString();
  }
  /**
   * 监听页面退入后台事件， Safari 某些版本在页面内跳转时，不会触发 visibilitychange，所以补充 pagehide 监听
   * @param cb 页面隐藏事件回调
   * @param once 是否只触发1次，避免 pagehide 和 visibilitychange 多次触发回调，默认为 true
   */
  function onPageHide(cb, once) {
      if (once === void 0) { once = true; }
      var onHiddenOrPageHide = function (event) {
          if (event.type === 'pagehide'
              || document.visibilityState === 'hidden') {
              cb(event);
              if (once) {
                  removeEventListener('visibilitychange', onHiddenOrPageHide, true);
                  removeEventListener('pagehide', onHiddenOrPageHide, true);
              }
          }
      };
      // iOS 14 以下 visibilitychange 事件不会冒泡到 window，故只能挂载到 document
      document.addEventListener('visibilitychange', onHiddenOrPageHide, true);
      /* Some browsers have buggy implementations of visibilitychange,
         so we use pagehide in addition, just to be safe. */
      window.addEventListener('pagehide', onHiddenOrPageHide, true);
  }
  /**
   * 用于计算当次访问的唯一标识 用于后端计算异常率计算 对PV 去重
   * @returns {string} visitId
   */
  function getVisitId() {
      var visitId = '';
      try {
          visitId = ([1e7].toString() + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
              return (Number(c)
                  ^ (window.crypto.getRandomValues(new Uint8Array(1))[0]
                      & (15 >> (Number(c) / 4)))).toString(16);
          });
      }
      catch (err) {
          logger.log('get visitid err', err);
      }
      return visitId;
  }
  /**
   * 根据 UA 获取操作系统信息 支持常用操作系统
   * @param ua 浏览器 userAgent
   * @return {string} 操作系统   ios | Android | Mac OS | windows
   */
  function getOsByUA(ua) {
      var osRegMap = {
          iOS: /iPhone|iPad/,
          Android: /Android/,
          Mac: /Mac\/sOS|/,
          Windows: /(W|w)indows/,
      };
      for (var _i = 0, _a = Object.keys(osRegMap); _i < _a.length; _i++) {
          var os = _a[_i];
          var reg = osRegMap[os];
          if (reg.test(ua)) {
              return os;
          }
      }
      return '';
  }
  /**
   * 根据 ua 信息 和  navigator.connection 获取网络类型
   * @returns 网络连接类型
   */
  function getNetworkType() {
      var _a, _b;
      var ua = (_a = window.navigator) === null || _a === void 0 ? void 0 : _a.userAgent;
      var networkReg = /NetType\/([a-zA-Z0-9]+)/;
      var regResult = ua ? ua.match(networkReg) : '';
      if (isArray(regResult)) {
          return regResult[1];
      }
      var connection = (_b = window.navigator) === null || _b === void 0 ? void 0 : _b.connection;
      return isObject(connection)
          ? connection.type === 'wifi'
              ? 'wifi'
              : connection.effectiveType || connection.type || ''
          : '';
  }
  function isArray(arr) {
      return isFunction(Array.isArray)
          ? Array.isArray(arr)
          : Object.prototype.toString.call(arr) === '[object Array]';
  }
  /** 简单 polyfill Object.assign */
  function extend$1(target, source) {
      var ret = {};
      if (target) {
          Object.keys(target).forEach(function (key) {
              ret[key] = target[key];
          });
      }
      if (isObject(source)) {
          Object.keys(source).forEach(function (key) {
              var value = source[key];
              if (value !== undefined) {
                  ret[key] = value;
              }
          });
      }
      return ret;
  }
  /** 获取当前 Titans宿主环境版本 返回 null 为非 Titans 环境 */
  function getTitansVersion() {
      var regexp = function (str) {
          return new RegExp(str, 'i');
      };
      var lua = (navigator.userAgent + '').toLowerCase();
      var VER_REG_STR = '([0-9][0-9.a-zA-Z_]*)';
      var matchTitansVerison = lua.match(regexp('(TitansX|TitansNoX)/' + VER_REG_STR));
      return matchTitansVerison && matchTitansVerison[2];
  }
  /** simple polyfill for Array.from */
  function fromArray(arrayLike) {
      return __spreadArray([], arrayLike, true);
  }
  /** 将 Set 转换为 Array 不想使用 ts 自身的 downlevelIteration */
  function setToArray(set) {
      var resultArr = [];
      set.forEach(function (item) {
          resultArr.push(item);
      });
      return resultArr;
  }
  /** 简单的程序执行耗时计算器 */
  var timeCalculator = {
      started: false,
      startTimestamp: 0,
      start: function () {
          if (!this.started) {
              this.started = true;
              this.startTimestamp = performance.now();
          }
      },
      end: function () {
          if (this.started) {
              this.started = false;
              return performance.now() - this.startTimestamp;
          }
      },
  };
  function getPageNavStart() {
      return performance.timeOrigin || performance.timing.navigationStart;
  }
  function IsSupportMsiContainer(MSI) {
      var _a;
      var isMsiContainer = false;
      // 不支持msi情况需要catch异常
      try {
          isMsiContainer = (_a = MSI === null || MSI === void 0 ? void 0 : MSI.canIUse) === null || _a === void 0 ? void 0 : _a.call(MSI, 'sendBabelLog');
      }
      catch (e) { }
      return isMsiContainer;
  }
  function isNumber(value) {
      return typeof value === 'number';
  }

  var EventEmitter = /** @class */ (function () {
      function EventEmitter() {
          this._eventMap = {};
      }
      EventEmitter.prototype.on = function (event, fn, context) {
          var eventHandlers = this._eventMap[event];
          var newHandler = { context: context, fn: fn, once: false };
          if (isArray(eventHandlers)) {
              eventHandlers.push(newHandler);
          }
          else {
              this._eventMap[event] = [newHandler];
          }
      };
      EventEmitter.prototype.emit = function (event) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              args[_i - 1] = arguments[_i];
          }
          var handlers = this._eventMap[event];
          if (isArray(handlers)) {
              for (var i = 0; i < handlers.length; i++) {
                  var _a = handlers[i], context = _a.context, fn = _a.fn, once = _a.once;
                  fn.apply(context, args);
                  if (once) {
                      handlers.splice(i, 1);
                      i--;
                  }
              }
          }
      };
      return EventEmitter;
  }());

  var PLUGIN_NAME;
  (function (PLUGIN_NAME) {
      PLUGIN_NAME["CACHE"] = "cache";
      PLUGIN_NAME["FSP2"] = "fsp2";
      PLUGIN_NAME["IRD"] = "ird";
      PLUGIN_NAME["SHR"] = "shr";
  })(PLUGIN_NAME || (PLUGIN_NAME = {}));
  /** SDK 运行环境 */
  var ENV;
  (function (ENV) {
      /** 浏览器 */
      ENV["BROWSER"] = "browser";
      /** web容器 */
      ENV["CONTAINER"] = "container";
      /** 小程序（MMP、微信） */
      ENV["MP"] = "miniprogram";
  })(ENV || (ENV = {}));

  var BasePlugin = /** @class */ (function (_super) {
      __extends(BasePlugin, _super);
      function BasePlugin(queue, config) {
          var _this = _super.call(this) || this;
          _this._editableOption = [];
          _this.env = ENV.CONTAINER;
          /**
           * @description: 透传调用桥方法
           * @param {array} args
           * @return {*}
           */
          _this.useBridge = function (bridgeName, opts) {
              var queue = _this.queue;
              // 类型保护
              if (queue.metaData.getEnv() === ENV.CONTAINER && queue.useBridge) {
                  queue.useBridge(bridgeName, opts);
              }
          };
          _this.queue = queue;
          _this.config = config;
          _this.globalConfig = _this.queue.config;
          return _this;
      }
      BasePlugin.prototype.addData = function (data) {
          var _this = this;
          if (!this.isSampleHit()) {
              return false;
          }
          logger.log('Perf H5 send data is: ', data);
          var logList = isArray(data) ? data : [data];
          logList.forEach(function (log) {
              log.tags = __assign(__assign({}, log.tags), { sample_rate: _this.getSample() / 100 });
              var reportLog = __assign(__assign({}, log), { ts: log.ts || Date.now() });
              if (_this.handleBeforeSend(reportLog)) {
                  _this.queue.add(reportLog);
              }
          });
      };
      BasePlugin.prototype.handleBeforeSend = function (data) {
          try {
              var hook = this.config.beforeSend;
              if (hook instanceof Function) {
                  return Boolean(hook(deepCopy(data)));
              }
          }
          catch (error) {
              logger.log('beforeSend 处理异常', error);
          }
          return true;
      };
      /**
       * 根据指标配置的采样率判断该次上报是否命中采样
       * @returns {boolean} 是否命中采样
       */
      BasePlugin.prototype.isSampleHit = function () {
          return Math.random() * 100 <= this.getSample();
      };
      BasePlugin.prototype.getSample = function () {
          if (this.globalConfig.dev) {
              return 100;
          }
          return this.config.sampleRate;
      };
      BasePlugin.prototype.setEnv = function (env) {
          this.env = env;
      };
      return BasePlugin;
  }(EventEmitter));

  /** 猎豹通道 category */
  var CATEGORY = 'prism-report-web';
  /** 猎豹通道 topic 域名 */
  var REPORT_URL = 'https://prism-report-web.dreport.meituan.net';
  /** 猎豹自定义指标 category */
  var CUSTOM_CATEGORY = 'prism-report-custom';
  /** 猎豹自定义通道 域名 */
  var CUSTOM_REPORT_URL = 'https://prism-report-custom.dreport.meituan.net';
  // 指标名列表
  /** 非容器环境的 fsp2 指标 */
  var METRICS_FSP2 = 'ffp_web';
  /** 非容器环境的 ird 指标 */
  var METRICS_IRD = 'ird_web';
  /** 非容器环境的 shr 指标 */
  var METRICS_SHR = 'shr_web';
  /** KNB本地存储数据最大长度 **/
  var KNB_CACHE_QUEUE_MAX_LEN = 50;

  var fspDebug = {
      drawGrid: function () {
          var gridContainer = document.createElement('div');
          gridContainer.style.position = 'fixed';
          gridContainer.style.width = '100%';
          gridContainer.style.height = '100%';
          gridContainer.style.top = '0';
          gridContainer.style.bottom = '0';
          gridContainer.style.left = '0';
          gridContainer.style.right = '0';
          gridContainer.style.pointerEvents = 'none';
          gridContainer.style.display = 'flex';
          gridContainer.style.flexWrap = 'wrap';
          gridContainer.style.alignContent = 'stretch';
          gridContainer.style.zIndex = '100';
          gridContainer.setAttribute('perf_ignore', 'true');
          for (var i = 0; i < 18; i++) {
              var cube = document.createElement('div');
              cube.style.flexBasis = '33.3333%';
              cube.style.outline = '0.5px solid blue';
              gridContainer.appendChild(cube);
          }
          document.body.appendChild(gridContainer);
      },
      drawTime: function () {
          var div = document.createElement('div');
          div.textContent = "\u5F53\u524D\u65F6\u95F4: ".concat(Date.now());
          div.style.color = 'red';
          div.style.fontSize = '12px';
          div.style.background = 'lightgreen';
          div.style.position = 'fixed';
          div.style.bottom = '150px';
          div.style.width = '100%';
          div.style.zIndex = '1000';
          div.setAttribute('perf_ignore', 'true');
          document.body.appendChild(div);
          var updateTime = function () {
              div.textContent = "\u5F53\u524D\u65F6\u95F4: ".concat(Date.now());
              window.requestAnimationFrame(updateTime);
          };
          window.requestAnimationFrame(updateTime);
      },
      drawLog: function (type, timestamp) {
          var div = document.createElement('div');
          var triggerLabel = type === 'success'
              ? '满足首屏'
              : type === 'interact'
                  ? '用户交互'
                  : '超时(不满一屏)';
          div.textContent = "FSP\u68C0\u6D4B\u7ED3\u675F \u89E6\u53D1\u7C7B\u578B: ".concat(triggerLabel, " \u7ED3\u675F\u65F6\u95F4: ").concat(timestamp);
          div.style.color = 'red';
          div.style.fontSize = '12px';
          div.style.background = 'lightgreen';
          div.style.position = 'fixed';
          div.style.bottom = '200px';
          div.style.width = '100%';
          div.style.zIndex = '1000';
          div.setAttribute('perf_ignore', 'true');
          document.body.appendChild(div);
      },
  };

  var defaultOption$3 = {
      disable: false,
      sampleRate: 5,
      customTags: {},
      debug: false,
      useIgnore: false,
      defer: true,
      fspClsEnable: true,
  };
  var FP_TIME = Date.now();
  /**页面有效元素 当对应坐标是这些元素时， 认为该坐标点的元素时有效的*/
  var VALID_ELEMENTS = new Set([
      'SVG',
      'INPUT',
      'CANVAS',
      'IMG',
      'VIDEO',
      'AUDIO',
      'B',
      'I',
      'STRONG',
      'EM',
  ]);
  /** 自定义维度值最大长度 */
  var MAX_TAG_VALUE_LENGTH = 128;
  /** 超时监听最多允许的 mutation 次数 */
  var MUTATION_TIMEOUT_MAX_COUNT = 10;
  var NodesFilter = new Set([
      'HTML',
      'HEAD',
      'META',
      'LINK',
      'SCRIPT',
      'STYLE',
      'NOSCRIPT',
  ]);
  /** 监听变动超时时间 */
  var TIMEOUT = 5000;
  /** 填充率满足条件需要的宫格数 90% 约 17个 */
  var FILL_CUBE_NUM = 17;
  /** 视窗底部判断尺寸buffer */
  var BOTTOM_SIZE = 50;
  /** 视窗底部的坐标点数 */
  var BOTTOM_POINT_NUM = 9;
  /** 元素ignore 属性名 */
  var IGNORE_ATTR = 'perf_ignore';
  /** should report type */
  var VALID_REPORT_TYPE = ['success', 'interact', 'timeout'];
  var PluginFsp2 = /** @class */ (function (_super) {
      __extends(PluginFsp2, _super);
      function PluginFsp2(queue, config) {
          if (config === void 0) { config = defaultOption$3; }
          var _this = _super.call(this, queue, config) || this;
          _this.name = PluginFsp2.id;
          _this.timer = null;
          /** 最终满足首屏条件时的时间戳 初始值为当前时间戳，兼容ssr渲染或纯静态页面 后续不会发生 dom 变更场景*/
          _this.fspStartTimestamp = FP_TIME;
          /** 计算fsp过程中 dom 变更的时间 */
          _this.fspMutationTimestamp = FP_TIME;
          /** 每次填充率或者触底情况改变的的首次时间 */
          _this.fillRateOrReachChangeTime = FP_TIME;
          _this.observer = null;
          _this.mutaStopTime = TIMEOUT;
          /** 填充率条件满足 */
          _this.fillRateDone = false;
          /** 触底条件满足 */
          _this.reachBottomDone = false;
          /** 视窗底部坐标点 */
          _this.bottomPoints = [];
          /** 纯浏览器环境统计起点 */
          _this.webStartTimestamp = performance.timeOrigin || performance.timing.navigationStart;
          /** 元素有效状态map 用于缓存获取到的元素有效性 */
          _this.elementValidationMap = new Map();
          /** 算法损耗耗时 */
          _this.timeCost = 0;
          /** cube 坐标及填充状态 */
          _this.cubes = [];
          /** 视窗高度 */
          _this.viewportHeight = 0;
          /** 视窗宽度 */
          _this.viewportWidth = 0;
          /** 变动次数 */
          _this.mutationCount = 0;
          /** 原始变动次数 */
          _this.originMutationCount = 0;
          /** 宫格填充数 */
          _this.filledCount = 0;
          /** 运行环境 */
          _this.run_env = ENV.CONTAINER;
          /** 延迟执行 */
          _this.defer = true;
          /** 页面填充检测结束时间，包含：超时、交互、填充满 */
          _this.pageLoadedTime = 0;
          /** cls稳定检测相关变量 */
          _this.clsObserver = null;
          _this.clsTimer = 0;
          _this.elementRects = new Map();
          _this.clsObserverNodesRects = [];
          _this.allMovedNodesRects = [];
          _this.clsMaxCycleCount = 5;
          _this.clsCycleTime = 200;
          _this.clsThreshold = 0.02;
          _this.clsPageStable = false;
          _this.cls = 0; // 累计的cls值
          _this.clsCycleCount = 0; // cls轮询次数
          _this.totalClsCycleCount = 0; // 总的cls轮询次数
          _this.clsCycleStartTime = 0;
          _this.config = extend$1(defaultOption$3, _this.config);
          _this.run_env = _this.queue.metaData.getEnv();
          _this.interactListener = _this.interactListener.bind(_this);
          return _this;
      }
      PluginFsp2.prototype.init = function () {
          var _this = this;
          if (this.run_env === ENV.CONTAINER
              && Math.random() * 100 > this.config.sampleRate) {
              return false;
          }
          if (this.config.debug) {
              fspDebug.drawTime();
              fspDebug.drawGrid();
          }
          // 如果环境不支持 直接返回
          if (!this.supportFSP()) {
              this.report('notsupport');
              return false;
          }
          // 开始统计的起点
          this.report('start');
          if (!this.config.defer && document.body) {
              // 同步执行，在 SSR 等 body 明确存在的场景，防止服务端渲染内容返回页面JS执行阻塞SDK初始化
              this.startFSPCheck();
          }
          else {
              // 延迟执行，加一个定时器，应对初始化时 body 可能不存在的情况
              setTimeout(function () { return _this.startFSPCheck(); }, 0);
          }
      };
      PluginFsp2.prototype.startListener = function () {
          var _this = this;
          if (window.addEventListener) {
              // 页面退入后台停止秒开检测
              onPageHide(function () {
                  _this.stopFSPCheck();
              });
              if (document.readyState === 'complete') {
                  this.addInteractListener();
              }
              else {
                  window.addEventListener('load', function () {
                      _this.addInteractListener();
                  });
              }
          }
      };
      PluginFsp2.prototype.interactListener = function () {
          try {
              logger.log('onload后响应到用户交互事件');
              this.stopFSPCheck();
              this.pageLoadedTime = this.fspMutationTimestamp;
              this.report('interact', this.fspMutationTimestamp);
          }
          catch (err) {
              reportSysError$1(err);
          }
      };
      PluginFsp2.prototype.addInteractListener = function () {
          if (this.fspCheckFinished()) {
              return;
          }
          document.addEventListener('click', this.interactListener);
          document.addEventListener('wheel', this.interactListener);
          document.addEventListener('touchmove', this.interactListener);
      };
      PluginFsp2.prototype.removeInteractListener = function () {
          document.removeEventListener('click', this.interactListener);
          document.removeEventListener('wheel', this.interactListener);
          document.removeEventListener('touchmove', this.interactListener);
      };
      /** 检查18宫格填充率 */
      PluginFsp2.prototype.checkFillRate = function (element) {
          var rect = element.getBoundingClientRect();
          var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
          var filledCount = 0;
          for (var i = 0; i < this.cubes.length; i++) {
              var cube = this.cubes[i];
              if (cube.filled) {
                  filledCount += 1;
              }
              else {
                  var cords = cube.cords;
                  // bottomRight,
                  var topLeft = cords[0], topRight = cords[1], bottomLeft = cords[2];
                  // x 轴相交判断: 矩形框左边界小于宫格右边界  矩形框右边界大于宫格左边界
                  var xAxisOk = x < topRight.x && x + width > topLeft.x;
                  // y 轴相交判断: 矩形框的上边界小于宫格下边界 矩形框下边界大于宫格上边界
                  var yAxisOk = y < bottomLeft.y && y + height > topLeft.y;
                  var filled = xAxisOk && yAxisOk;
                  if (filled) {
                      cube.filled = true;
                      logger.log('trigger cube filled: ', cube);
                      filledCount += 1;
                  }
              }
              if (filledCount >= FILL_CUBE_NUM) {
                  logger.log('fillRate ok');
                  this.fillRateDone = true;
                  return filledCount;
              }
          }
          return filledCount;
      };
      /** 检查内容是否触底 */
      PluginFsp2.prototype.checkReachBottom = function (element) {
          var rect = element.getBoundingClientRect();
          var y = rect.y, height = rect.height;
          // 矩形框上边界小于视窗高度 并且 矩形框下边界大于视窗高度
          var reachBottom = y <= this.viewportHeight
              && y + height >= this.viewportHeight - BOTTOM_SIZE;
          if (reachBottom) {
              logger.log(element, 'trigger reachBottom ok');
              this.reachBottomDone = reachBottom;
          }
      };
      /**
       * 判断所在坐标点元素是否为有效元素
       * @param point 坐标点坐标
       */
      PluginFsp2.prototype.isValidElement = function (element) {
          if (!element) {
              return false;
          }
          var isValidFromCache = this.elementValidationMap.get(element);
          if (typeof isValidFromCache === 'boolean') {
              return isValidFromCache;
          }
          if (this.config.useIgnore || this.config.debug) {
              var shouldIgnore = this.shouldIgnoreElement(element, IGNORE_ATTR);
              if (shouldIgnore) {
                  this.elementValidationMap.set(element, false);
                  return false;
              }
          }
          var style = window.getComputedStyle(element);
          var _a = style || {}, visibility = _a.visibility, display = _a.display, opacity = _a.opacity;
          // 判断元素是否可见
          if (visibility === 'hidden'
              || display === 'none'
              || opacity + '' == '0') {
              this.elementValidationMap.set(element, false);
              return false;
          }
          var nodeName = element.nodeName.toUpperCase();
          if (VALID_ELEMENTS.has(nodeName)) {
              this.elementValidationMap.set(element, true);
              return true;
          }
          if (NodesFilter.has(nodeName)) {
              this.elementValidationMap.set(element, false);
              return false;
          }
          // 具有背景图片时 认为同样属于可见元素
          var bgProp = style.getPropertyValue('background-image')
              || style.getPropertyValue('background');
          if (/url\(.*?\)/g.test(bgProp)) {
              this.elementValidationMap.set(element, true);
              return true;
          }
          if (this.isTextContentElement(element)) {
              this.elementValidationMap.set(element, true);
              return true;
          }
          this.elementValidationMap.set(element, false);
          return false;
      };
      /**
       * 判断元素是否为直接包含文本内容的元素
       * 因为 element 的 textContent 和 innerText 属性获取的文本内容包含子孙节点 故不可以使用
       */
      PluginFsp2.prototype.isTextContentElement = function (element) {
          var childNodes = element.childNodes;
          return childNodes && fromArray(childNodes).some(this.isValidTextNode);
      };
      /** 初始化视窗内的18宫格坐标及视窗底部的坐标 */
      PluginFsp2.prototype.initCubeAndBottomPoints = function () {
          var _this = this;
          this.fspCostCalcStart();
          /* 获取视窗长宽尺寸
             window.innerWidth 包含滚动条  documentElement.clientWidth 不包含滚动条 */
          var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
          var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
          this.viewportHeight = vh;
          this.viewportWidth = vw;
          var cubes = this.getViewportCubes(vw, vh);
          this.cubes = cubes.map(function (cube) { return ({
              filled: false,
              cords: cube,
              innerPoints: _this.getCubeInnerPoints(cube),
          }); });
          this.bottomPoints = this.getViewportBottomPoints(vw, vh);
          this.fspCostCalcEnd();
      };
      PluginFsp2.prototype.getViewportBottomPoints = function (vw, vh) {
          // 取 n 个点 需要均分 n + 1 份
          var perWidth = vw / (BOTTOM_POINT_NUM + 1);
          var perHeight = BOTTOM_SIZE / (BOTTOM_POINT_NUM + 1);
          // 除底部的固定矩形外的视窗高度
          var upHeight = vh - BOTTOM_SIZE;
          var bottomPoints = [];
          for (var i = 0; i < BOTTOM_POINT_NUM; i++) {
              // 因为通过 docment.elementFromPoint 获取可视窗口边缘坐标的元素始终返回null 故y轴坐标取视口高度 -1的位置
              bottomPoints.push({
                  x: (i + 1) * perWidth,
                  y: upHeight + (i + 1) * perHeight,
              });
          }
          // logger.log('bottomPoints: ', bottomPoints);
          return bottomPoints;
      };
      /** 获取单个宫格内部的采样点 默认采集 9 个点 */
      PluginFsp2.prototype.getCubeInnerPoints = function (cube) {
          var leftTop = cube[0], rightTop = cube[1], rightBottom = cube[2];
          var cubeWidth = rightTop.x - leftTop.x;
          var cubeHeight = rightBottom.y - rightTop.y;
          // 宫格内x轴 y轴各取 3个点 均分对应轴的尺寸
          var CUBE_X_POINTS = 3;
          var CUBE_Y_POINTS = 3;
          // 分成四份 每份尺寸
          var unitWidth = cubeWidth / (CUBE_X_POINTS + 1);
          var unitHeight = cubeHeight / (CUBE_Y_POINTS + 1);
          var cubePoints = [];
          for (var i = 0; i < CUBE_X_POINTS; i++) {
              for (var j = 0; j < CUBE_Y_POINTS; j++) {
                  cubePoints.push({
                      x: leftTop.x + (i + 1) * unitWidth,
                      y: leftTop.y + (j + 1) * unitHeight,
                  });
              }
          }
          // logger.log('cube inner points: ', cubePoints);
          return cubePoints;
      };
      /**
       * 停止当前超时计时器
       * @param newTimer 是否重置定时器
       */
      PluginFsp2.prototype.resetTimer = function (newTimer) {
          var _this = this;
          // 取消定时器
          if (!newTimer) {
              this.timer && clearTimeout(this.timer);
              this.timer = null;
              return;
          }
          // 重置定时器的逻辑
          if (this.originMutationCount >= MUTATION_TIMEOUT_MAX_COUNT) {
              /* 如果超出了 MAX 限制，即使 DOM 再变化，定时器也不会再被重置了，
                 这是为了方式有不停的 DOM 变动，影长 timeout 判断 */
              return;
          }
          // 重置定时器，清除
          if (this.timer) {
              clearTimeout(this.timer);
              this.timer = null;
          }
          // 清楚后重设
          this.timer = window.setTimeout(function () {
              logger.log("".concat(_this.mutaStopTime, "ms\u65F6\u95F4\u5185\u6CA1\u6709\u76D1\u542C\u5230\u65B0\u7684DOM\u53D8\u5316, \u505C\u6B62DOM\u53D8\u5316\u76D1\u542C"));
              _this.stopFSPCheck();
              // 超时后检测是否满足首屏  兼容 ssr 场景
              var timeoutSuccess = _this.timeoutFspCalc();
              if (timeoutSuccess) {
                  if (_this.mutationCount === 0) {
                      _this.pageLoadedTime = _this.fspStartTimestamp;
                      _this.report('success', _this.fspStartTimestamp);
                      return;
                  }
                  else {
                      _this.pageLoadedTime = _this.fillRateOrReachChangeTime;
                      _this.report('success', _this.fillRateOrReachChangeTime);
                      return;
                  }
              }
              _this.pageLoadedTime = _this.fspMutationTimestamp;
              _this.report('timeout', _this.fspMutationTimestamp);
              // 将 reachBottom 和 fillRate 状态置为 true 标识秒开计算已结束
              _this.reachBottomDone = true;
              _this.fillRateDone = true;
          }, this.mutaStopTime);
      };
      /**
       * 获取视窗内的 18 宫格坐标
       * 每个宫格包含四个顶点坐标 [{x, y}, {x, y}, {x, y}, {x, y}] 顺序 左上  右上  右下  左下
       * @param vw 视窗宽度
       * @param vh 视窗高度
       */
      PluginFsp2.prototype.getViewportCubes = function (vw, vh) {
          // 18宫格x轴方向分为3份 y轴方向分为6份
          var X_CUBE_NUM = 3;
          var Y_CUBE_NUM = 6;
          var perCubeWidth = vw / X_CUBE_NUM;
          var perCubeHeight = vh / Y_CUBE_NUM;
          var cubePointsArr = [];
          for (var i = 0; i < X_CUBE_NUM; i++) {
              for (var j = 0; j < Y_CUBE_NUM; j++) {
                  var leftTopPoint = {
                      x: i * perCubeWidth,
                      y: j * perCubeHeight,
                  };
                  var rightTopPoint = {
                      x: (i + 1) * perCubeWidth,
                      y: j * perCubeHeight,
                  };
                  var rightBottomPoint = {
                      x: (i + 1) * perCubeWidth,
                      y: (j + 1) * perCubeHeight,
                  };
                  var leftBottomPoint = {
                      x: i * perCubeWidth,
                      y: (j + 1) * perCubeHeight,
                  };
                  cubePointsArr.push([
                      leftTopPoint,
                      rightTopPoint,
                      rightBottomPoint,
                      leftBottomPoint,
                  ]);
              }
          }
          logger.log('viewport cubes: ', cubePointsArr);
          return cubePointsArr;
      };
      PluginFsp2.prototype.observerStop = function () {
          if (this.observer) {
              try {
                  this.observer.disconnect();
                  this.observer = null;
              }
              catch (error) {
                  logger.log('observer disconnect err', error);
              }
          }
      };
      PluginFsp2.prototype.startFSPCheck = function () {
          var _this = this;
          var _a;
          try {
              this.initCubeAndBottomPoints();
              // 初始通过 elementFromPoint 检测是否满足首屏
              if (this.initFSPCheck()) {
                  this.pageLoadedTime = this.fspStartTimestamp;
                  if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.fspClsEnable) {
                      this.initClsPositionChangeObserver('success');
                  }
                  else {
                      this.report('success', this.fspStartTimestamp);
                  }
                  return;
              }
              this.observer = new window.MutationObserver(function (mutations) {
                  var _a;
                  try {
                      var mutationTimestamp = Date.now();
                      var records_1 = new Set([]);
                      _this.originMutationCount += 1;
                      logger.log('timestamp: ', mutationTimestamp, 'mutations: ', mutations);
                      _this.fspCostCalcStart();
                      mutations.forEach(function (mutation) {
                          var targetNodeName = (mutation.target.nodeName || '').toUpperCase();
                          // 找不到 nodeName 则直接排除
                          if (!targetNodeName) {
                              return;
                          }
                          // 剔除 script style 等非视觉元素
                          if (NodesFilter.has(targetNodeName)) {
                              return;
                          }
                          // 当为 childList 类型时候
                          if (mutation.type === 'childList') {
                              if (!mutation.addedNodes) {
                                  return;
                              }
                              var addNodes = mutation.addedNodes;
                              // 排除异常情况
                              if (addNodes.length === 0) {
                                  return;
                              }
                              // 在addNodes是一个NodeList，在部分旧版本中NodeList.forEach可能不存在，https://developer.mozilla.org/zh-CN/docs/Web/API/NodeList
                              Array.prototype.forEach.call(addNodes, function (node) {
                                  // 排除没有再 DOM 中的
                                  if (!node.isConnected) {
                                      return;
                                  }
                                  // 如果是文本节点，则取其父元素,当然这里可能是重复的,所以剔除一下
                                  if (_this.isValidTextNode(node)
                                      && _this.isValidElement(mutation.target)) {
                                      // 文本 Node 的父 element 直接视为叶子节点
                                      records_1.add(mutation.target);
                                  }
                                  else if (node.nodeType === Node.ELEMENT_NODE) {
                                      // element 节点则取其叶子 element
                                      var leafElements = _this.getLeafElements(node);
                                      leafElements.forEach(function (el) {
                                          records_1.add(el);
                                      });
                                  }
                              });
                          }
                          else if (mutation.type === 'characterData') {
                              // 当为 text 类型时候, target 为文本节点
                              if (mutation.target.nodeType
                                  === Node.TEXT_NODE
                                  && _this.isValidElement(mutation.target.parentElement)) {
                                  // 文本 Node 的父 element 直接视为叶子节点
                                  records_1.add(mutation.target.parentElement);
                              }
                          }
                      });
                      if (records_1.size > 0) {
                          _this.fspMutationTimestamp = mutationTimestamp;
                          _this.mutationCount += 1;
                          var elements = setToArray(records_1);
                          var success = _this.checkFSP(elements);
                          if (success) {
                              _this.pageLoadedTime = mutationTimestamp;
                              if ((_a = _this.config) === null || _a === void 0 ? void 0 : _a.fspClsEnable) {
                                  _this.initClsPositionChangeObserver('success');
                              }
                              else {
                                  _this.report('success', mutationTimestamp);
                              }
                              _this.stopFSPCheck();
                              _this.fspCostCalcEnd();
                              return true;
                          }
                      }
                      _this.fspCostCalcEnd();
                      // 监听到 dom 变动后 重置定时器
                      _this.resetTimer(true);
                  }
                  catch (error) {
                      logger.log('calc fsp error: ', error);
                      reportSysError$1(error);
                      _this.report('error');
                  }
              });
              // 如果 body 存在 则用 body 作为监听对象 减小监听范围
              var container = document.body || document;
              this.observer.observe(container, {
                  childList: true,
                  subtree: true,
                  characterData: true,
              });
              this.resetTimer(true);
              this.startListener();
          }
          catch (err) {
              reportSysError$1(err);
          }
      };
      PluginFsp2.prototype.reportBridgeExisted = function () {
          return true;
      };
      /**
       * 停止秒开检测 需要关闭三个监听器
       * mutationObserver、定时器、交互监听器
       */
      PluginFsp2.prototype.stopFSPCheck = function () {
          this.observerStop();
          this.resetTimer(false);
          this.removeInteractListener();
      };
      /**
       * 通过上报桥 上报事件
       * @param type 事件类型
       * @param timestamp 时间戳
       */
      PluginFsp2.prototype.report = function (type, timestamp) {
          var _a, _b;
          // 格式化自定义tags
          var customTags = this.formatCustomTags();
          var _c = this.queue.metaData.getInfo(), pagePath = _c.pagePath, project = _c.project, biz = _c.biz, runEnv = _c.runEnv, pageOriginUrl = _c.pageOriginUrl, sdkVersion = _c.sdkVersion, ua = _c.ua, isMSI = _c.isMSI;
          var renderRate = ((_a = this.cubes) === null || _a === void 0 ? void 0 : _a.filter(function (cube) { return cube.filled; }).length) / 18;
          var createMs = timestamp || Date.now();
          var clsReportData;
          if ((_b = this.config) === null || _b === void 0 ? void 0 : _b.fspClsEnable) {
              clsReportData = {
                  calibrateEndType: this.clsEndType,
                  detect_cls: true,
                  ffp_cls_cycle_length: this.clsCycleTime,
                  ffp_cls_cycle_num: this.totalClsCycleCount,
                  ffp_cls_cycle_threshold: this.clsThreshold,
                  ffp_page_loaded: this.fillRateDone && this.reachBottomDone,
                  ffp_loaded_time: this.pageLoadedTime,
                  ffp_page_stable: this.clsPageStable,
                  ffp_loaded_stable_gap: createMs - this.pageLoadedTime,
              };
          }
          var event = __assign(__assign(__assign({}, customTags), { eType: type, createMs: createMs, pagePath: pagePath, pageUrl: pageOriginUrl, appId: project, reachBottom: this.reachBottomDone ? 'reached' : 'notReached', costMs: this.timeCost, isOffline: biz === 'titansx', mutationCount: this.mutationCount, renderRate: renderRate, sdkVersion: sdkVersion, ua: ua, 
              /** 兼容 web 旧框架提供容器内跳转时间戳 */
              pageNavStart: getPageNavStart(), 
              // 转换采样率由 0-100 到 0-1
              $sr: Math.min(this.getSample() / 100, 1) }), (clsReportData !== null && clsReportData !== void 0 ? clsReportData : {}));
          // report bridge 待提供
          logger.log('FSP2 event:', event, "timestamp: ".concat(event.createMs), '模拟FSP时间: ', event.createMs
              - (performance.timeOrigin || performance.timing.navigationStart));
          if (runEnv === ENV.BROWSER && VALID_REPORT_TYPE.indexOf(type) > -1) {
              // 浏览器环境上报指标
              this.addData({
                  type: METRICS_FSP2,
                  ts: Date.now(),
                  tags: __assign({}, event),
                  value: Math.max(event.createMs - this.webStartTimestamp, 0),
              });
          }
          else if (runEnv === ENV.CONTAINER) {
              var bridgeName = 'ffp.record'; // KNB桥名称
              // 如果是MSI桥
              if (isMSI) {
                  bridgeName = 'fspRecord'; // msi桥名称
              }
              this.useBridge(bridgeName, __assign(__assign({}, event), { success: function (result) {
                      logger.log('fsp2 report result ', result);
                  }, fail: function (err) {
                      logger.log('fsp2 report error: ', err);
                  } }));
          }
          // 输出debug信息
          if (this.config.debug && VALID_REPORT_TYPE.indexOf(type) > -1) {
              fspDebug.drawLog(type, event.createMs);
          }
      };
      /** 判断当前环境是否具有秒开2.0需要的API及桥 */
      PluginFsp2.prototype.supportFSP = function () {
          if (!this.reportBridgeExisted()) {
              return false;
          }
          // 兼容 ios 10.3 bug 获取文档尺寸API 返回空
          if (!window.innerWidth && !document.documentElement.clientWidth) {
              return false;
          }
          if (!isFunction(document.elementsFromPoint)) {
              return false;
          }
          if (!isFunction(window.MutationObserver)) {
              return false;
          }
          return true;
      };
      /** 统一处理自定义秒开tag */
      PluginFsp2.prototype.formatCustomTags = function () {
          var tags = this.config.customTags;
          var formatedTags = {};
          if (isObject(tags)) {
              var keys = Object.keys(tags);
              keys.forEach(function (key) {
                  var tagValue = tags[key];
                  // 限制每个维度值长度不能超过 128字符 避免造成服务端压力过大
                  if (String(tagValue).length < MAX_TAG_VALUE_LENGTH) {
                      formatedTags[key] = tagValue;
                  }
              });
          }
          return formatedTags;
      };
      PluginFsp2.prototype.fspCostCalcStart = function () {
          timeCalculator.start();
      };
      PluginFsp2.prototype.fspCostCalcEnd = function () {
          this.timeCost += timeCalculator.end() || 0;
      };
      /** 获取元素节点的所有合法叶子元素节点 */
      PluginFsp2.prototype.getLeafElements = function (element) {
          // 如果元素本身已经是有效元素 则不需要进行叶子节点的迭代
          if (this.isValidElement(element)) {
              return [element];
          }
          var leafElements = [];
          for (var i = 0; i < element.children.length; i++) {
              var child = element.children[i];
              leafElements.push.apply(leafElements, this.getLeafElements(child));
          }
          return leafElements;
      };
      PluginFsp2.prototype.checkFSP = function (elements) {
          try {
              // logger.log('FSP2 valid elements: ', elements);
              for (var i = 0; i < elements.length; i++) {
                  if (!this.fillRateDone) {
                      var filledCount = this.checkFillRate(elements[i]);
                      if (filledCount > this.filledCount) {
                          this.filledCount = filledCount;
                          this.fillRateOrReachChangeTime =
                              this.fspMutationTimestamp;
                      }
                  }
                  if (!this.reachBottomDone) {
                      this.checkReachBottom(elements[i]);
                      if (this.reachBottomDone) {
                          this.fillRateOrReachChangeTime =
                              this.fspMutationTimestamp;
                      }
                  }
                  if (this.fillRateDone && this.reachBottomDone) {
                      return true;
                  }
              }
              return false;
          }
          catch (error) {
              logger.log('FSP2 calc error: ', error);
              this.report('error');
          }
      };
      /** 初始化时检测 针对静态页面和SSR页面 */
      PluginFsp2.prototype.timeoutFspCalc = function () {
          try {
              var elements = this.getLeafElements(document.body);
              for (var i = 0; i < elements.length; i++) {
                  if (!this.fillRateDone) {
                      this.checkFillRate(elements[i]);
                  }
                  if (!this.reachBottomDone) {
                      this.checkReachBottom(elements[i]);
                  }
                  if (this.fillRateDone && this.reachBottomDone) {
                      return true;
                  }
              }
              return false;
          }
          catch (error) {
              this.report('error');
          }
      };
      PluginFsp2.prototype.isValidTextNode = function (node) {
          var _a;
          // 需要过滤掉去除空格后为空的文本节点
          return (node.nodeType === Node.TEXT_NODE && Boolean((_a = node.nodeValue) === null || _a === void 0 ? void 0 : _a.trim()));
      };
      PluginFsp2.prototype.shouldIgnoreElement = function (node, ignoreAttr) {
          if (node.__fspIgnored) {
              return true;
          }
          if (ignoreAttr) {
              node.__fspIgnored =
                  node.hasAttribute && node.hasAttribute(ignoreAttr);
          }
          if (!node.__fspIgnored
              && node.parentElement
              && node.parentElement !== document.body) {
              node.__fspIgnored = this.shouldIgnoreElement(node.parentNode, ignoreAttr);
          }
          return Boolean(node.__fspIgnored);
      };
      PluginFsp2.prototype.fspCheckFinished = function () {
          return this.reachBottomDone && this.fillRateDone;
      };
      /** 尽量减少损耗 使用 elementFromPoint 初始进行一次判断 */
      PluginFsp2.prototype.initFSPCheck = function () {
          var _this = this;
          try {
              this.fspCostCalcStart();
              var testStart = Date.now();
              // 条件1 18宫格填充率 > 90%
              var filledCount_1 = 0;
              this.cubes.forEach(function (cube) {
                  var isFilled = cube.innerPoints.some(function (point) {
                      return _this.isValidElementByPoint(point);
                  });
                  cube.filled = isFilled;
                  if (isFilled) {
                      logger.log('cube', cube, 'is filled in precheck');
                      filledCount_1 += 1;
                  }
              });
              this.filledCount = filledCount_1;
              if (filledCount_1 > FILL_CUBE_NUM) {
                  logger.log('precheck fillRate ok');
                  this.fillRateDone = true;
              }
              // 条件2 可见元素触底
              var reachBottomSuccess = this.bottomPoints.some(function (point) {
                  return _this.isValidElementByPoint(point);
              });
              if (reachBottomSuccess) {
                  logger.log('precheck reachBottom ok');
                  this.reachBottomDone = true;
              }
              logger.log('init cost: ', Date.now() - testStart);
              this.fspCostCalcEnd();
              if (this.fillRateDone && this.reachBottomDone) {
                  return true;
              }
              return false;
          }
          catch (error) {
              logger.log('err ', error);
          }
      };
      PluginFsp2.prototype.isValidElementByPoint = function (point) {
          var elements = document.elementsFromPoint(point.x, point.y);
          if (!elements) {
              return false;
          }
          for (var i = 0; i < elements.length; i++) {
              var element = elements[i];
              var elementName = element.nodeName.toUpperCase();
              if (elementName === 'BODY') {
                  return false;
              }
              var isValid = this.isValidElement(element);
              if (isValid) {
                  return true;
              }
          }
          return false;
      };
      /**
       * 初始化位置变化观察器。
       * 该位置变化器用于cls检测，目前仅在秒开SUCCESS的状态开启
       * 通过 MutationObserver 监听 DOM 的变化，对新增的节点和当前页面上的所有元素进行位置变化监听。
       */
      PluginFsp2.prototype.initClsPositionChangeObserver = function (type) {
          var _this = this;
          var _a;
          if (!((_a = this.config) === null || _a === void 0 ? void 0 : _a.fspClsEnable)) {
              return;
          }
          this.clsCycleStartTime = Date.now();
          this.clsEndType = type; // 对齐KNB标准容器的实现，仅在秒开SUCCESS的状态开启，所以这里恒为成功状态
          // 开始轮询检测cls
          this.startClsCyclePolling(type);
          // 开始监听dom变化
          this.stopClsObserver();
          this.clsObserver = new MutationObserver(function (mutations) {
              try {
                  mutations.forEach(function (mutation) {
                      switch (mutation.type) {
                          case 'childList': {
                              // 处理新增节点
                              if (mutation.addedNodes.length) {
                                  mutation.addedNodes.forEach(function (node) {
                                      if (node.nodeType === Node.ELEMENT_NODE) {
                                          var element = node;
                                          var rect = element.getBoundingClientRect();
                                          if (_this.isInViewport(rect)) {
                                              _this.clsObserverNodesRects.push({ element: element, rect: rect });
                                          }
                                      }
                                  });
                              }
                              break;
                          }
                          case 'attributes': {
                              if (mutation.target.nodeType === Node.ELEMENT_NODE) {
                                  var element = mutation.target;
                                  var rect = element.getBoundingClientRect();
                                  if (_this.isInViewport(rect)) {
                                      _this.clsObserverNodesRects.push({ element: element, rect: rect });
                                  }
                              }
                              break;
                          }
                          case 'characterData': {
                              if (mutation.target.parentElement) {
                                  var element = mutation.target.parentElement;
                                  var rect = element.getBoundingClientRect();
                                  if (_this.isInViewport(rect)) {
                                      _this.clsObserverNodesRects.push({ element: element, rect: rect });
                                  }
                              }
                              break;
                          }
                      }
                  });
                  // 批量处理收集到的变化
                  if (_this.clsObserverNodesRects.length > 0) {
                      var distance = _this.compareNodePositionChange();
                      _this.calculateScore(distance);
                      _this.clsObserverNodesRects = [];
                  }
              }
              catch (error) {
                  logger.log('stable check error', error);
              }
          });
          this.clsObserver.observe(document.body, {
              childList: true,
              subtree: true,
              attributes: true,
              characterData: true, // 监听文本变化
          });
      };
      PluginFsp2.prototype.startClsCyclePolling = function (type) {
          var _this = this;
          this.clearClsTimer();
          this.clsTimer = window.setInterval(function () {
              _this.clsCycleCount += 1;
              _this.totalClsCycleCount += 1;
              logger.log("----->cls: ".concat(_this.cls, ", clsCycleCount: ").concat(_this.clsCycleCount));
              // 如果cls超出阈值，则重新开始轮询计算
              if (_this.cls >= _this.clsThreshold) {
                  _this.resetCycle(Date.now(), type);
                  return;
              }
              // 超过最大轮询次数 且 cls每次都在阈值内，代表页面稳定
              if (_this.clsCycleCount >= _this.clsMaxCycleCount) {
                  _this.clsPageStable = true;
                  _this.cls = 0;
                  _this.clsCycleCount = 0;
                  _this.clearClsTimer();
                  _this.stopClsObserver();
                  logger.log("----->stop, isStabilize, ".concat(_this.clsCycleStartTime));
                  _this.report(type, _this.clsCycleStartTime);
              }
              else {
                  _this.cls = 0; // 清零CLS值
              }
          }, this.clsCycleTime);
      };
      /** 当cls单次轮询时间周期内超过阈值，则重新开始cls计算 */
      PluginFsp2.prototype.resetCycle = function (startTime, type) {
          this.cls = 0;
          this.clsCycleCount = 0;
          this.clsCycleStartTime = startTime;
          this.startClsCyclePolling(type);
      };
      PluginFsp2.prototype.clearClsTimer = function () {
          if (this.clsTimer) {
              clearInterval(this.clsTimer);
              this.clsTimer = null;
          }
      };
      PluginFsp2.prototype.stopClsObserver = function () {
          if (this.clsObserver) {
              try {
                  this.clsObserver.disconnect();
                  this.clsObserver = null;
                  logger.log('----->stop clsobserver');
              }
              catch (error) {
                  logger.log('----->stop clsobserver error', error);
              }
          }
      };
      PluginFsp2.prototype.compareNodePositionChange = function () {
          var _this = this;
          var distance = 0;
          this.clsObserverNodesRects.forEach(function (elementWithRect) {
              var currentDistance = _this.clsNodePositionChange(elementWithRect);
              distance = Math.max(distance, currentDistance);
          });
          return distance;
      };
      PluginFsp2.prototype.clsNodePositionChange = function (elementWithRect) {
          if (!elementWithRect)
              return 0;
          var element = elementWithRect.element, currentRect = elementWithRect.rect;
          // 直接使用 element 作为 key
          var lastRect = this.elementRects.get(element) || currentRect;
          // 初始化方向比值
          var distance = 0;
          // 如果当前矩形与上次记录的矩形不同，则认为位置发生了变化
          if (!this.rectsAreEqual(lastRect, currentRect)) {
              // 获取屏幕宽度和高度
              var screenWidth = document.documentElement.clientWidth;
              var screenHeight = document.documentElement.clientHeight;
              // 计算横向和纵向移动距离
              var horizontalMove = Math.abs(currentRect.left - lastRect.left);
              var verticalMove = Math.abs(currentRect.top - lastRect.top);
              // 判断移动方向并取最大值
              var maxMove = 0;
              if (horizontalMove > verticalMove) {
                  // 如果横向移动大于纵向移动，取横向移动距离
                  maxMove = horizontalMove;
                  distance = maxMove / screenWidth; // 与屏幕宽度作比例
              }
              else {
                  // 否则，取纵向移动距离
                  maxMove = verticalMove;
                  distance = maxMove / screenHeight; // 与屏幕高度作比例
              }
              // 将当前变化的矩形添加到数组中
              this.allMovedNodesRects.push(currentRect);
          }
          // 更新上次记录的矩形为当前矩形
          this.elementRects.set(element, currentRect);
          // 返回计算得到的方向比值
          return distance;
      };
      // 计算最大矩形和得分的函数
      PluginFsp2.prototype.calculateScore = function (distance) {
          // 在所有检查完成后，计算所有变化节点构成的最大矩形
          if (this.allMovedNodesRects.length > 0) {
              var boundingRect = this.allMovedNodesRects.reduce(function (acc, rect) { return ({
                  top: Math.min(acc.top, rect.top),
                  right: Math.max(acc.right, rect.right),
                  bottom: Math.max(acc.bottom, rect.bottom),
                  left: Math.min(acc.left, rect.left)
              }); }, { top: Infinity, right: -Infinity, bottom: -Infinity, left: Infinity });
              // 获取屏幕宽度和高度
              var screenWidth = document.documentElement.clientWidth;
              var screenHeight = document.documentElement.clientHeight;
              // 屏幕可视范围面积
              var viewportArea = screenWidth * screenHeight;
              // 计算最大矩形与屏幕可视范围的交集矩形
              var intersectionRect = {
                  top: Math.max(boundingRect.top, 0),
                  right: Math.min(boundingRect.right, screenWidth),
                  bottom: Math.min(boundingRect.bottom, screenHeight),
                  left: Math.max(boundingRect.left, 0)
              };
              var rectArea = 0;
              // 确保交集矩形的有效性（右边界大于左边界，底边界大于顶边界）
              if (intersectionRect.right > intersectionRect.left
                  && intersectionRect.bottom > intersectionRect.top) {
                  // 计算交集矩形的面积
                  var intersectionArea = (intersectionRect.right - intersectionRect.left)
                      * (intersectionRect.bottom - intersectionRect.top);
                  // 使用交集矩形的面积进行后续计算
                  rectArea = intersectionArea;
              }
              else {
                  // 如果没有有效的交集，面积为0
                  rectArea = 0;
              }
              // 计算矩形面积与屏幕可视范围面积的比值
              var impact = rectArea / viewportArea;
              // 计算最终的比值
              var finalRatio = impact * distance;
              this.allMovedNodesRects = [];
              // 可以在这里记录或处理最终的比值和其他信息
              logger.log("impact: ".concat(impact, ", distance: ").concat(distance, ", score: ").concat(finalRatio));
              // 累加到全局CLS值中
              this.cls += finalRatio;
              logger.log("-----> cls calculate: ".concat(this.cls));
          }
      };
      /** 工具方法：判断一个DOMRect是否在可见范围内 */
      PluginFsp2.prototype.isInViewport = function (rect) {
          var screenWidth = document.documentElement.clientWidth;
          var screenHeight = document.documentElement.clientHeight;
          return rect.right > 0 && rect.left < screenWidth && rect.bottom > 0 && rect.top < screenHeight;
      };
      /**
       * 比较两个矩形的左上角位置是否相等。
       * @param rect1 第一个矩形
       * @param rect2 第二个矩形
       * @returns 矩形四个顶点位置是否相等
       */
      PluginFsp2.prototype.rectsAreEqual = function (rect1, rect2) {
          var leftEuqal = rect1.left === rect2.left || (rect1.left <= 0 && rect2.left <= 0);
          var topEqual = rect1.top === rect2.top || (rect1.top <= 0 && rect2.top <= 0);
          var rightEqual = rect1.right === rect2.right || (rect1.right >= this.viewportWidth && rect2.right >= this.viewportWidth);
          var bottomEqual = rect1.bottom === rect2.bottom || (rect1.bottom >= this.viewportHeight && rect2.bottom >= this.viewportHeight);
          return rightEqual && leftEuqal && topEqual && bottomEqual;
      };
      PluginFsp2.id = PLUGIN_NAME.FSP2;
      return PluginFsp2;
  }(BasePlugin));

  var defaultOption$2 = {
      disable: false,
      sampleRate: 5,
  };
  var PluginShr = /** @class */ (function (_super) {
      __extends(PluginShr, _super);
      function PluginShr(queue, config) {
          if (config === void 0) { config = defaultOption$2; }
          var _this = _super.call(this, queue, config) || this;
          _this.name = PluginShr.id;
          _this.animationFrameId = null; // 保存 requestAnimationFrame 的 ID
          _this.disable = true;
          _this.sampleRate = 0;
          _this.isScrolling = false;
          _this.scrollStartTime = 0;
          _this.scrollEndTime = 0;
          _this.lastScrollY = 0;
          _this.lastScrollChangeTime = Date.now();
          _this.SCROLL_END_THRESHOLD = 150; // ms
          _this.scrollTarget = null; // 当前滚动的目标元素
          _this.totalFrameTimeDiff = 0;
          _this.expectedFrameTime = 1000 / 60;
          _this.frameCount = 0; // 添加帧数计数器
          _this.lastFrameTimestamp = 0;
          _this.timeCost = 0;
          _this.config = extend$1(defaultOption$2, _this.config);
          _this.disable = _this.config.disable;
          _this.sampleRate = _this.config.sampleRate;
          logger.log('[shr] config' + _this.config);
          return _this;
      }
      PluginShr.prototype.init = function () {
          if (this.disable) {
              return;
          }
          try {
              if (isNaN(this.sampleRate) || Math.random() > this.sampleRate) {
                  return;
              }
              if (typeof window.requestAnimationFrame !== 'function') {
                  return;
              }
              this.scrollListener = this.handleScroll.bind(this);
              this.trackFrameBind = this.trackFrame.bind(this); // 绑定 trackFrame 方法
              window.addEventListener('scroll', this.scrollListener, {
                  passive: true,
                  capture: true,
              });
          }
          catch (e) {
              console.log("[shr] observer error".concat(JSON.stringify(e)));
          }
      };
      /**
       * 发送数据到 worker
       *
       * @param root0
       * @param root0.scrollData
       */
      PluginShr.prototype.sendScrollStartEndTimeToWorker = function (_a) {
          var scrollData = _a.scrollData;
          var info = this.queue.metaData.getInfo();
          var pagePath = info.pagePath, project = info.project;
          var bridgeName = 'shr.sendScrollStateTime';
          this.useBridge(bridgeName, {
              pagePath: pagePath,
              techStack: 'knb',
              scrollStartTime: scrollData.scrollStartTime,
              scrollEndTime: scrollData.scrollEndTime,
              extra: __assign({ $sr: this.sampleRate / 100, appId: project, gatherSource: 'js', costMs: this.timeCost }, info)
          });
      };
      PluginShr.prototype.handleScroll = function (e) {
          try {
              this.shrCostCalcStart();
              var target = e.target;
              if (this.isScrolling && target !== this.scrollTarget) {
                  return;
              }
              var now = Date.now();
              var currentY = this.getScrollValue(target);
              if (currentY !== this.lastScrollY) {
                  this.lastScrollY = currentY;
                  this.lastScrollChangeTime = now;
              }
              // 只在未处于滚动状态时上报"滑动开始"
              if (!this.isScrolling) {
                  this.isScrolling = true;
                  this.scrollTarget = target; // 记录当前滚动的目标元素
                  this.scrollStartTime = now;
                  var scrollTimeData = {
                      scrollStartTime: this.scrollStartTime,
                      scrollEndTime: 0,
                  };
                  this.sendScrollStartEndTimeToWorker({ scrollData: scrollTimeData });
                  logger.log("[shr] \u6ED1\u52A8\u5F00\u59CB\u4E0A\u62A5 ".concat(JSON.stringify(scrollTimeData)));
                  // 开始滚动时才启动 requestAnimationFrame
                  this.startScrollTracking();
              }
              this.shrCostCalcEnd();
          }
          catch (error) {
              logger.log('scroll error', error);
          }
      };
      /**
       * 开始使用 requestAnimationFrame 跟踪滚动
       */
      PluginShr.prototype.startScrollTracking = function () {
          // 如果已经在跟踪中，不重复启动
          if (this.animationFrameId !== null) {
              return;
          }
          // 启动 requestAnimationFrame 循环
          this.animationFrameId = requestAnimationFrame(this.trackFrameBind);
          logger.log('[shr] 开始跟踪滚动');
      };
      /**
       * 停止 requestAnimationFrame 跟踪
       */
      PluginShr.prototype.stopScrollTracking = function () {
          // 如果有活跃的 animationFrameId，取消它
          if (this.animationFrameId !== null) {
              cancelAnimationFrame(this.animationFrameId);
              this.animationFrameId = null;
              logger.log('[shr] 停止跟踪滚动');
          }
      };
      PluginShr.prototype.trackFrame = function (timestamp) {
          try {
              this.shrCostCalcStart();
              var now = Date.now();
              var currentY = this.getScrollValue(this.scrollTarget);
              // 计算帧率相关数据
              if (this.lastFrameTimestamp > 0) {
                  var frameDuration = timestamp - this.lastFrameTimestamp;
                  // 计算超出预期帧时间的部分（掉帧时间）
                  var frameDiff = frameDuration - this.expectedFrameTime;
                  this.totalFrameTimeDiff += frameDiff;
              }
              this.lastFrameTimestamp = timestamp;
              this.frameCount = this.frameCount + 1; // 每帧增加计数
              // 只要有变化就刷新lastScrollChangeTime
              if (currentY !== this.lastScrollY) {
                  this.lastScrollY = currentY;
                  this.lastScrollChangeTime = now;
              }
              // 判断是否滑动结束
              if (this.isScrolling // 只要处于滚动状态
                  && now - this.lastScrollChangeTime > this.SCROLL_END_THRESHOLD) {
                  this.scrollEndTime = this.lastScrollChangeTime; // 用最后一次变化的时间
                  var scrollTimeData = {
                      scrollStartTime: this.scrollStartTime,
                      scrollEndTime: this.scrollEndTime,
                  };
                  if (isNumber(this.scrollStartTime)
                      && isNumber(this.scrollEndTime)
                      && this.scrollStartTime > 0
                      && this.scrollEndTime > 0
                      && this.scrollEndTime > this.scrollStartTime // 确保结束时间不早于开始时间
                  ) {
                      // 计算本次滚动时长（毫秒）并累加到总滚动时长
                      var currentScrollDuration = this.scrollEndTime - this.scrollStartTime;
                      var frameTimeDiff = Math.max(0, this.totalFrameTimeDiff);
                      var frameDropRate = (frameTimeDiff / currentScrollDuration) * 1000;
                      // 移除每次滚动结束时的掉帧率计算，只记录日志
                      logger.log("[shr] \u6ED1\u52A8\u7ED3\u675F\u4E0A\u62A5 ".concat(JSON.stringify(scrollTimeData), ", ")
                          + "\u672C\u6B21\u6ED1\u52A8\u65F6\u957F: ".concat(currentScrollDuration, "ms, ")
                          + "\u672C\u6B21\u6ED1\u52A8\u6389\u5E27\u7387: ".concat(frameDropRate, ", ")
                          + "\u672C\u6B21\u6ED1\u52A8\u5E27\u6570: ".concat(this.frameCount));
                      var runEnv = this.queue.metaData.getInfo().runEnv;
                      var event_1 = {
                          scrollDuration: currentScrollDuration,
                          frameCount: this.frameCount,
                          costMs: this.timeCost
                      };
                      if (runEnv === ENV.BROWSER) {
                          this.queue.add({
                              type: METRICS_SHR,
                              ts: Date.now(),
                              tags: event_1,
                              value: frameDropRate,
                          });
                      }
                      else if (runEnv === ENV.CONTAINER) {
                          this.sendScrollStartEndTimeToWorker({
                              scrollData: scrollTimeData,
                          });
                      }
                  }
                  this.isScrolling = false;
                  this.lastFrameTimestamp = 0; // 重置帧时间戳
                  this.totalFrameTimeDiff = 0;
                  this.frameCount = 0; // 重置帧数计数器
                  this.scrollTarget = null; // 清除滚动目标元素
                  // 滚动结束后停止 requestAnimationFrame 循环
                  this.stopScrollTracking();
                  this.shrCostCalcEnd();
                  return; // 不再请求下一帧
              }
              // 只有在仍然滚动时才继续请求下一帧
              if (this.isScrolling) {
                  this.animationFrameId = requestAnimationFrame(this.trackFrameBind);
              }
              this.shrCostCalcEnd();
          }
          catch (error) {
              logger.log("[shr] trackFrame error: ".concat(error));
          }
      };
      PluginShr.prototype.getScrollValue = function (element) {
          if (!element) {
              return 0;
          }
          if (element === document || element === document.documentElement) {
              return window.scrollY || document.documentElement.scrollTop;
          }
          return element.scrollTop;
      };
      PluginShr.prototype.shrCostCalcStart = function () {
          timeCalculator.start();
      };
      PluginShr.prototype.shrCostCalcEnd = function () {
          this.timeCost += timeCalculator.end() || 0;
      };
      PluginShr.id = PLUGIN_NAME.SHR;
      return PluginShr;
  }(BasePlugin));

  var defaultOption$1 = {
      disable: false,
      sampleRate: 5,
  };
  var PluginIrd = /** @class */ (function (_super) {
      __extends(PluginIrd, _super);
      function PluginIrd(queue, config) {
          if (config === void 0) { config = defaultOption$1; }
          var _this = _super.call(this, queue, config) || this;
          _this.name = PluginIrd.id;
          _this.disable = true;
          _this.sampleRate = 0;
          _this.timeout = 3000; // 设置超时时间为 3 秒
          _this.config = extend$1(defaultOption$1, _this.config);
          _this.disable = _this.config.disable;
          _this.sampleRate = _this.config.sampleRate;
          logger.log('[ird] config', _this.config);
          return _this;
      }
      PluginIrd.prototype.init = function () {
          if (this.disable) {
              return;
          }
          try {
              if (Math.random() > this.sampleRate) {
                  return;
              }
              if (typeof window.requestAnimationFrame !== 'function') {
                  return;
              }
              logger.log('[ird] observer --功能开启');
              // NativeModules.ReporterModule.reportLog(`[ird observer] 功能开启`)
              this.touchEndListener = this.handleTouchEnd.bind(this); // 绑定方法
              window.addEventListener('touchend', this.touchEndListener, {
                  capture: true,
              });
          }
          catch (error) {
              logger.log('[ird] observer --error' + JSON.stringify(error));
          }
      };
      PluginIrd.prototype.handleTouchEnd = function () {
          var _this = this;
          var timeoutId = null;
          var rafId = null;
          try {
              // 设置一个计时器，如果 3 秒内没有触发 requestAnimationFrame，就打印日志
              timeoutId = window.setTimeout(function () {
                  logger.log('[ird] 交互响应超时');
                  _this.report(_this.timeout);
                  if (rafId !== null) {
                      cancelAnimationFrame(rafId);
                      rafId = null;
                  }
              }, this.timeout); // 3 秒
              var startTime_1 = performance.now();
              rafId = window.requestAnimationFrame(function () {
                  var endTime = performance.now();
                  var resultTime = endTime - startTime_1;
                  logger.log('[ird] 交互响应时间: ', resultTime);
                  // 在成功触发时取消计时器
                  if (timeoutId !== null) {
                      clearTimeout(timeoutId);
                      timeoutId = null;
                  }
                  _this.report(resultTime);
              });
          }
          catch (e) {
              logger.log('[ird] handleTouchEnd observer error: ', e);
          }
      };
      /**
       * 通过上报桥 上报事件
       * @param rValue
       */
      PluginIrd.prototype.report = function (rValue) {
          var info = this.queue.metaData.getInfo();
          var runEnv = info.runEnv, pagePath = info.pagePath, project = info.project;
          if (runEnv === ENV.BROWSER) {
              this.queue.add({
                  type: METRICS_IRD,
                  value: rValue,
                  ts: Date.now(),
                  tags: {},
              });
          }
          else if (runEnv === ENV.CONTAINER) {
              var bridgeName = 'ird.record'; // KNB桥名称
              this.useBridge(bridgeName, {
                  pagePath: pagePath,
                  techStack: 'knb',
                  value: rValue,
                  tags: __assign({ $sr: this.sampleRate / 100, gatherSource: 'js', appId: project }, info),
                  success: function (result) {
                      logger.log('ird report result ', result);
                  },
                  fail: function (err) {
                      logger.log('ird report error: ', err);
                  },
              });
          }
      };
      PluginIrd.id = PLUGIN_NAME.IRD;
      return PluginIrd;
  }(BasePlugin));

  var DEFAULT_LS_KEY = '__perf_cache';
  var LSManager = /** @class */ (function () {
      function LSManager(key) {
          this.LS_KEY = DEFAULT_LS_KEY;
          this.LS_KEY = key || DEFAULT_LS_KEY;
      }
      LSManager.prototype.get = function () {
          var data = [];
          try {
              var cacheStr = localStorage.getItem(this.LS_KEY);
              if (cacheStr) {
                  var cacheArr = JSON.parse(cacheStr);
                  if (isArray(cacheArr)) {
                      data = cacheArr;
                  }
              }
          }
          catch (error) {
              logger.log('获取缓存内容失败', error);
          }
          return data;
      };
      LSManager.prototype.save = function (data) {
          if (!isArray(data))
              return false;
          var oldCache = this.get();
          var newCahce = oldCache.concat(data);
          try {
              localStorage.setItem(this.LS_KEY, JSON.stringify(newCahce));
          }
          catch (error) {
              logger.log('存储日志到缓存失败', error);
          }
      };
      LSManager.prototype.clear = function () {
          try {
              localStorage.removeItem(this.LS_KEY);
          }
          catch (error) {
              logger.log(error);
          }
      };
      return LSManager;
  }());

  var LS = new LSManager();
  var HOOK_SEND_FAIL$1 = 'send-fail';
  var defaultOption = {
      disable: false,
      useSendBeacon: true,
      sampleRate: 100,
  };
  var PluginCache = /** @class */ (function (_super) {
      __extends(PluginCache, _super);
      function PluginCache(queue, config) {
          if (config === void 0) { config = defaultOption; }
          var _this = _super.call(this, queue, config) || this;
          _this.name = PluginCache.id;
          _this.queue = queue;
          _this.config = extend$1(defaultOption, _this.config);
          return _this;
      }
      PluginCache.prototype.init = function () {
          var _this = this;
          this.checkCache();
          this.queue.on(HOOK_SEND_FAIL$1, function (cache) {
              // 防止网络问题，导致大量log 上报失败 占用大量 localstorage 空间 限制存储日志数量
              if (cache.length > 50) {
                  return false;
              }
              LS.save(cache);
          });
          // 监听 beforeunload 事件 防止队列中待上传日志丢失
          window.addEventListener('beforeunload', function () {
              var cache = _this.queue.cache;
              if (cache.length > 0) {
                  if ((navigator === null || navigator === void 0 ? void 0 : navigator.sendBeacon)
                      && typeof navigator.sendBeacon === 'function'
                      && _this.config.useSendBeacon) {
                      navigator.sendBeacon(REPORT_URL, stringify(_this.queue.buildEvent()));
                  }
                  else {
                      LS.save(cache);
                  }
              }
          });
      };
      PluginCache.prototype.checkCache = function () {
          var cache = LS.get();
          if (cache.length > 0) {
              this.addData(cache);
              LS.clear();
          }
      };
      PluginCache.id = PLUGIN_NAME.CACHE;
      return PluginCache;
  }(BasePlugin));

  function entryGen(TrackerCtor) {
      var started = false;
      var tracker = null;
      var perfActionByName = {
          init: function (options, cfgManager) {
              if (started)
                  return false;
              started = true;
              tracker = new TrackerCtor(options, cfgManager);
              return true;
          },
          /**
           * 设置全局自定义tag
           * @param tags 自定义tag key/value
           */
          setTag: function (tags) {
              if (started) {
                  tracker === null || tracker === void 0 ? void 0 : tracker.setTag(tags);
              }
          },
          /** 老通道自定义指标 后续废除 */
          reportPerformance: function (type, value, tags) {
              if (started && tracker) {
                  tracker.reportPerformance(type, value, tags);
              }
          },
          use: function (pluginCtors) {
              if (started) {
                  logger.warn('perf已初始化，请在初始化前加载插件');
                  return;
              }
              if (isArray(pluginCtors)) {
                  pluginCtors.forEach(function (pluginCtor) {
                      TrackerCtor.use(pluginCtor);
                  });
              }
              else {
                  TrackerCtor.use(pluginCtors);
              }
          },
          /** 新通道自定义指标 */
          addCustomMetrics: function (type, value, tags) {
              if (started && tracker) {
                  tracker.addCustomMetrics(type, value, tags);
              }
          },
      };
      var actionNames = Object.keys(perfActionByName);
      /* 融合sdk暂时不支持打包不同环境的sdk，所以这里不用判断 */
      /** 如果在非容器环境使用容器环境的 SDK 直接默认空函数 */
      /* if (TrackerCtor.id === 'MT_TRACKER' && !getTitansVersion()) {
             clearLoader()
             // eslint-disable-next-line @typescript-eslint/no-empty-function
             return function perf() {}
         } */
      // 对外暴露函数 而不是对象 便于在通过 script 标签引入时，做资源加载失败时 容错处理
      return function perf(key) {
          var rest = [];
          for (var _i = 1; _i < arguments.length; _i++) {
              rest[_i - 1] = arguments[_i];
          }
          if (actionNames.indexOf(key) > -1) {
              var perfAction = perfActionByName[key];
              perfAction.apply(void 0, rest);
          }
      };
  }
  /**
   * SDK 本体加载完成时，获取预加载模块的调用参数并启动 SDK
   * @param perf 待启动 perf 函数
   * @param initType 启动类型 浏览器环境、web容器环境为 init，小程序环境自启动为 hash
   */
  function handlePreInit(perf, initType) {
      if (initType === void 0) { initType = 'init'; }
      var _perf_ = window._perf_ || {};
      if (_perf_.initOptions) {
          perf(initType, _perf_.initOptions);
      }
  }

  var BaseTracker = /** @class */ (function (_super) {
      __extends(BaseTracker, _super);
      function BaseTracker(_, cfgManager) {
          var _this = _super.call(this) || this;
          _this._pluginInsMap = new Map();
          _this.cfgManager = cfgManager;
          return _this;
      }
      BaseTracker.prototype.getPlugin = function (name) {
          var pluginIns = this._pluginInsMap.get(name);
          if (!pluginIns) {
              logger.log("\u63D2\u4EF6".concat(name, "\u6CA1\u6709\u52A0\u8F7D\u6210\u529F"));
          }
          return pluginIns;
      };
      BaseTracker.prototype.setTag = function (tags) {
          this.metaData.setTags(tags);
      };
      /**
       * 老通道上报自定义指标
       * @param type 自定义指标名称
       * @param value 自定义指标数值
       * @param tags 自定义指标 tags
       */
      BaseTracker.prototype.reportPerformance = function (type, value, tags) {
          this.queue.add({
              type: type,
              value: value,
              ts: Date.now(),
              tags: tags,
          });
      };
      /**
       * 上报新通道自定义指标
       * @param type 自定义指标名称
       * @param value 自定义指标数值
       * @param tags 自定义指标 tags
       */
      BaseTracker.prototype.addCustomMetrics = function (type, value, tags) {
          this.custom_queue.add({
              type: type,
              value: value,
              ts: Date.now(),
              tags: tags,
          });
      };
      BaseTracker.prototype.setPluginInsMap = function (name, plugin) {
          if (this._pluginInsMap.has(name)) {
              logger.warn('插件实例已经加载');
              return false;
          }
          this._pluginInsMap.set(name, plugin);
      };
      return BaseTracker;
  }(EventEmitter));

  var BaseMetaData = /** @class */ (function () {
      function BaseMetaData(_a, tracker) {
          var project = _a.project, version = _a.version, pagePath = _a.pagePath;
          this.pagePath = '';
          this.globalTags = {};
          this.project = project;
          this.version = version !== null && version !== void 0 ? version : '';
          if (pagePath) {
              this.pagePath = pagePath;
          }
          var screen = window.screen;
          this.screen = screen ? "".concat(screen.width, "x").concat(screen.height) : '-';
          this.sdkVersion = version$1;
          this.ua = window.navigator.userAgent;
          this.visitId = getVisitId();
          this.tracker = tracker;
      }
      BaseMetaData.prototype.getInfo = function () {
          return __assign(__assign({}, this.globalTags), { project: this.getProject(), screen: this.screen, version: this.version, sdkVersion: this.sdkVersion, ua: this.ua, visitId: this.visitId, pagePath: this.getPath(), pageOriginUrl: getPageUrl(), runEnv: this.runEnv, biz: this.biz });
      };
      BaseMetaData.prototype.setTags = function (tags) {
          if (!tags || typeof tags !== 'object')
              return;
          this.globalTags = extend$1(this.globalTags, tags);
      };
      BaseMetaData.prototype.getPath = function () {
          var cfgManager = this.tracker.cfgManager;
          if (cfgManager) {
              var perfConfig = cfgManager.get('perf') || {};
              if (perfConfig.pagePath) {
                  return perfConfig.pagePath;
              }
          }
          if (this.pagePath) {
              return this.pagePath;
          }
          return location.pathname;
      };
      BaseMetaData.prototype.getEnv = function () {
          return this.runEnv;
      };
      BaseMetaData.prototype.getProject = function () {
          var cfgManager = this.tracker.cfgManager;
          if (cfgManager) {
              var perfConfig = cfgManager.get('perf') || {};
              if (perfConfig.project) {
                  return perfConfig.project;
              }
          }
          return this.project;
      };
      return BaseMetaData;
  }());

  var BrowserMetaData = /** @class */ (function (_super) {
      __extends(BrowserMetaData, _super);
      function BrowserMetaData(baseInfo, tracker) {
          var _this = _super.call(this, baseInfo, tracker) || this;
          _this.deviceType = '';
          _this.runEnv = ENV.BROWSER;
          _this.networkType = '';
          _this.biz = 'web';
          _this.uuid =
              getCookie$1('uuid')
                  || getCookie$1('unionid')
                  || getCookie$1('dpid')
                  || getCookie$1('_lxsdk_cuid')
                  || '';
          var os = getOsByUA(_this.ua);
          _this.os = os;
          // 具体机型 android 由服务端计算， iOS端暂时不再维护端上计算iOS机型逻辑(维护难度大、包体积过大) 默认为 iPhone 后续看需求在服务端计算
          if (os === 'iOS') {
              _this.deviceType = 'iPhone';
          }
          // 获取网络类型
          _this.networkType = getNetworkType();
          return _this;
      }
      BrowserMetaData.prototype.getInfo = function () {
          var env = __assign(__assign({}, _super.prototype.getInfo.call(this)), { os: this.os, networkType: this.networkType, uuid: this.uuid });
          if (this.deviceType) {
              env.deviceType = this.deviceType;
          }
          return env;
      };
      return BrowserMetaData;
  }(BaseMetaData));

  var BaseTransport = /** @class */ (function () {
      function BaseTransport(options) {
          this.options = options;
      }
      BaseTransport.prototype.send = function (value) {
          if (this.options.api) {
              return this.options.api(value);
          }
          if (!this.options.endpoint) {
              logger.warn('endpoint 不能为空');
              return Promise.reject(false);
          }
          return this.doSend(value);
      };
      return BaseTransport;
  }());

  var AjaxTransport = /** @class */ (function (_super) {
      __extends(AjaxTransport, _super);
      function AjaxTransport() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      /**
       * 通过 ajax 进行事件上报
       * @param event 上报 event 对象
       * @returns Promise<any>
       */
      AjaxTransport.prototype.doSend = function (event) {
          var url = this.options.endpoint;
          return new Promise(function (resolve, reject) {
              var xhr = new XMLHttpRequest();
              xhr.open('POST', url);
              xhr.onreadystatechange = function () {
                  if (xhr.readyState === 4) {
                      if (xhr.status === 200) {
                          resolve(null);
                      }
                      else {
                          reject();
                      }
                  }
              };
              xhr.send(stringify(event));
          });
      };
      return AjaxTransport;
  }(BaseTransport));

  var HOOK_SEND_FAIL = 'send-fail';
  var WebQueue = /** @class */ (function (_super) {
      __extends(WebQueue, _super);
      function WebQueue(transport, config, metaData, category) {
          var _this = _super.call(this) || this;
          _this.cache = [];
          _this.cache_max_len = 20;
          _this.timer = 0;
          _this.send_delay = 500;
          _this._sending_log = {};
          _this.transport = transport;
          _this.config = config;
          _this.metaData = metaData;
          _this.category = category;
          _this.send_delay = _this.config.delay;
          return _this;
      }
      WebQueue.prototype.buildEvent = function () {
          return {
              category: this.category,
              env: this.metaData.getInfo(),
              logs: this.cache,
          };
      };
      WebQueue.prototype.push = function (data) {
          if (isArray(data)) {
              this.cache = this.cache.concat(data);
          }
          else {
              this.cache.push(data);
          }
      };
      WebQueue.prototype.add = function (data, immediately) {
          var _this = this;
          if (immediately === void 0) { immediately = false; }
          this.push(data);
          if (immediately || this.cache.length >= this.cache_max_len) {
              clearTimeout(this.timer);
              this.timer = 0;
              this.send();
          }
          else if (!this.timer) {
              this.timer = setTimeout(function () {
                  try {
                      _this.send();
                      _this.timer = 0;
                  }
                  catch (err) {
                      reportSysError$1(err);
                  }
              }, this.send_delay);
          }
      };
      WebQueue.prototype.send = function () {
          var _this = this;
          var event = this.buildEvent();
          var ts = Date.now();
          this._sending_log[ts] = this.cache;
          this.cache = [];
          this.transport
              .send(event)
              .then(function () {
              _this._sending_log[ts] = undefined;
          })
              .catch(function (err) {
              logger.log('上报日志异常', err);
              _this.emit(HOOK_SEND_FAIL, _this._sending_log[ts]);
              _this._sending_log[ts] = undefined;
          });
      };
      return WebQueue;
  }(EventEmitter));

  var Config = /** @class */ (function () {
      function Config(options) {
          this.dev = (options === null || options === void 0 ? void 0 : options.dev) || false;
          if (typeof (options === null || options === void 0 ? void 0 : options.delay) !== 'number') {
              this.delay = 1000;
          }
          else {
              this.delay = Math.max(options === null || options === void 0 ? void 0 : options.delay, 1000);
          }
      }
      return Config;
  }());

  var WebTracker = /** @class */ (function (_super) {
      __extends(WebTracker, _super);
      function WebTracker(options, cfgManager) {
          var _this = _super.call(this, options, cfgManager) || this;
          var project = options.project, version = options.version, pagePath = options.pagePath, common = options.common, transportOption = options.transportOption, pluginOptions = __rest(options, ["project", "version", "pagePath", "common", "transportOption"]);
          _this.metaData = new BrowserMetaData({ project: project, version: version, pagePath: pagePath }, _this);
          _this.config = new Config(common);
          var transport = new AjaxTransport(__assign({ endpoint: REPORT_URL }, transportOption));
          _this.queue = new WebQueue(transport, _this.config, _this.metaData, CATEGORY);
          var customTransport = new AjaxTransport({
              endpoint: CUSTOM_REPORT_URL,
          });
          _this.custom_queue = new WebQueue(customTransport, _this.config, _this.metaData, CUSTOM_CATEGORY);
          _this.initPlugins(pluginOptions);
          return _this;
      }
      WebTracker.prototype.initPlugins = function (pluginOptions) {
          var _this = this;
          WebTracker._pluginCtorMap.forEach(function (pluginCtor, pluginName) {
              var pluginOption = pluginOptions[pluginName];
              if (!(pluginOption === null || pluginOption === void 0 ? void 0 : pluginOption.disable)) {
                  var plugin = new pluginCtor(_this.queue, pluginOption);
                  if (!plugin.config.disable) {
                      _this.setPluginInsMap(pluginName, plugin);
                      plugin.init();
                      plugin.setEnv(ENV.BROWSER);
                  }
              }
          });
      };
      WebTracker.use = function (pluginCtor) {
          if (this._pluginCtorMap.has(pluginCtor.id)) {
              logger.warn('插件已加载 不能重复加载');
              return;
          }
          this._pluginCtorMap.set(pluginCtor.id, pluginCtor);
      };
      WebTracker.id = 'WEB_TRACKER';
      WebTracker._pluginCtorMap = new Map();
      return WebTracker;
  }(BaseTracker));

  var MtMetaData = /** @class */ (function (_super) {
      __extends(MtMetaData, _super);
      function MtMetaData(info, tracker) {
          var _this = _super.call(this, info, tracker) || this;
          _this.runEnv = ENV.CONTAINER;
          // 根据主文档是否包含 __ot__ 判断是否为离线包页面 https://km.sankuai.com/page/161989510
          _this.biz = window.__ot__ ? 'titansx' : 'titansx-web';
          // 根据 UA 解析出容器版本
          _this.containerVersion = getTitansVersion() || '';
          _this.isMSI = false;
          var useMSI = info.useMSI;
          _this.isMSI = useMSI;
          return _this;
      }
      MtMetaData.prototype.getInfo = function () {
          return __assign(__assign({}, _super.prototype.getInfo.call(this)), { containerVersion: this.containerVersion, isMSI: this.isMSI });
      };
      return MtMetaData;
  }(BaseMetaData));

  var KNB_CACHE_QUEUE = []; // KNB缓存队列
  var knb_cache_queue_init = false; // 是否已经读取了knb缓存
  function initKNBCacheQueue() {
      var KNBCacheLs = new LSManager('perf_knb_cache');
      var cache = KNBCacheLs.get();
      // 防止数据错误，比如数据非数组
      if (isArray(cache)) {
          KNB_CACHE_QUEUE = cache;
      }
      KNBCacheLs.clear();
      // 监听 unload 事件 防止队列中待上传日志丢失，容器可能不存在beforeunload事件
      window.addEventListener('unload', function () {
          logger.log('knb：监听到页面 unload 事件');
          if (KNB_CACHE_QUEUE.length > 0) {
              KNBCacheLs.save(KNB_CACHE_QUEUE);
          }
      });
  }
  /**
   * @description: knb桥方法封装，提供缓存上报能力，等待knb加载后上报
   * @param {*} name 桥方法名称
   * @param {*} opts 入参
   */
  function KNBuseWarp(name, opts) {
      if (!opts) {
          var err = new Error('KNB parameter does not exist');
          logger.log('KNB 桥上报指标失败，error：', err);
          throw err;
          // return
      }
      if (!knb_cache_queue_init) {
          // knb缓存未读取，开始读取缓存
          initKNBCacheQueue();
          knb_cache_queue_init = true;
      }
      if (window.KNB) {
          // 缓存队列存在数据
          if (KNB_CACHE_QUEUE.length) {
              // 依次上报
              try {
                  KNB_CACHE_QUEUE.forEach(function (cacheItem) {
                      var name = cacheItem.name, opts = cacheItem.opts;
                      window.KNB.use(name, opts);
                  });
              }
              catch (err) {
                  logger.log('KNB 读取缓存队列失败，error：', err);
              }
              KNB_CACHE_QUEUE = [];
          }
          // 上报本条数据
          window.KNB.use(name, opts);
      }
      else {
          logger.log('KNB 未加载，数据加入knb缓存');
          // 缓存未超出knb缓存上限
          if (KNB_CACHE_QUEUE.length < KNB_CACHE_QUEUE_MAX_LEN) {
              KNB_CACHE_QUEUE.push({ name: name, opts: opts });
          }
          else {
              // 超出缓存限制，抛弃上报数据
              var err = new Error('knb cache length exceeds limit');
              logger.log('KNB 桥上报指标失败，error：', err);
              throw err;
              // return
          }
      }
  }
  function sendBabelLog(opts) {
      KNBuseWarp('sendBabelLog', opts);
  }
  var MtTransport = /** @class */ (function (_super) {
      __extends(MtTransport, _super);
      function MtTransport() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          /**
           * @description: 直接调用桥
           */
          _this.useBridge = function (name, opts) {
              KNBuseWarp(name, opts);
          };
          return _this;
      }
      MtTransport.prototype.doSend = function (log) {
          var category = this.options.endpoint;
          var type = log.type, value = log.value, tags = log.tags;
          return new Promise(function (resolve, reject) {
              sendBabelLog({
                  category: category,
                  type: type,
                  value: value,
                  tags: tags,
                  success: function (res) {
                      logger.log('knb report result ', res);
                      resolve(true);
                  },
                  fail: function (err) {
                      reject(err);
                  },
              });
          });
      };
      return MtTransport;
  }(BaseTransport));

  var MtQueue = /** @class */ (function (_super) {
      __extends(MtQueue, _super);
      function MtQueue(transport, config, metaData) {
          var _this = _super.call(this) || this;
          _this.useBridge = function () {
              var _a;
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
              }
              return (_a = _this.transport).useBridge.apply(_a, args);
          };
          _this.transport = transport;
          _this.config = config;
          _this.metaData = metaData;
          return _this;
      }
      MtQueue.prototype.add = function (log) {
          // 合并 metadata 中的环境信息
          var info = this.metaData.getInfo();
          log.tags = log.tags
              ? __assign(__assign({}, info), log.tags) : info;
          this.transport.send(log).catch(function (err) {
              logger.log('通过babel 上报异常', err);
          });
      };
      return MtQueue;
  }(EventEmitter));

  var MSITransport = /** @class */ (function (_super) {
      __extends(MSITransport, _super);
      function MSITransport(options) {
          var _this = _super.call(this, options) || this;
          /**
           * @description: 直接调用桥
           * @param {*} opts 入参
           */
          _this.useBridge = function (name, opts) { var _a, _b; return (_b = (_a = _this.MSIBridge)[name]) === null || _b === void 0 ? void 0 : _b.call(_a, opts); };
          _this.MSIBridge = options.MSIBridge;
          return _this;
      }
      MSITransport.prototype.doSend = function (log) {
          var _this = this;
          var category = this.options.endpoint;
          var type = log.type, value = log.value, tags = log.tags;
          return new Promise(function (resolve, reject) {
              var _a, _b;
              (_b = (_a = _this.MSIBridge)['sendBabelLog']) === null || _b === void 0 ? void 0 : _b.call(_a, {
                  content: 'content',
                  category: category,
                  tag: type,
                  value: value,
                  options: tags,
                  success: function (res) {
                      logger.log('msi report result ', res);
                      resolve(true);
                  },
                  fail: function (err) {
                      reject(err);
                  },
              });
          });
      };
      return MSITransport;
  }(BaseTransport));

  var MtTracker = /** @class */ (function (_super) {
      __extends(MtTracker, _super);
      function MtTracker(options, cfgManager) {
          var _a;
          var _this = _super.call(this, options, cfgManager) || this;
          var MSIBridge = (_a = options === null || options === void 0 ? void 0 : options.bridge) === null || _a === void 0 ? void 0 : _a.MSI;
          var project = options.project, version = options.version, pagePath = options.pagePath, common = options.common, transportOption = options.transportOption, pluginOptions = __rest(options, ["project", "version", "pagePath", "common", "transportOption"]);
          var useMSI = IsSupportMsiContainer(MSIBridge);
          _this.metaData = new MtMetaData({ project: project, version: version, pagePath: pagePath, useMSI: useMSI }, _this);
          _this.config = new Config(common);
          if (useMSI) {
              // 使用msi桥
              var transport = new MSITransport(__assign(__assign({ endpoint: CATEGORY }, transportOption), { MSIBridge: MSIBridge }));
              var customTransport = new MSITransport({
                  endpoint: CUSTOM_CATEGORY,
                  MSIBridge: MSIBridge,
              });
              _this.queue = new MtQueue(transport, _this.config, _this.metaData);
              _this.custom_queue = new MtQueue(customTransport, _this.config, _this.metaData);
          }
          else {
              // 初始化服务端信息及 transport
              var transport = new MtTransport(__assign({ endpoint: CATEGORY }, transportOption));
              _this.queue = new MtQueue(transport, _this.config, _this.metaData);
              var customTransport = new MtTransport({
                  endpoint: CUSTOM_CATEGORY,
              });
              _this.custom_queue = new MtQueue(customTransport, _this.config, _this.metaData);
          }
          _this.initPlugins(pluginOptions);
          return _this;
      }
      MtTracker.prototype.initPlugins = function (pluginOptions) {
          var _this = this;
          MtTracker._pluginCtorMap.forEach(function (pluginCtor, pluginName) {
              var pluginOption = pluginOptions[pluginName];
              if (!(pluginOption === null || pluginOption === void 0 ? void 0 : pluginOption.disable)) {
                  var plugin = new pluginCtor(_this.queue, pluginOption);
                  if (!plugin.config.disable) {
                      _this.setPluginInsMap(pluginName, plugin);
                      plugin.init();
                      plugin.setEnv(ENV.CONTAINER);
                  }
              }
          });
      };
      MtTracker.use = function (pluginCtor) {
          if (this._pluginCtorMap.has(pluginCtor.id)) {
              logger.warn('插件已加载 不能重复加载');
              return;
          }
          this._pluginCtorMap.set(pluginCtor.id, pluginCtor);
      };
      MtTracker.id = 'MT_TRACKER';
      MtTracker._pluginCtorMap = new Map();
      return MtTracker;
  }(BaseTracker));

  /**
   * 根据环境返回对应的 Tracker 类
   * rollup 不能 tree-shaking TS class 故单独放在一个文件，避免容器内环境 SDK 引入多余代码
   */
  function getTrackerByEnv(MSI) {
      var isMsiContainer = IsSupportMsiContainer(MSI);
      var isTitansx = !!getTitansVersion();
      var isContainer = isMsiContainer || isTitansx;
      return isContainer ? MtTracker : WebTracker;
  }

  function perfStart$1(bridgeConfig) {
      var MSI = bridgeConfig === null || bridgeConfig === void 0 ? void 0 : bridgeConfig.MSI;
      var TrackerClass = getTrackerByEnv(MSI);
      /**
       * 完整包加载全部功能插件
       */
      TrackerClass.use(PluginFsp2);
      TrackerClass.use(PluginShr);
      TrackerClass.use(PluginIrd);
      // 容器外浏览器环境需要加载缓存插件
      if (TrackerClass === WebTracker) {
          TrackerClass.use(PluginCache);
      }
      var perf = entryGen(TrackerClass);
      handlePreInit(perf);
      return perf;
  }

  var entry = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': perfStart$1
  });

  var require$$7 = /*@__PURE__*/getAugmentedNamespace(entry);

  var require$$1 = /*@__PURE__*/getAugmentedNamespace(cookie);

  var Util$4 = require$$9;
  var getCookie = require$$1["default"];
  var dimns = {
    getExt: function getExt() {
      var ret = {};
      try {
        var network = getCookie('network');
        if (!network) {
          var ua = Util$4.getUserAgent();
          var reg = /NetType\/([a-zA-Z0-9]+)/;
          if (ua && reg.test(ua)) {
            network = ua.match(reg)[1];
          }
        }
        network = network || Util$4.getConnectionType();
        var unionId = getCookie('uuid') || getCookie('unionid') || getCookie('dpid') || getCookie('_lxsdk_cuid');
        if (network) ret.network = network;
        if (unionId) ret.unionId = unionId;
      } catch (e) {}
      return ret;
    }
  };

  var filter_config = {
    base: function base(model) {
      return !model.resourceUrl || /\.(dpfile|dianping|51ping|meituan|sankuai)\.(com|net)/.test(model.resourceUrl);
    },
    weixin: function weixin(model) {
      return !/(WeixinJSBridge|_WXJS|WebViewJavascriptBridge)/.test(model.sec_category);
    },
    dianping: function dianping(model) {
      return !/document.elementFromPoint/.test(model.sec_category);
    }
  };

  var filterMap = filter_config;
  var Util$3 = require$$9;
  var filter = function configFilter(cfgManager) {
    if (cfgManager.get('devMode')) return;
    cfgManager.addFilter('base', filterMap['base']);
    var UA = Util$3.getUserAgent();
    if (/MicroMessenger/.test(UA)) {
      cfgManager.addFilter('weixin', filterMap['weixin']);
    } else if (/dp\/com\.dianping/.test(UA)) {
      cfgManager.addFilter('dianping', filterMap['dianping']);
    }
  };

  // capture and report performance timing information of page loading process
  var _catch$2 = function capturePerfTiming(pageManager) {
    var cfgManager = pageManager.cfgManager;
    var catchPage = cfgManager.get('autoCatch').page;
    var pageConfig = cfgManager.get('page');
    if (catchPage && pageConfig.sensoryIndex) {
      pageManager.sensoryObserver();
    } else {
      try {
        // disconnect MutationObserver created in pre-catch module
        if (window._Owl_ && window._Owl_.observer && window._Owl_.observer.disconnect) {
          window._Owl_.observer.disconnect();
        }
      } catch (e) {}
    }
    if (catchPage && !pageManager.getReady()) {
      pageManager.setInitConfig();
      if (document && document.readyState === 'complete') {
        pageManager.parsePageTimeWithDefer();
      } else {
        var ADD_EVENT_FUNC = window.addEventListener || window.attachEvent;
        var loadName = window.addEventListener ? 'load' : 'onload';
        ADD_EVENT_FUNC(loadName, function () {
          pageManager.parsePageTimeWithDefer();
        });
      }
    }
  };

  // capture JS errors
  var _catch$1 = function _catch(errManager) {
    var captureCfg = errManager.cfgManager.get('autoCatch');
    if (captureCfg.js) {
      // global JS error
      var origin = window.onerror;
      window.onerror = function () {
        errManager.parseWindowError.apply(errManager, arguments);
        origin && origin.apply(window, arguments);
      };

      // unhandled promise rejection
      var ADD_EVENT = window.addEventListener || window.attachEvent;
      ADD_EVENT('unhandledrejection', function () {
        errManager.parsePromiseUnhandled.apply(errManager, arguments);
      });
    }

    // console.error
    if (captureCfg.console && window.console && window.console.error) {
      var consoleError = window.console.error;
      window.console.error = function () {
        errManager.parseConsoleError.apply(errManager, arguments);
        consoleError && consoleError.apply(window.console, arguments);
      };
    }
  };

  var Util$2 = require$$9;
  var Event$3 = event;
  var xhr = window.XMLHttpRequest;
  var ajax = function interceptAjax() {
    var enableLogTrace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var project = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var catchAbort = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var catchTimeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (!xhr || xhr._owl) return;
    xhr._owl = true;
    try {
      var _open = xhr.prototype.open;
      var _send = xhr.prototype.send;
      var origin = Util$2.getOrigin();
      xhr.prototype.open = function (method, url) {
        this._startTime = +new Date();
        this.method = method;
        this.url = url;
        _open && _open.apply(this, arguments);
        try {
          // setRequestHeader should be after xhr.open
          if (enableLogTrace && project && Util$2.checkSameOrigin(url, origin) && typeof this.setRequestHeader === 'function') {
            var id = Util$2.traceid();
            if (id) {
              this.setRequestHeader('M-TRACEID', id);
              this.setRequestHeader('M-APPKEY', "fe_".concat(project));
              this.traceid = id;
            }
          }
        } catch (e) {
          Util$2.reportSysError(e);
        }
      };
      xhr.prototype.send = function () {
        var _this = this,
          _arguments = arguments;
        var EVENT_LISTENER = 'addEventListener';
        var STATE_CHANGE = 'onreadystatechange';
        var _dispatchEvent = function _dispatchEvent(event) {
          if (!event || !event.currentTarget) return;
          if (/(catfront\.(dianping|51ping)\.com|\.dreport\.meituan\.net)/.test(_this.url)) {
            try {
              var response;
              if (_this.getAllResponseHeaders('content-type').indexOf('application/json') !== -1) {
                response = JSON.parse(event.currentTarget.response);
              }
              // callback of Owl report requests
              if (event.currentTarget.status === 200) {
                _this.success && _this.success(response);
              } else {
                _this.fail && _this.fail(event);
              }
            } catch (e) {}
          } else {
            event.duration = +new Date() - _this._startTime;
            Event$3.trigger('ajaxCall', event);
          }
        };
        if (EVENT_LISTENER in this) {
          this[EVENT_LISTENER]('load', _dispatchEvent);
          this[EVENT_LISTENER]('error', _dispatchEvent);
          catchAbort && this[EVENT_LISTENER]('abort', _dispatchEvent);
          catchTimeout && this[EVENT_LISTENER]('timeout', _dispatchEvent);
        } else {
          var _originStateChange = this[STATE_CHANGE];
          this[STATE_CHANGE] = function (event) {
            if (_this.readyState === 4) {
              _dispatchEvent(event);
            }
            _originStateChange && _originStateChange.apply(_this, _arguments);
          };
        }
        return _send && _send.apply(this, arguments);
      };
    } catch (e) {
      Util$2.reportSysError(e);
    }
  };

  var Event$2 = event;
  var Util$1 = require$$9;
  var fetch = function interceptFetch() {
    var enableLogTrace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var project = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    if (typeof window.fetch !== 'function' || window.fetch._owl) return;
    var _fetch = window.fetch;
    window.fetch = function (input) {
      var args = Array.prototype.slice.call(arguments, 0);
      var fetchUrl = (input && typeof input !== 'string' ? input.url : input) || '';
      var init = args[1] || {};
      var origin = Util$1.getOrigin();
      if (init.method === 'HEAD' || init.mode === 'no-cors') return _fetch.apply(window, args);
      var traceid;
      try {
        if (enableLogTrace && Util$1.checkSameOrigin(fetchUrl, origin) && project) {
          traceid = Util$1.traceid();
          init.headers = new Headers(init.headers);
          init.headers.append('M-TRACEID', traceid);
          init.headers.append('M-APPKEY', 'fe_' + project);
          args[1] = init;
        }
      } catch (e) {
        Util$1.reportSysError(e);
      }
      var startTime = +new Date();
      return _fetch && _fetch.apply(window, args).then(function (res) {
        try {
          if (!res || typeof res.clone !== 'function') return res;
          var copy = res.clone();
          var resHeaders = copy.headers;
          var xForbidReason = '';
          if (resHeaders && typeof resHeaders.get === 'function') {
            var contentType = resHeaders.get('content-type');
            if (contentType && !/(text)|(json)/.test(contentType)) return res;
            xForbidReason = resHeaders.get('x-forbid-reason') || '';
          }
          copy.text().then(function (response) {
            Event$2.trigger('fetchCall', {
              url: fetchUrl,
              duration: +new Date() - startTime,
              isSuccess: true,
              ok: copy.ok,
              response: response,
              statusCode: copy.status,
              statusText: copy.statusText,
              xForbidReason: xForbidReason,
              traceid: traceid
            });
          });
          return res;
        } catch (e) {
          Util$1.reportSysError(e);
          return res;
        }
      })["catch"](function (err) {
        Event$2.trigger('fetchCall', {
          url: fetchUrl,
          duration: +new Date() - startTime,
          isSuccess: false,
          errName: err.name,
          errMsg: err.stack || err.message,
          traceid: traceid
        });
        throw err;
      });
    };
    window.fetch._owl = true;
  };

  var Event$1 = event;
  var interceptAjax = ajax;
  var interceptFetch = fetch;

  // capture performance and errors of Ajax (xhr & fetch) and static resources
  var _catch = function _catch(resManager) {
    var cfgManager = resManager.cfgManager;
    var captureCfg = cfgManager.get('autoCatch');
    var enableLogTrace = cfgManager.get('enableLogTrace') || false;
    var project = cfgManager.get('project');
    var resCfg = cfgManager.get('resource');
    if (captureCfg.ajax) {
      // rewrite and monitor stage change of xhr instance
      interceptAjax(enableLogTrace, project, resCfg.catchAbort, resCfg.catchTimeout);
      Event$1.on('ajaxCall', function () {
        resManager.parseAjax.apply(resManager, arguments);
      });
    }
    if (captureCfg.fetch) {
      interceptFetch(enableLogTrace, project);
      Event$1.on('fetchCall', function () {
        resManager.parseFetch.apply(resManager, arguments);
      });
    }
    if (captureCfg.resource) {
      var EVENT_LISTEN_FUNC = window.addEventListener || window.attachEvent;
      var loadName = window.addEventListener ? 'load' : 'onload';
      var errName = window.addEventListener ? 'error' : 'onerror';
      // get all static resources after page load
      if (document && document.readyState === 'complete') {
        resManager.handleResourceTiming.apply(resManager);
      } else {
        EVENT_LISTEN_FUNC(loadName, function () {
          resManager.handleResourceTiming.apply(resManager);
        });
      }

      // capture static resources load error
      EVENT_LISTEN_FUNC(errName, function (event) {
        if (event) {
          resManager.handleResourceLoadError.apply(resManager, arguments);
        }
      }, true);
    }
  };

  /**
   * @description: 上报sdk指标，包括sdkPV和sdkCDNTiming
   * @param {*} instance
   * @param {*} config
   * @return {*}
   */
  var SDKMetrics = function (instance, config) {
      try {
          var metricManager = instance.metricManager;
          var tags = {
              project: config.userProject || '',
              version: config.version || '',
          };
          if (typeof config.tags === 'object') {
              tags = __assign(__assign({}, tags), config.tags);
          }
          metricManager.setTags(tags);
          metricManager.setExtraData(config.version || '');
          var random = Math.random();
          // 判断是否自动上报页面访问量
          var pvConf = __assign({ auto: true, sample: 0.01 }, config.pv);
          if (pvConf.auto && random < pvConf.sample) {
              metricManager.setMetric('sdkPV', 1);
          }
          // 判断是否自动上报资源获取时间
          var resConf = __assign({ auto: true, sample: 0.01 }, config.resource);
          if (config.url && resConf.auto && random < resConf.sample) {
              var duration = void 0;
              var info = getResTimingInfo(config.url);
              if (info instanceof Array) {
                  for (var i = 0; i < info.length; i++) {
                      if (info[i] && typeof info[i].duration !== 'undefined') {
                          duration = info[i].duration;
                          break;
                      }
                  }
              }
              else if (info && typeof info.duration !== 'undefined') {
                  duration = info.duration;
              }
              if (!isNaN(duration))
                  metricManager.setMetric('sdkCDNTiming', duration);
          }
          metricManager.report();
      }
      catch (e) {
          reportSysError$1(e);
      }
  };
  /**
   * @description: owlSDKMetrics函数用于上报owl SDK的指标
   * @param {object} config - 配置对象，包含项目信息和版本号等
   * @param {object} owl - owl实例，用于创建owl SDK实例
   * @param {object} ErrManager - 错误管理器，用于注入owl实例
   * @return {*}
   */
  var owlSDKMetrics = function (config, owl, ErrManager) {
      try {
          // 创建owl SDK实例
          var instance = owl.createInstance({
              project: config.project,
              devMode: config.devMode,
              pageUrl: "v_".concat(config.version),
              webVersion: config.version,
              setCustomTags: function () { return ({
                  project: config.userProject || '',
                  version: config.version || '',
              }); },
          });
          // 将owl实例注入到错误管理器中
          ErrManager.setSysInstance(instance); // 注入实例
          // 获取自定义标签
          var ctags = instance.cfgManager.getCustomTags();
          // 上报一次页面访问量
          instance.reportPv({ ctags: ctags });
          // 调用SDKMetrics函数上报其他指标
          SDKMetrics(instance, config);
      }
      catch (e) {
          reportSysError$1(e);
      }
  };
  /**
   * @description: 获取指定资源的加载时间信息
   * @param {string | string[] | RegExp} url - 资源的 URL 或 URL 数组或正则表达式
   * @return {Object | Object[] | null} - 返回资源加载时间信息对象或对象数组，如果获取失败则返回 null
   */
  var getResTimingInfo = function (url) {
      if (!(window.performance
          && typeof window.performance.getEntriesByName === 'function'))
          return null;
      if (typeof url === 'string' || url instanceof RegExp) {
          var entries = window.performance.getEntriesByType('resource');
          var matchedEntry = entries.find(function (entry) {
              if (url instanceof RegExp)
                  return url.test(entry.name);
              return entry.name === url;
          });
          if (matchedEntry) {
              var duration = Math.round(matchedEntry.duration);
              return isNaN(duration)
                  ? null
                  : { name: matchedEntry.name, duration: duration };
          }
      }
      else if (url instanceof Array) {
          var result = [];
          for (var i = 0; i < url.length; i++) {
              if (typeof url[i] === 'string') {
                  var info = getResTimingInfo(url[i]);
                  result.push(info ? info : null);
              }
              else {
                  result.push(null);
              }
          }
          return result;
      }
      return null;
  };

  var sdkMetricsUtils$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    SDKMetrics: SDKMetrics,
    owlSDKMetrics: owlSDKMetrics,
    getResTimingInfo: getResTimingInfo
  });

  var require$$22 = /*@__PURE__*/getAugmentedNamespace(sdkMetricsUtils$1);

  var HORN_KEY = 'raptor-web-sdk'; // horn key
  var KEY_USE_MSI$1 = 'useMSI'; // use msi report in mt app

  var _const = /*#__PURE__*/Object.freeze({
    __proto__: null,
    HORN_KEY: HORN_KEY,
    KEY_USE_MSI: KEY_USE_MSI$1
  });

  var require$$23 = /*@__PURE__*/getAugmentedNamespace(_const);

  var t=function(){function t(t,n){this.hornKey="",this.needUpdate=!1,this.config=null,this.domainPrefix="https://portal-portm.meituan.com/horn?",this.storage=t,this.request=n;}return t.prototype.init=function(t){var n=t.key,e=t.domain;this.hornKey=n,e&&(this.domainPrefix="".concat(e,"/horn?"));try{var r=this.storage.get(this.getFullKey());if(!r)return void this.resetConfig();var o=r.exp,i=r.data;this.config=i,o<Date.now()&&(this.needUpdate=!0);}catch(t){this.resetConfig();}},t.prototype.getConfigSync=function(t){return t?"object"==typeof this.config&&null!==this.config?this.config[t]:null:this.config},t.prototype.freshConfig=function(t,n){var e=this;void 0===n&&(n=!1),this.hornKey&&this.needUpdate&&this.request(this.buildUrl(t,n),"GET").then((function(t){try{var n=e.buildStorageData(t);e.storage.set(e.getFullKey(),n);}catch(t){}})).catch((function(){}));},t.prototype.resetConfig=function(){this.needUpdate=!0,this.config=null;},t.prototype.buildStorageData=function(t){var n=t.horn,e=t.customer;return {exp:Date.now()+6e4*n.cacheDuration,data:e}},t.prototype.buildUrl=function(t,n){for(var e=function(t){return encodeURIComponent(t).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")},r=Object.assign({},t,{from:this.hornKey,version:"v1",os:n?"android_test":"android"}),o=[],i=0,a=Object.keys(r);i<a.length;i++){var s=a[i],c=r[s];o.push(e(s)+"="+e(c));}return this.domainPrefix+o.join("&")},t.prototype.getFullKey=function(){return "_sdkHorn_".concat(this.hornKey)},t}(),n={get:function(t){try{var n=localStorage.getItem(t);if(n)return JSON.parse(n)}catch(t){}return null},set:function(t,n){try{localStorage.setItem(t,JSON.stringify(n));}catch(t){}}};function e(t,n){return new Promise((function(e,r){var o=new XMLHttpRequest;o.open(n,t),o.onload=function(){if(o.status>=200&&o.status<400)try{var t=JSON.parse(o.responseText);e(t);}catch(t){r(t);}else r(new Error(String(o.status)));},o.onerror=function(){return r(new Error("error"))},o.onabort=function(){return r(new Error("aborted"))},o.ontimeout=function(){return r(new Error("timeout"))},o.send();}))}var r=function(){function r(r){if(this._map=new Map,!(null==r?void 0:r.key))throw new Error("key必传");this.hornManager=new t(n,e),this.hornManager.init(r);}return r.prototype.set=function(t,n){return this._map.set(t,n)},r.prototype.isOpen=function(t){return this.has(t)?this._map.get(t):(console.warn("开关 ".concat(t," 还未被设置!")),null)},r.prototype.has=function(t){return this._map.has(t)},r.prototype.freshConfig=function(t,n){return void 0===n&&(n=!1),this.hornManager.freshConfig(t,n)},r.prototype.getConfigSync=function(t){return this.hornManager.getConfigSync(t)},r}();var HornSwitcher = r;

  // get horn config
  var hornSwitcher$1 = new HornSwitcher({
      key: HORN_KEY,
  });

  var switcher = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': hornSwitcher$1
  });

  var require$$24 = /*@__PURE__*/getAugmentedNamespace(switcher);

  var CfgManager = config;
  var ErrManager = manager$2;
  var PageManager = page;
  var ResManager = manager$1;
  var MetricManager = metric;
  var PvManager = pv;
  var LogManager = manager;
  var perfStart = require$$7["default"];
  var Dimns = dimns;
  var Util = require$$9;
  var util = util$4;
  var configFilter = filter;
  var Logger = require$$12["default"];
  var guid = pageid;
  var Logan = logan;
  var Event = event;
  var category = category$1;
  var version = require$$17.version;
  var EM = model$1;
  var catchPage = _catch$2;
  var catchError = _catch$1;
  var catchResource = _catch;
  var sdkMetricsUtils = require$$22;
  var KEY_USE_MSI = require$$23.KEY_USE_MSI;
  var hornSwitcher = require$$24["default"];
  var extend = extend$5;
  var OWL = /*#__PURE__*/function () {
    function OWL(config, opts) {
      _classCallCheck(this, OWL);
      var cfgManager = new CfgManager(config);
      this.errManager = new ErrManager(cfgManager);
      this.pageManager = new PageManager(cfgManager, this.errManager);
      this.resManager = new ResManager(cfgManager, this.errManager);
      this.metricManager = new MetricManager(cfgManager);
      this.pvManager = new PvManager(cfgManager);
      this.logManager = new LogManager(cfgManager);
      this.cfgManager = cfgManager;
      this.cfgManager.setExtension(Dimns.getExt());

      // 待配置 devMode 后再做 configFilter
      if (!(opts && opts.noFilter)) {
        configFilter(this.cfgManager);
      }
    }
    _createClass(OWL, [{
      key: "config",
      value: function config(_config) {
        this.cfgManager.set(_config);
      }
    }, {
      key: "getConfig",
      value: function getConfig(key) {
        return this.cfgManager.get(key);
      }
    }, {
      key: "debug",
      value: function debug() {
        this.cfgManager.set({
          devMode: true,
          perf: {
            common: {
              dev: true
            }
          }
        });
        /* Logger.setDebug()
           Logger.setDebug() */
      }
      /**
       *  上报自定义异常
       *  @param {any} err - 异常信息
       *  @param {Object} opts
       *  @param {Boolean} opts.combo - 是否合并请求
       *  @param {string} opts.category - 异常分类
       *  @param {string} opts.level - 异常级别
       *  @param {Object} opts.tags - 其他自定义信息
       */
    }, {
      key: "addError",
      value: function addError(err, opts) {
        // 基于不同的参数条件，使用不同的方法
        var name = opts && opts.combo || this.getConfig('error').combo ? 'push' : 'report';
        this.errManager[name](err, opts);
      }
    }, {
      key: "sendErrors",
      value: function sendErrors() {
        this.errManager.report();
      }
      /**
       *  上报自定义性能指标
       *  @param {Object} point - 性能指标信息
       *  @param {Number} point.position - 指标点位置
       *  @param {Number} point.duration - 耗时
       *  @param {Number} point.timeStamp - 时间戳
       */
    }, {
      key: "addPoint",
      value: function addPoint(point) {
        if (!point || point.position === undefined) return;
        var newPoint;
        if (point.duration !== undefined) {
          newPoint = point;
        } else {
          var timing = Util.getPerfTiming();
          var navStart = timing && timing.navigationStart;
          if (typeof navStart === 'number') {
            newPoint = {
              position: point.position,
              duration: (point.timeStamp || +new Date()) - navStart
            };
          }
        }
        if (newPoint) {
          newPoint.ctags = util.isFlatObj(point.ctags) ? point.ctags : this.cfgManager.getCustomTags();
          this.pageManager.setUserReady();
          this.pageManager.push(newPoint);
        }
      }
    }, {
      key: "sendPoints",
      value: function sendPoints() {
        this.pageManager.report(true);
      }
      /**
       *  上报自定义请求信息
       *  @param {Object} api - 请求信息
       *  @param {string} api.name - 请求名称
       *  @param {Number} api.networkCode - 网络状态码
       *  @param {Number} api.statusCode - 业务状态码
       *  @param {Number} api.responseTime - 请求耗时
       *  @param {string} [api.content] - 异常堆栈
       */
    }, {
      key: "addApi",
      value: function addApi(api) {
        var validTypes = ['undefined', 'number'];
        if (!api || validTypes.indexOf(_typeof(api.networkCode)) < 0 || validTypes.indexOf(_typeof(api.statusCode)) < 0) return Logger.log('参数对象属性类型错误');
        var networkCode = api.networkCode !== undefined ? api.networkCode : '';
        var statusCode = api.statusCode !== undefined ? api.statusCode : '';
        var newApi = {
          type: 'api',
          connectType: api.connectType || '',
          resourceUrl: api.name,
          statusCode: "".concat(networkCode, "|").concat(statusCode),
          responsetime: api.responseTime && api.responseTime.toString() || '0',
          ctags: util.isFlatObj(api.ctags) ? api.ctags : this.cfgManager.getCustomTags()
        };
        if (api.content) {
          newApi.firstCategory = category.AJAX;
          newApi.secondCategory = api.secondCategory || api.name;
          newApi.logContent = api.content;
        }
        this.resManager.pushApi(newApi);
      }
    }, {
      key: "reportApi",
      value: function reportApi() {
        this.addApi.apply(this, arguments);
      }
    }, {
      key: "sendApis",
      value: function sendApis() {
        this.resManager.report();
      }
      // 记录Logan日志
    }, {
      key: "addLog",
      value: function addLog() {
        Logan._log.apply(Logan, arguments);
      }
    }, {
      key: "createLog",
      value: function createLog() {
        return new LogManager(this.cfgManager);
      }
      // 重置参数并重新上报pv
    }, {
      key: "resetPv",
      value: function resetPv(opts) {
        var _this = this;
        opts = opts || {};
        var cfgManager = this.cfgManager;
        var from = cfgManager.get('pageUrl');
        var to = opts.pageUrl || Util.getPageUrl();
        // if (!to || to === from) return
        var project = opts.project || cfgManager.get('project');
        var configs = {
          project: project,
          pageUrl: to,
          pageId: opts.pageId || 'owl-' + guid(),
          ctags: util.isFlatObj(opts.ctags) ? opts.ctags : cfgManager.getCustomTags()
        };
        cfgManager.set(configs);
        if (opts.delay) {
          // 连续快速resetPv时，只上报一次
          this.resetPvTimer && clearTimeout(this.resetPvTimer);
          this.resetPvTimer = setTimeout(function () {
            _this.pvManager.report(configs);
            Logan._log("[Navigation]:".concat(JSON.stringify({
              project: project,
              from: from,
              to: to
            })), 'owl', 'info', ['navi']);
          }, 200);
        } else {
          this.pvManager.report(configs);
          Logan._log("[Navigation]:".concat(JSON.stringify({
            project: project,
            from: from,
            to: to
          })), 'owl', 'info', ['navi']);
        }
      }
    }, {
      key: "reportPv",
      value: function reportPv(opts) {
        this.pvManager.report(opts);
      }
      // 创建新的自定义指标实例
    }, {
      key: "newMetricInst",
      value: function newMetricInst() {
        return new MetricManager(this.cfgManager);
      }
      // 新增, 更新, 移除异常过滤方法
    }, {
      key: "updateFilter",
      value: function updateFilter(key, fn) {
        if (fn) {
          this.cfgManager.addFilter(key, fn);
        } else {
          this.cfgManager.removeFilter(key);
        }
      }
    }, {
      key: "removeFilter",
      value: function removeFilter(key) {
        this.cfgManager.removeFilter(key);
      }
      /**
       * 为函数提供try-catch封装, 避免异常被抛出的同时上报异常
       *
       * @param {Function} func - 需封装的函数
       * @param {Object} context - 函数执行的上下文
       * @param {Object} opts - 等同于addError的opts
       */
    }, {
      key: "wrap",
      value: function wrap(func, context, opts) {
        if (typeof func !== 'function') return func;
        try {
          if (func.__owl_wrapped__) return func;
          if (func.__owl_wrapper__) return func.__owl_wrapper__;
        } catch (e) {
          return func;
        }
        var wrapped = function wrapped() {
          try {
            return func.apply(context, arguments);
          } catch (e) {
            Owl.addError(e, opts);
          }
        };
        for (var property in func) {
          if (func.prototype.hasOwnProperty(property)) {
            wrapped[property] = func[property];
          }
        }
        wrapped.prototype = func.prototype;
        func.__owl_wrapper__ = wrapped;
        wrapped.__owl_wrapped__ = true; // 标记

        return wrapped;
      }
      /* 设置维度信息,支持:region,operator,network,container,os,unionId,latlng
         latlng用于设置位置信息,值为:'${lat},${lng}'格式,如:'121.426805,31.221485' */
    }, {
      key: "setDimension",
      value: function setDimension(obj) {
        this.cfgManager.setExtension(obj);
      }
    }, {
      key: "getDimension",
      value: function getDimension(key) {
        this.cfgManager.getExtension(key);
      }
    }, {
      key: "reportFST",
      value: function reportFST() {
        var pageCfg = this.cfgManager.get('page');
        if (pageCfg.sensoryIndex || pageCfg.manualReportFST) return;
        this.cfgManager.set({
          page: {
            manualReportFST: true
          }
        });
        this.pageManager.manualReportFST();
      }
    }, {
      key: "createInstance",
      value: function createInstance(config) {
        var instance = null;
        try {
          if (window.Owl && window.Owl.OWL && config && config.project) {
            if (typeof config.devMode === 'undefined') {
              config.devMode = window.Owl.cfgManager.get('devMode');
            }
            instance = new window.Owl.OWL(config);
          }
        } catch (e) {
          Util.reportSysError(e);
        }
        return instance;
      }

      /**
       * @description: 该方法会被其他sdk调用(eg. logan-web)，不能删除
       * @param {*} config
       * @return {*}
       */
    }, {
      key: "SDKMetrics",
      value: function SDKMetrics(config) {
        try {
          if (!(config && config.project)) return; // sdk指标没有目标project时，不创建

          var instance = this.createInstance({
            project: config.project,
            devMode: config.devMode,
            metric: {
              combo: false
            }
          });
          sdkMetricsUtils.SDKMetrics(instance, config);
        } catch (e) {
          Util.reportSysError(e);
        }
      }
      /**
       * perf 上报兼容方法：对上报到 Perf 的数据，进行全局自定义 tag 的设置
       * @param {object} tags
       */
    }, {
      key: "setTag",
      value: function setTag(tags) {
        try {
          if (this.cfgManager.isEnablePerf()) {
            this.perfManager('setTag', tags);
          }
        } catch (e) {
          Util.reportSysError(e);
        }
      }
      /**
       * perf 上报兼容方法：上报自定义指标到 Perf，使用Perf 新版上报通道
       * @param {string} type
       * @param {number|string} value
       * @param {object} tags
       */
    }, {
      key: "addCustomMetrics",
      value: function addCustomMetrics(type, value, tags) {
        try {
          if (this.cfgManager.isEnablePerf()) {
            this.perfManager('addCustomMetrics', type, value, tags);
          }
        } catch (e) {
          Util.reportSysError(e);
        }
      }
      /**
       * perf 上报兼容方法：上报自定义指标到 Perf，使用Perf 旧版上报通道
       * @param {string} type
       * @param {number|string} value
       * @param {object} tags
       */
    }, {
      key: "reportPerformance",
      value: function reportPerformance(type, value, tags) {
        try {
          if (this.cfgManager.isEnablePerf()) {
            this.perfManager('reportPerformance', type, value, tags);
          }
        } catch (e) {
          Util.reportSysError(e);
        }
      }
    }]);
    return OWL;
  }();
  var Owl = new OWL({}, {
    noFilter: true
  });
  Owl.OWL = OWL;
  Owl.__version__ = version;
  Owl.errorModel = EM;
  Owl.MetricManager = function () {
    var cfgManager = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Owl.cfgManager;
    return new MetricManager(cfgManager);
  };
  var handleApiCall = function handleApiCall(args) {
    try {
      if (args && args.length) {
        var name = args[0]; // api name
        if (!name || typeof name != 'string') return Logger.warn('Api名称不是有效字符串');
        if (name == 'start') return Logger.warn('start方法不可重复执行');
        if (typeof Owl[name] != 'function') return Logger.warn("".concat(name, "\u4E0D\u662F\u6709\u6548\u7684Api"));
        try {
          var params = args.slice(1); // api params
          return Owl[name].apply(Owl, params);
        } catch (e) {
          Logger.warn("".concat(name, " Api\u6267\u884C\u62A5\u9519"));
          Logger.warn(e);
          Util.reportSysWarn(e);
        }
      } else {
        Logger.warn('Api调用未传入有效参数');
      }
    } catch (e) {
      Util.reportSysWarn(e);
    }
  };
  Owl.start = function (configs) {
    var _configs = configs,
      devMode = _configs.devMode,
      perf = _configs.perf;
    var isPerfDevMode = perf && perf.common && perf.common.dev;
    if (devMode || isPerfDevMode) {
      this.debug();
    }
    if (Util.checkIsSpider()) return;
    if (window.Owl && window.Owl.isStarted) return;
    this.isStarted = true;
    var cfgManager = this.cfgManager;
    configs = configs || {};
    configs.pageUrl = configs.pageUrl || Util.getPageUrl();
    cfgManager.set(configs);
    var project = cfgManager.get('project');

    // 初始化horn开关配置
    hornSwitcher.freshConfig({
      id: cfgManager.getExtension('unionId'),
      project: project,
      sdkVersion: version,
      appVersion: cfgManager.get('webVersion')
    });
    var value = hornSwitcher.getConfigSync(KEY_USE_MSI);
    hornSwitcher.set(KEY_USE_MSI, value !== null && value !== void 0 ? value : false); // default be false

    // capture Owl self metrics
    sdkMetricsUtils.owlSDKMetrics({
      project: 'owl',
      userProject: project,
      version: version,
      devMode: devMode,
      url: /owl(?:_[\d.]+)?(?:\.min)?\.js/
    }, this, ErrManager);
    var loganCfg = cfgManager.get('logan');
    if (loganCfg && loganCfg.enable) {
      Logan.ready({
        LoganAPI: loganCfg.Logan,
        project: project,
        pageUrl: cfgManager.get('pageUrl'),
        loganConfig: loganCfg.config,
        version: loganCfg.version || '2.1.2'
      });
    }

    // perf 开启后的处理
    initPerf(this);

    // 不同环境下设定特定过滤规则
    configFilter(cfgManager);

    // auto capture performance, error & resource
    catchPage(this.pageManager);
    catchError(this.errManager);
    catchResource(this.resManager);
    var captureCfg = cfgManager.get('autoCatch') || {};
    if (captureCfg.pv) {
      var ctags = cfgManager.getCustomTags();
      this.reportPv({
        ctags: ctags
      }); // 自动上报一次pv
    }
    var spaCfg = cfgManager.get('SPA') || {};
    if (spaCfg.autoPV || spaCfg.getFST) {
      // 自动监听路由变化
      if (spaCfg.history) {
        Util.hackHistoryStateFunc('pushState');
        Util.hackHistoryStateFunc('replaceState');
      }
      if (spaCfg.hash) {
        Util.hackHashStateFunc();
      }

      // 路由变化的回调
      var that = this;
      Event.on('validStateChange', function (pathInfo) {
        try {
          if (spaCfg.autoPV) {
            var _ctags = cfgManager.getCustomTags();
            that.resetPv({
              delay: true,
              ctags: _ctags
            });
          }

          // 页面加载完成后再进行路由页面的首屏监听计算以提升准确性
          if (spaCfg.getFST && document.readyState == 'complete') {
            var path = pathInfo.path;
            var prevPath = that.prevRoutePath;
            that.prevRoutePath = path;
            that.pageManager.getRouteFst(path, prevPath);
          }
        } catch (e) {
          Util.reportSysWarn(e);
        }
      });
    }
    var queue = window.owl && window.owl.q;
    if (queue && queue.length) {
      for (var i = 0; i < queue.length; i++) {
        handleApiCall(queue[i]);
      }
    }
    window.owl = function () {
      var args = [].slice.call(arguments);
      return handleApiCall(args);
    };
    var preLoadName = '_Owl_';
    if (window[preLoadName]) {
      window[preLoadName].isReady = true;
      var _window$preLoadName = window[preLoadName],
        preTasks = _window$preLoadName.preTasks,
        dataSet = _window$preLoadName.dataSet;
      if (preTasks && preTasks.length) {
        // sync execute api tasks
        preTasks.forEach(function (task) {
          try {
            Owl[task.api] && Owl[task.api].apply(Owl, task.data);
          } catch (e) {
            Util.reportSysError(e);
          }
        });
        window[preLoadName].preTasks = [];
      }
      setTimeout(function () {
        // async report pre-catch data
        if (dataSet && dataSet.length) {
          dataSet.forEach(function (item) {
            try {
              if (item.type === 'jsError' && captureCfg.js) {
                var name = item.data && item.data[0].type === 'unhandledrejection' ? 'parsePromiseUnhandled' : 'parseWindowError';
                Owl.errManager[name].apply(Owl.errManager, item.data);
              } else if (item.type === 'resError' && captureCfg.resource) {
                Owl.resManager.handleResourceLoadError.apply(Owl.resManager, item.data);
              } else if (item.type === 'resTime') {
                Owl.resManager.handleResourceTiming.apply(Owl.resManager, item.data);
              } else if (item.type === 'pageTime') {
                Owl.pageManager.parsePageTime.apply(Owl.pageManager, item.data);
              }
            } catch (e) {
              Util.reportSysError(e);
            }
          });
        }
        window[preLoadName].dataSet = [];
      }, 0);
    }
    this.errManager.checkCache();
  };
  if (!(window.Owl instanceof OWL)) {
    window.Owl = Owl;
  }

  // 首先执行start方法，在start方法内处理其他的API调用
  var queue = window.owl && window.owl.q;
  if (queue && queue.length) {
    var item = queue[0];
    if (item && item[0] === 'start') {
      Owl.start(item[1]);
    }
  }

  /**
   * 初始化 Perf 相关逻辑
   * @param {*} Owl
   */
  function initPerf(Owl) {
    try {
      if (Owl.cfgManager.isEnablePerf()) {
        Logger.log(' 开始初始化 Perf 相关功能');
        var cfgManager = Owl.cfgManager;
        var perfConfig = cfgManager.get('perf');
        if (hornSwitcher.isOpen(KEY_USE_MSI)) {
          var bridgeConfig = cfgManager.get('bridge');
          Owl.perfManager = perfStart(bridgeConfig);
          Owl.perfManager('init', extend(perfConfig, {
            bridge: bridgeConfig
          }), cfgManager);
        } else {
          Owl.perfManager = perfStart();
          Owl.perfManager('init', perfConfig, cfgManager);
        }
      } else {
        Logger.log('Perf 未初始化，因为未使用');
      }
    } catch (e) {
      Util.reportSysError(e);
    }
  }
  var es6 = Owl;
  var index = /*@__PURE__*/getDefaultExportFromCjs(es6);

  return index;

}));
//# sourceMappingURL=owl_1.13.5.js.map
