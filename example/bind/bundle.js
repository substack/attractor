(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var attractor = require('../../');
var scope = { yourName: function (txt) { console.log(txt) } };
var attr = attractor({ 'binder': require('attr-bind') }, scope);
attr.scan(document);

},{"../../":2,"attr-bind":3}],2:[function(require,module,exports){
var expand = require('brace-expansion');
var isArray = require('isarray');
module.exports = Attractor;

function Attractor (attrs, scope) {
    if (!(this instanceof Attractor)) return new Attractor(attrs, scope);
    
    this._selectors = {};
    this.scope = scope || {};
    
    var keys = objectKeys(attrs || {});
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        this.add(key, attrs[key]);
    }
}

Attractor.prototype.lookup = function (str) {
    var keys = str.split('.');
    var node = this.scope, context = null;
    for (var i = 0; i < keys.length; i++) {
        context = node;
        node = node[keys[i]];
        if (!node) return null;
    }
    return { context: context, value: node };
};

Attractor.prototype.add = function (key, cb) {
    var self = this;
    var ex = expand(key);
    if (isArray(cb)) {
        cb = (function (args) {
            if (typeof args[0] !== 'function') {
                throw new Error(
                    'first element in .add(array) must be a function'
                );
            }
            return function () {
                var argv = args.slice(1).concat([].slice.call(arguments));
                return args[0].apply(this, argv);
            };
        })(cb);
    }
    
    var s = this._selectors[ex[0]];
    if (!s) s = this._selectors[ex[0]] = [];
    
    s.push(new Match({
        attrs: ex,
        parent: this,
        lookup: function (key) { return self.lookup(key) }
    }, cb));
};

Attractor.prototype.scan = function (root) {
    var self = this;
    var keys = objectKeys(this._selectors);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var sel = '*[' + key + ']';
        var rec = this._selectors[key];
        
        var elems = root.querySelectorAll(sel);
        if (root.getAttribute && root.getAttribute(key)) {
            elems = [].slice.call(elems);
            elems.unshift(root);
        }
        if (elems.length === 0) continue;
        
        for (var n = 0; n < rec.length; n++) {
            rec[n].test(elems);
        }
    }
};

function Match (opts, fn) {
    var self = this;
    this.key = opts.attrs[0];
    this.extra = opts.attrs.slice(1);
    this.lookup = opts.lookup;
    this.parent = opts.parent;
    this.listeners = {};
    this.elements = [];
    this.fns = [];
    this._tested = false;
    
    this.fn = fn(function f () {
        var args = arguments;
        if (!self._tested && self.fns.length === 0) {
            var next = function () { f.apply(null, args) };
            if (typeof setImmediate !== 'undefined') {
                setImmediate(next);
            }
            else setTimeout(next, 0);
        }
        
        for (var i = 0; i < self.fns.length; i++) {
            var p = self.fns[i];
            p.value.apply(p.context, args);
        }
    });
}

Match.prototype.test = function (elems) {
    var self = this;
    this._tested = true;
    
    for (var j = 0; j < elems.length; j++) {
        if (this.elements.indexOf(elems[j]) >= 0) continue;
        
        var values = [ elems[j].getAttribute(this.key) ];
        for (var k = 0; k < this.extra.length; k++) {
            var v = elems[j].getAttribute(this.extra[k]);
            if (v === null || v === undefined) break;
        }
        if (k !== this.extra.length) continue;
        
        for (var k = 0; k < values.length; k++) {
            var p = this.lookup(values[k]);
            if (!p) continue;
            if (this.listeners[values[k]]) continue;
            if (p && typeof p.value === 'function') {
                this.fns.push(p);
                this.listeners[values[k]] = true;
            }
        }
        
        this.elements.push(elems[j]);
        this.fn.apply(this.parent, [ elems[j] ].concat(values));
    }
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

},{"brace-expansion":4,"isarray":7}],3:[function(require,module,exports){
module.exports = function (cb) {
    var elements = [];
    var value;
    if (cb) {
        elements.push(cb);
        value = cb();
        cb(function (v) {
            value = v;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] === cb) continue;
                set(elements[i], value);
            }
        });
    }
    
    return function (elem) {
        if (value !== undefined) {
            value = get(elem);
        }
        else set(elem, value);
        
        elements.push(elem);
        
        if (typeof elem === 'function') {
            elem(onchange);
        }
        else {
            elem.addEventListener('change', onchange);
            elem.addEventListener('keydown', onchange);
            elem.addEventListener('keyup', onchange);
        }
        
        function onchange () {
            var x = get(elem);
            if (x === value) return;
            value = x;
            
            for (var i = 0; i < elements.length; i++) {
                if (elements[i] === elem) continue;
                set(elements[i], value);
            }
        }
    };
    
    function set (elem, value) {
        if (value === undefined) value = '';
        if (typeof value !== 'string') value = String(value);
        if (typeof elem === 'function') return elem(value);
        
        if (elem.value !== undefined) {
            elem.value = value;
        }
        else if (elem.textContent !== undefined) {
            elem.textContent = value;
        }
        else if (elem.innerText !== undefined) {
            elem.innerText = value;
        }
        else {
            var txt = document.createTextNode(value);
            elem.innerHTML = '';
            elem.appendChild(txt);
        }
    }
    
    function get (elem) {
        if (typeof elem === 'function') return elem();
        
        if (elem.value !== undefined) return elem.value;
        if (editable(elem)) return elem.value;
        return elem.textContent || elem.innerText;
    }
    
    function editable (elem) {
        if (typeof elem === 'function') return false;
        if (!elem || !elem.tagName) return false;
        var tag = elem.tagName.toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA';
    }
};

},{}],4:[function(require,module,exports){
var concatMap = require('concat-map');
var balanced = require('balanced-match');

module.exports = expand;

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function expand(str) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[^0-9]\.\.[^0-9](\.\.\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = /^(.*,)+(.+)?$/.test(m.body);
  if (!isSequence && !isOptions) return [str];

  var pre = m.pre.length
    ? expand(m.pre)
    : [''];
  var post = m.post.length
    ? expand(m.post)
    : [''];

  var n = [];
  var bal = 0;
  var buf = '';
  var sep = isSequence
    ? /^\.\./
    : /^,/;
  var c, next;
  for (var i = 0; i < m.body.length; i++) {
    c = m.body[i];

    if (!bal && sep.test(m.body.slice(i))) {
      n.push(buf);
      buf = '';
    } else if (!(isSequence && c == '.')){
      buf += c;

      if (c == '{') {
        bal++;
      } else if (c == '}') {
        bal--;
      }
    }
    if (i == m.body.length - 1) {
      n.push(buf);
    }
  }

  n = concatMap(n, function(el) { return expand(el) });
  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = typeof x == 'number'
      ? Math.max(n[0].length, n[1].length)
      : 1;
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var reverse = y < x;
    var pad = n.filter(function(el) {
      return /^-?0\d/.test(el);
    }).length;

    N = [];
    function push(i) {
      if (isAlphaSequence) {
        N.push(String.fromCharCode(i));
      } else {
        i = String(i);
        if (pad) {
          while (i.length < width) i = '0' + i;
        }
        N.push(i);
      }
    }

    if (reverse) {
      for (var i = x; i >= y; i -= incr) push(i);
    } else {
      for (var i = x; i <= y; i += incr) push(i);
    }

    if (Math.abs(y - x) % incr) push(y);
  } else {
    N = n;
  }

  for (var i = 0; i < pre.length; i++) {
    for (var j = 0; j < N.length; j++) {
      for (var k = 0; k < post.length; k++) {
        expansions.push([pre[i], N[j], post[k]].join(''))
      }
    }
  }

  return expansions;
}


},{"balanced-match":5,"concat-map":6}],5:[function(require,module,exports){
module.exports = function(a, b, str) {
  var bal = 0;
  var m = {};

  for (var i = 0; i < str.length; i++) {
    if (str[i] == a) {
      if (!('start' in m)) m.start = i;
      bal++;
    }
    else if (str[i] == b) {
      bal--;
      if (!bal) {
        m.end = i;
        m.pre = str.substr(0, m.start);
        m.body = (m.end - m.start > 1)
          ? str.substring(m.start + 1, m.end)
          : '';
        m.post = str.slice(m.end + 1);
        return m;
      }
    }
  }
};


},{}],6:[function(require,module,exports){
module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (Array.isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

},{}],7:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}]},{},[1])