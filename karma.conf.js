/**
 * Created by LCsaba on 16/12/17.
 */

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        //basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [].concat(
            ["node_modules/lodash/lodash.js"],
            //["node_modules/jquery/dist/jquery.js"],
            ["src/*.ts"],
            ['test/**/*_spec.ts']//, 'templates/**/*.html'
        ),


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            '**/*.ts': ['typescript']
            //,'**/*.html': ['ng-html2js']
        },
        typescriptPreprocessor: {
            // options passed to the typescript compiler
            options: {
                sourceMap: true, // (optional) Generates corresponding .map file.
                target: 'ES5', // (optional) Specify ECMAScript target version: 'ES3' (default), or 'ES5'
                //module: 'none', // (optional) Specify module code generation: 'commonjs' or 'amd'
                noImplicitAny: true, // (optional) Warn on expressions and declarations with an implied 'any' type.
                noResolve: false, // (optional) Skip resolution and preprocessing.
                removeComments: true, // (optional) Do not emit comments to output.
                concatenateOutput: true, // (optional) Concatenate and emit output to single file. By default true if module option is omited, otherwise false.
                diagnostics: true,
                inlineSourceMap: true,
                inlineSources: true
            },
            // transforming the filenames
            transformPath: function (path) {
                return path.replace(/\.ts$/, '.js');
            }
        },

        /*ngHtml2JsPreprocessor: {
         prependPrefix: '/'
         },*/

        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-typescript-preprocessor'
            //'karma-ng-html2js-preprocessor'
        ],


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        junitReporters: {
            outputFile: 'test_out.xml',
            suite: 'unit'
        }
    });
};
