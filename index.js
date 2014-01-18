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
    
    s.push({ extra: ex.slice(1), cb: cb, fns: [] });
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
            var r = rec[n];
            for (var j = 0; j < elems.length; j++) {
                var values = [ elems[j].getAttribute(key) ];
                for (var k = 0; k < r.extra.length; k++) {
                    var v = elems[j].getAttribute(r.extra[k]);
                    if (v === null || v === undefined) break;
                }
                if (k !== r.extra.length) continue;
                
                if (typeof r.cb !== 'function') continue;
                
                var f = r.f || r.cb(function () {
                    for (var i = 0; i < r.fns.length; i++) {
                        r.fns[i].apply(this, arguments);
                    }
                });
                r.f = f;
                for (var k = 0; k < values.length; k++) {
                    var p = self.lookup(values[k]);
                    if (!p) continue;
                    if (p && typeof p.value === 'function') {
                        r.fns.push((function (p) {
                            return function () {
                                p.value.apply(p.context, arguments);
                            };
                        })(p));
                    }
                }
                
                if (typeof f === 'function') {
                    f.apply(this, [ elems[j] ].concat(values));
                }
            }
        }
    }
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};
