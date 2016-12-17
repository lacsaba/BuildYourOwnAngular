/**
 * Created by LCsaba on 16/12/17.
 */
module.exports = function (config) {
    config.set({
        frameworks: ['browserify', 'jasmine'],
        files: [
            'src/**/*.js',
            'test/**/*_spec.js'
        ],
        preprocessors: {
            'test/**/*.js': ['jshint', 'browserify'],
            'src/**/*.js': ['jshint', 'browserify']
        },
        browsers: ['PhantomJS'],
        browserify: {
            debug: true,
            bundleDelay: 2000
        }
    });
};