/**
 * Created by LCsaba on 16/12/17.
 */
'use strict';

var _ = require('lodash');
module.exports = function Scope () {
    this.$$watchers = [];

    Scope.prototype.$watch = function (watchFn, listenerFn) {
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn
        };
        this.$$watchers.push(watcher);
    };

    Scope.prototype.$digest = function () {
        var self = this;
        _.forEach(this.$$watchers, function (watcher) {
            watcher.watchFn(self);
            watcher.listenerFn();
        })
    };
};