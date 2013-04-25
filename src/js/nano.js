/**!
 * NanoDB
 * Cross-Platforms Local Database Library
 *
 * Copyright 2012 - 2013
 *
 * Gatekeeper:
 *   Will Wen Gunn (Koicos)
 *   Wiky Chen (Alibaba)
 *
 * Browsers Support:
 *   IE 8/9/10
 *   Chrome
 *   Firefox
 *   Safari
 *   Opera
 *   the modern browsers
 *
 * MIT Licensed
 * 
 */
(function(name, def) {
  var hasDefine  = 'undefined' !== typeof define;
  var hasExports = 'undefined' !== typeof exports;

  if (hasDefine) {
    // CommonJS: SeaJS, RequireJS etc.
    define(def);
  } else if (hasExports) {
    // Node.js Module
    exports = def(require, exports, module);
  } else {
    // Normal
    this[name] = def();
  }
})('nano', function(require, exports, module) {
  'use strict';

  var nano = ('undefined' !== typeof exports ? exports : {});

  var jP = JSON.parse;
  var jS = JSON.stringify;


  // Util
  var utils = {
    noop: function() {
      return false;
    },
    inherits: function (ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    },
    extend: function() {
      var target = arguments[0];

      var objs = [].slice.apply(arguments).slice(1);

      for (var i = 0, l = objs.length; i < l; i++) {
        for (var key in objs[i]) {
          target[key] = objs[i][key];
        }
      }

      return target;
    }
  };
  if (Object.create === undefined) {
    Object.create = function(o) {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }

  // EventEmitter(without `domain` module) From Node.js
  function EventEmitter() {
    this._events = this._events || {};
    this._maxListeners = this._maxListeners || defaultMaxListeners;
  }

  var defaultMaxListeners = 10;
  EventEmitter.prototype.setMaxListeners = function(n) {
    if (typeof n !== 'number' || n < 0)
      throw TypeError('n must be a positive number');
    this._maxListeners = n;
  };

  EventEmitter.prototype.emit = function(type) {
    var er, handler, len, args, i, listeners;

    if (!this._events)
      this._events = {};

    // If there is no 'error' event listener then throw.
    if (type === 'error') {
      if (!this._events.error ||
          (typeof this._events.error === 'object' &&
           !this._events.error.length)) {
        er = arguments[1];
        if (this.domain) {
          if (!er) er = new TypeError('Uncaught, unspecified "error" event.');
        } else if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          throw TypeError('Uncaught, unspecified "error" event.');
        }
        return false;
      }
    }

    handler = this._events[type];

    if (typeof handler === 'undefined')
      return false;

    if (typeof handler === 'function') {
      switch (arguments.length) {
        // fast cases
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        // slower
        default:
          len = arguments.length;
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          handler.apply(this, args);
      }
    } else if (typeof handler === 'object') {
      len = arguments.length;
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];

      listeners = handler.slice();
      len = listeners.length;
      for (i = 0; i < len; i++)
        listeners[i].apply(this, args);
    }

    return true;
  };

  EventEmitter.prototype.addListener = function(type, listener) {
    var m;

    if (typeof listener !== 'function')
      throw TypeError('listener must be a function');

    if (!this._events)
      this._events = {};

    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (this._events.newListener)
      this.emit('newListener', type, typeof listener.listener === 'function' ?
                listener.listener : listener);

    if (!this._events[type])
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    else if (typeof this._events[type] === 'object')
      // If we've already got an array, just append.
      this._events[type].push(listener);
    else
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];

    // Check for listener leak
    if (typeof this._events[type] === 'object' && !this._events[type].warned) {
      m = this._maxListeners;
      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    return this;
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.once = function(type, listener) {
    if (typeof listener !== 'function')
      throw TypeError('listener must be a function');

    function g() {
      this.removeListener(type, g);
      listener.apply(this, arguments);
    }

    g.listener = listener;
    this.on(type, g);

    return this;
  };

  // emits a 'removeListener' event iff the listener was removed
  EventEmitter.prototype.removeListener = function(type, listener) {
    var list, position, length, i;

    if (typeof listener !== 'function')
      throw TypeError('listener must be a function');

    if (!this._events || !this._events[type])
      return this;

    list = this._events[type];
    length = list.length;
    position = -1;

    if (list === listener ||
        (typeof list.listener === 'function' && list.listener === listener)) {
      this._events[type] = undefined;
      if (this._events.removeListener)
        this.emit('removeListener', type, listener);

    } else if (typeof list === 'object') {
      for (i = length; i-- > 0;) {
        if (list[i] === listener ||
            (list[i].listener && list[i].listener === listener)) {
          position = i;
          break;
        }
      }

      if (position < 0)
        return this;

      if (list.length === 1) {
        list.length = 0;
        this._events[type] = undefined;
      } else {
        list.splice(position, 1);
      }

      if (this._events.removeListener)
        this.emit('removeListener', type, listener);
    }

    return this;
  };

  EventEmitter.prototype.removeAllListeners = function(type) {
    var key, listeners;

    if (!this._events)
      return this;

    // not listening for removeListener, no need to emit
    if (!this._events.removeListener) {
      if (arguments.length === 0)
        this._events = {};
      else if (this._events[type])
        this._events[type] = undefined;
      return this;
    }

    // emit removeListener for all listeners on all events
    if (arguments.length === 0) {
      for (key in this._events) {
        if (key === 'removeListener') continue;
        this.removeAllListeners(key);
      }
      this.removeAllListeners('removeListener');
      this._events = {};
      return this;
    }

    listeners = this._events[type];

    if (typeof listeners === 'function') {
      this.removeListener(type, listeners);
    } else {
      // LIFO order
      while (listeners.length)
        this.removeListener(type, listeners[listeners.length - 1]);
    }
    this._events[type] = undefined;

    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    var ret;
    if (!this._events || !this._events[type])
      ret = [];
    else if (typeof this._events[type] === 'function')
      ret = [this._events[type]];
    else
      ret = this._events[type].slice();
    return ret;
  };

  EventEmitter.listenerCount = function(emitter, type) {
    var ret;
    if (!emitter._events || !emitter._events[type])
      ret = 0;
    else if (typeof emitter._events[type] === 'function')
      ret = 1;
    else
      ret = emitter._events[type].length;
    return ret;
  };

  if ('undefined' !== typeof window && 'undefined' !== typeof document) {
    var addEvent = (function(){if(document.addEventListener){return function(el,type,fn){if(el&&el.nodeName||el===window){el.addEventListener(type,fn,false)}else if(el&&el.length){for(var i=0;i<el.length;i++){addEvent(el[i],type,fn)}}}}else{return function(el,type,fn){if(el&&el.nodeName||el===window){el.attachEvent('on'+type,function(){return fn.call(el,window.event)})}else if(el&&el.length){for(var i=0;i<el.length;i++){addEvent(el[i],type,fn)}}}}})();
  }

  var lS = ('undefined' !== typeof localStorage ? localStorage : null);
  var sS = ('undefined' !== typeof sessionStorage ? sessionStorage : null);
  var cP = escape;
  var uCP = unescape;

  // Navite Store Interface
  function memStore () {}
  memStore.prototype.get = function(key) {
    if (sS) {
      return sS.getItem(key);
    } else {
      return false;
    }
  };
  memStore.prototype.set = function(key, value) {
    if (sS) {
      return sS.setItem(key, value);
    } else {
      return false;
    }
  };
  memStore.prototype.remove = function(key) {
    if (sS) {
      return sS.removeItem(key);
    } else {
      return false;
    }
  };

  function localStore () {}
  localStore.prototype.get = function(key) {
    if (lS) {
      return lS.getItem(key);
    } else {
      return false;
    }
  };
  localStore.prototype.set = function(key, value) {
    if (lS) {
      return lS.setItem(key, value);
    } else {
      return false;
    }
  };
  localStore.prototype.remove = function(key) {
    if (lS) {
      return lS.removeItem(key);
    } else {
      return false;
    }
  };
  var base64 = {
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    btoa : function (input) {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;

      input = base64._utf8_encode(input);

      while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }

        output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

      }

      return output;
    },

    atob : function (input) {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

      while (i < input.length) {

        enc1 = this._keyStr.indexOf(input.charAt(i++));
        enc2 = this._keyStr.indexOf(input.charAt(i++));
        enc3 = this._keyStr.indexOf(input.charAt(i++));
        enc4 = this._keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
          output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
          output = output + String.fromCharCode(chr3);
        }

      }

      output = base64._utf8_decode(output);

      return output;

    },

    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
      string = string.replace(/\r\n/g,"\n");
      var utftext = "";

      for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }

      }

      return utftext;
    },

    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
      var string = "";
      var i = 0;
      var c = 0;
      var c1 = 0;
      var c2 = 0;

      while ( i < utftext.length ) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
          string += String.fromCharCode(c);
          i++;
        }
        else if((c > 191) && (c < 224)) {
          c2 = utftext.charCodeAt(i+1);
          string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
          i += 2;
        }
        else {
          c2 = utftext.charCodeAt(i+1);
          c3 = utftext.charCodeAt(i+2);
          string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          i += 3;
        }

      }

      return string;
    }

  };

  var btoa = function() {
    return base64.btoa.apply(base64, arguments);
  };
  var atob = function() {
    return base64.atob.apply(base64, arguments);
  };

  nano.memStore = memStore;
  nano.localStore = localStore;
  nano.dbs = {};

  /**
   * Fetch a new or existing nano database
   * @param  {String} dbName the name of the database you wanted to fetch
   * @return {nanoDB}        the database
   *
   * var myapp = nano.db('myapp');
   * 
   */
  nano.db = function(dbName, option) {
    option = option || { store: new localStore };
    var db = new nanoDB(dbName, option);
    nano.dbs[dbName] = db;
    return db;
  };

  /**
   * Nano Database Class
   * @param {String} dbName the name of the database you wanted to fetch
   *
   * var myapp = new nanoDB('myapp');
   * 
   */
  function nanoDB(dbName, options) {
    EventEmitter.call(this);

    this.name = dbName;
    this.options = options;
    this.readystate = 0;
  }

  utils.inherits(nanoDB, EventEmitter);

  /**
   * Fetch a new or existing nano collection of the database.
   * @param {String} collName the name of the collection you wanted to fetch
   * @return {nanoCollection} the collection
   *
   * var items = myapp.collection('items');
   * 
   */
  nanoDB.prototype.collection = function(collName) {
    var collection = new nanoCollection(collName, this);
    this.readystate++;
    if (!this.collections) this.collections = {};
    this.collections[collName] = collection;
    return collection;
  };

  /**
   * Nano Collection Class
   * @param  {String} collName the name of the collection you wanted to fetch
   * @param {String} dbName the parent database of the collection you wanted to fetch
   *
   * var items = new nanoCollection('items', 'myapp');
   * 
   */
  function nanoCollection(collName, db) {
    EventEmitter.call(this);

    var self = this;
    var dbName = db.name;

    self.name = collName;
    self.parent = db;
    var store = db.options.store;

    if (store.async) {
      store.get('nano-' + dbName + '-' + collName, function(err, value) {
        if (err || !value) {
          store.set('nano-' + dbName + '-' + collName, btoa(cP('{}')), function(err) {
            if (err)
              return;

            self.collection = {};
            store.set('nano-' + dbName + '-' + collName + '-indexes', btoa(cP('[]')), function(err) {
              if (err)
                return;

              self.indexes = [];
              self.emit('ready');
              --db.readystate || db.emit('ready');
            });
          });
        } else {
          self.collection = JSON.parse(uCP(atob(value)));
          store.get('nano-' + dbName + '-' + collName + '-indexes', function(err, value) {
            if (err)
              return;

            self.indexes = JSON.parse(uCP(atob(value)));
            self.emit('ready');
            --db.readystate || db.emit('ready');
          });
        }
      });
    } else {
      if (store.get('nano-' + dbName + '-' + collName)) {
        self.collection = jP(uCP(atob(store.get('nano-' + dbName + '-' + collName))));
        self.indexes    = jP(uCP(atob(store.get('nano-' + dbName + '-' + collName + '-indexes'))));
      } else {
        self.collection = {};
        self.indexes    = [];
        store.set('nano-' + dbName + '-' + collName, btoa(cP('{}')));
        store.set('nano-' + dbName + '-' + collName + '-indexes', btoa(cP('[]')));
      }
    }
  }
  utils.inherits(nanoCollection, EventEmitter);

  /**
   * Find items in the collection
   * @param {Object} selector the items selector
   * @param {Object} options the query option
   * @param {Function} callback the query callback
   *
   * //Callback
   * items.find({ foo: "bar" }, function(err, resItems) {
   *     if (err) return console.log('Not found!');
   *     console.log(resItems);
   * });
   *
   * //Cursor
   * items.find({ foo: "bar" }).sort(...).skip(...).limit(...).toArray(function(err, resItems) {
   *     if (err) return console.log('Not found!');
   *     console.log(resItems);
   * });
   * 
   */
  nanoCollection.prototype.find = function() {
    var callback = typeof arguments[arguments.length - 1] == 'function' ? arguments[arguments.length - 1] : false;
    var selector = typeof arguments[0] == 'object' ? arguments[0] : {};
    var options = arguments.length > 2 ? arguments[1] : {};

    var results = [];
    var resultIndexs = [];

    function check (item, _id) {
      if (jS(selector) === '{}') return true;
      if (selector._id === _id) return true;
      for (var key in selector) {
        if (item[key] !== selector[key]) return false;
      }
      return true;
    }

    for (var i = 0; i < this.indexes.length; i++) {
      if (check(this.collection[this.indexes[i]], this.indexes[i])) {
        results.push(this.collection[this.indexes[i]]);
        resultIndexs.push(this.indexes[i]);
      }
    }

    if (callback) {
      if (results.length !== 0) {
        for (var i = 0; i < results.length; i++) {
          results[i]._id = resultIndexs[i];
        }
        return (new nanoCursor(results, this)).toArray(callback);
      } else {
        return (new nanoCursor([], this)).toArray(callback);
      }
    } else {
      if (results.length !== 0) {
        for (var i = 0; i < results.length; i++) {
          results[i]._id = resultIndexs[i];
        }
        return new nanoCursor(results, this);
      } else {
        return new nanoCursor([], this);
      }
    }
  };

  nanoCollection.prototype.findOne = function() {
    var selector = typeof arguments[0] == 'object' ? arguments[0] : {};
    var options = arguments.length > 2 ? arguments[1] : {};
    var callback = arguments[arguments.length - 1];

    var result = null;

    function check (item, _id) {
      if (jS(selector) === '{}') return true;
      if (selector._id === _id) return true;
      for (var key in selector) {
        if (item[key] !== selector[key]) return false;
      }
      return true;
    }

    for (var i = 0; i < this.indexes.length; i++) {
      if (check(this.collection[this.indexes[i]], this.indexes[i])) {
        result = this.collection[this.indexes[i]];
        result._id = this.indexed[i];
        break;
      }
    }

    if (result) {
      callback(null, result);
    } else {
      callback(new Error('Not item found.'));
    }

    return this;
  };

  nanoCollection.prototype.findById = function(_id, callback) {
    if (this.indexes.indexOf(_id) !== -1) {
      var doc = this.collection[_id];
      doc._id = _id;
      return callback(null, doc);
    } else {
      callback(new Error('Not item found.'));
    }

    return this;
  };

  nanoCollection.prototype.insert = function(doc, callback) {
    var self = this;
    var store = self.parent.options.store;
    var last = this.indexes[this.indexes.length - 1];
    if (last) {
      var theNew = last.substr(0, last.length - 1) + (Number(last.substr(last.length - 1)) + 1);
    } else {
      var theNew = btoa('nano' + this.name) + Math.random().toString().substr(2) + '0';
    }

    self.indexes.push(theNew);
    self.collection[theNew] = doc;

    if (store.async) {
      store.set('nano-' + self.parent.name + '-' + self.name, btoa(cP(jS(self.collection))), function(err) {
        if (err)
          return self.emit('error', err);

        store.set('nano-' + self.parent.name + '-' + self.name + '-indexes', btoa(cP(jS(self.indexes))), function(err) {
          if (err)
            return self.emit('error', err);

          callback();
        });
      });
    } else {
      store.set('nano-' + self.parent.name + '-' + self.name, btoa(cP(jS(self.collection))));
      store.set('nano-' + self.parent.name + '-' + self.name + '-indexes', btoa(cP(jS(self.indexes))));
      callback();
    }
    self.emit('insert', doc);
    return self;
  };

  nanoCollection.prototype.update = function() {
    var self = this;
    var store = self.parent.option.store;
    var spec = arguments[0];
    var doc = arguments[1];
    var callback = arguments[arguments.length - 1];
    var options = (arguments.length === 4 ? arguments[2] : {});
    
    self.findOne(spec, function (err, item) {
      if (err) return callback(err);
      for (var key in doc) {
        item[key] = doc[key];
      }
      self.collection[item._id] = item;

      if (store.async) {
        store.set('nano-' + self.parent.name + '-' + self.name, btoa(cP(jS(self.collection))), function(err) {
          if (err)
            return self.emit('error', err);

          store.set('nano-' + self.parent.name + '-' + self.name + '-indexes', btoa(cP(jS(self.indexes))), function(err) {
            if (err)
              return self.emit('error', err);

            callback(null, item);
          });
        });
      } else {
        store.set('nano-' + self.parent.name + '-' + self.name, btoa(cP(jS(self.collection))));
        store.set('nano-' + self.parent.name + '-' + self.name + '-indexes', btoa(cP(jS(self.indexes))));
        callback(null, item);
      }
      self.emit('update', item);
    });

    return self;
  };

  /*
   - TODO
  nanoCollection.prototype.findAndModify = function() {
    var query = arguments[0];
    var sort = arguments[1];
    var update = arguments[2];
    var callback = arguments[arguments.length - 1];
    var options = (arguments.length === 5 ? arguments[3] : {});
    var self = this;

    this.find().sort(sort).toArray(function(err, collection) {
      if (err) return callback(err);

      var indexes = [];
      for (var i = 0; i < collection.length; i++) {
        indexes.push(collection[i]._id);
      }
      var newCollection = new nanoCollection(collection, indexes);

      newCollection.findOne(query, function (err, item) {
        if (err) return callback(err);

        self.update(item, update, options, callback);
      });
    });

    return this;
  };*/

  nanoCollection.prototype.remove = function(selector) {
    var callback = typeof arguments[arguments.length - 1] == 'function' ? arguments[arguments.length - 1] : utils.noop;
    selector = selector || {};

    var store = this.parent.option.store;

    function check (item) {
      if (jS(selector) === '{}') return true;
      for (var key in selector) {
        if (item[key] !== selector[key]) return false;
      }
      return true;
    }

    var res = [];

    var i = 0;
    var f = this.indexes.length;
    for (var i = f - 1; i >= 0; i--) {
      if (check(this.collection[this.indexes[i]])) {
        var t = this.collection[this.indexes[i]];
        t._id = this.indexes[i];
        res.push(t);
        t = null;
        delete this.collection[this.indexes[i]];
        this.indexes.splice(i, 1);
      }
    }
    if (i == 0) return callback(new Error('Not items matched'));

    if (store.async) {
      store.set('nano-' + this.parent.name + '-' + this.name, btoa(cP(jS(this.collection))), function(err) {
        if (err)
          return self.emit('error', err);

        store.set('nano-' + this.parent.name + '-' + this.name + '-indexes', btoa(cP(jS(this.indexes))), function(err) {
          if (err)
            return self.emit('error', err);

          callback(null, item);
        });
      });
    } else {
      store.set('nano-' + this.parent.name + '-' + this.name, btoa(cP(jS(this.collection))));
      store.set('nano-' + this.parent.name + '-' + this.name + '-indexes', btoa(cP(jS(this.indexes))));
      if (callback) callback(null, res);
    }
    this.emit('remove', res);

    return this;
  };

  nanoCollection.prototype.removeById = function(id) {
    var callback = typeof arguments[arguments.length - 1] == 'function' ? arguments[arguments.length - 1] : utils.noop;
    id = id || {};

    var store = this.parent.option.store;

    function check (item) {
      if (item._id === id)
        return true;
      return false;
    }

    var res = [];

    var i = 0;
    var f = this.indexes.length;
    for (var i = f - 1; i >= 0; i--) {
      if (check(this.collection[this.indexes[i]])) {
        var t = this.collection[this.indexes[i]];
        t._id = this.indexes[i];
        res.push(t);
        t = null;
        delete this.collection[this.indexes[i]];
        this.indexes.splice(i, 1);
        break;
      }
    }
    if (i == 0) return callback(new Error('Not items matched'));

    if (store.async) {
      store.set('nano-' + this.parent.name + '-' + this.name, btoa(cP(jS(this.collection))), function(err) {
        if (err)
          return self.emit('error', err);

        store.set('nano-' + this.parent.name + '-' + this.name + '-indexes', btoa(cP(jS(this.indexes))), function(err) {
          if (err)
            return self.emit('error', err);

          callback(null, item);
        });
      });
    } else {
      store.set('nano-' + this.parent.name + '-' + this.name, btoa(cP(jS(this.collection))));
      store.set('nano-' + this.parent.name + '-' + this.name + '-indexes', btoa(cP(jS(this.indexes))));
      if (callback) callback(null, res);
    }
    this.emit('remove', res);

    return this;
  };


  nanoCollection.prototype.toJSON = function() {
    var json = [];
    for (var i = 0; i < this.indexes.length; i++) {
      var tmp = this.collection[this.indexes[i]];
      tmp.id = this.indexes[i];
      json.push(tmp);
    }
    return json;
  };

/*  if ('undefined' !== typeof window && 'undefined' !== typeof document) {
    addEvent(window, 'storage', function(evt) {
      if (!/^nano/.test(evt.key)) {
        return;
      } else if (/^nano-([\w]+)-([\w]+)-indexes$/.test(evt.key)) {
        var foo = evt.key.match(/nano-([\w]+)-([\w]+)/);
        var dbName = foo[1];
        var collname = foo[2];
        var collection = jP(uCP(atob(store.get('nano-' + dbName + '-' + collName))));
        var indexes = jP(uCP(atob(store.get('nano-' + dbName + '-' + collName + '-indexes'))));
        var theNew = collection[indexes[indexes.length - 1]];
        theNew._id = indexes[indexes.length - 1];
        nano.dbs[dbName].collections[collname].emit('storage', theNew);
      } else {
        return;
      }
    });
  }*/


  function nanoCursor (collection, coll) {
    EventEmitter.call(this);

    this.collection = collection;
    this.parent = coll;
  }
  utils.inherits(nanoCursor, EventEmitter);

  nanoCursor.prototype.toArray = function(callback) {
    if (this.collection.length !== 0) {
      callback(null, this.collection);
    } else {
      callback(new Error('Not item found.'));
    }

    return this;
  };
  nanoCursor.prototype.limit = function(count) {
    this.collection = this.collection.slice(0, count);

    return this;
  };
  nanoCursor.prototype.sort = function(options) {
    for (var key in options) {
      this.collection.sort(function(a, b) {
        if (options[key] == -1) {
          return a[key] < b[key] ? 1 : -1;
        } else {
          return a[key] > b[key] ? 1 : -1;
        }
      });
    }

    return this;
  };
  nanoCursor.prototype.skip = function(count) {
    this.collection = this.collection.splice(count);

    return this;
  };
  nanoCursor.prototype.each = function(fn) {
    for (var i = 0, l = this.collection.length; i < l; i++) {
      fn(this.collection[i], i);
    }

    return this;
  };

  utils.extend(nano, new EventEmitter(), EventEmitter.prototype);

  nano.store = new nano.localStore();

  nano.set = function(key, value, callback) {
    if ('undefined' == typeof callback) {
      callback = utils.noop;
    }
    var store = this.store;


    if (store.async) {
      store.set(key, btoa(cP(jS(value))), function(err) {
        if (err)
          return callback(err);

        callback(null, key, value);
      });
    } else {
      store.set(key, btoa(cP(jS(value))));
      callback(null, key, value);
    }

    return this.emit('set', key, value);
  };

  nano.get = function(key, callback) {
    var store = this.store;

    if (store.async) {
      this.store.get(key, function(err, value) {
        if (err)
          return callback(err);

        if (value == '') {
          return callback(null, value);
        }

        callback(null, jP(uCP(atob(value))));
      });
    } else {
      var value = jP(uCP(atob(this.store.get(key))));
      callback(null, value);
    }
  };

  nano.del = function(key, callback) {
    var store = this.store;

    if (store.async) {
      store.remove(key, function(err) {
        if (err)
          return callback(err);

        callback(null, key);
      });
    } else {
      store.remove(key);
      callback(null, key);
    }

    return this.emit('del', key);
  };

  nano.exists = function(key, callback) {
    try {
      this.get(key, function(err, value) {
        if (err || 'undefined' == typeof value) {
          err = err || new Error('This key is not exists.');

          return callback(err, false);
        } else {
          return callback(null, true);
        }
      });
    } catch(err) {
      return callback(err);
    }
  };

  nano.rename = function(key, newKey, callback) {
    try {
      this.exists(key, function(err, exists) {
        if (err || !exists) {
          err = err || new Error('This key is not exists.');

          return callback(err);
        } else {
          this.get(key, function(err, value) {
            if (err)
              return callback(err);

            this.del(key, function(err) {
              if (err)
                return callback(err);

              this.set(newKey, value, callback);
            });
          });
        }
      });
    } catch(err) {
      return callback(err);
    }

    return this.emit('rename', key, newKey);
  };

  nano.renamenx = function(key, newKey, callback) {
    var self = this;
    try {
      self.exists(newKey, function(err, exists) {
        if (err || !exists) {
          self.rename(key, newKey, callback);
        } else {
          callback(new Error('The new key is exists.'));
        }
      });
    } catch(err) {
      callback(err);
    }

    return this.emit('renamenx', key, newKey);
  };

  nano.setnx = function(key, value, callback) {
    var self = this;

    self.exists(key, function(err, exists) {
      if (err || !exists) {
        self.set(key, value, callback);
      } else {
        callback(new Error('The new key is exists.'));
      }
    });

    return this.emit('setnx', key, value);
  };

  return nano;
});
