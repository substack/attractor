var attractor = require('../../');
var bind = require('attr-bind')({
    yourName: function (value) {
        return value.toUpperCase();
    }
});
var attr = attractor({ 'binder': bind });
attr.scan(document);
