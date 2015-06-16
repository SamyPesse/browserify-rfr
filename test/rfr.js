var expect = require('chai').expect;
var path = require('path');
var browserify = require('browserify');

var rfr = require('../');

describe('browserify-rfr', function() {
    var fixtures = path.resolve(__dirname, 'fixtures');

    it('should correctly replaced "rfr()" calls', function(done) {
        var b = browserify();

        b.transform(rfr, {
            root: fixtures
        })
        .add(path.resolve(fixtures, 'main.js'));

        b.bundle(function(err, data) {
            if (err) return done(err);
            data = data.toString();

            expect(data).to.contain('module.exports = 1;');
            expect(data).to.contain('module.exports = require("./../t2");');

            done();
        });
    });

    it('should correctly handle file starting with shebang', function(done) {
        var b = browserify();

        b.transform(rfr, {
            root: fixtures
        })
        .add(path.resolve(fixtures, 'shebang.js'));

        b.bundle(function(err, data) {
            if (err) return done(err);
            data = data.toString();

            expect(data).to.contain('module.exports = 1;');
            expect(data).to.contain('module.exports = require("./../t2");');

            done();
        });
    });
});

