var attractor = require('../../');
var scope = {
    yourName: function (txt) {
        console.log('yourname=', txt)
    }
};
var attr = attractor({ 'binder': require('attr-bind') }, scope);
attr.scan(document);
