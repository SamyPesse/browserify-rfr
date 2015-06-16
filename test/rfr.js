var chai = require('chai');
var path = require('path');
var browserify = require('browserify');

var rfr = require('../');

describe('browserify-rfr', function() {
    it('should correctly replaced "rfr()" calls', function(done) {
        var fixtures = path.resolve(__dirname, 'fixtures');
        var b = browserify();
        b.transform(rfr, {
            root: fixtures
        });
        b.add(path.resolve(fixtures, 'main.js'));
        b.bundle()
        .pipe(process.stdout);
    });
});

