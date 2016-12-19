/**
 * Created by LCsaba on 16/12/19.
 */

/// <reference path="../typings/index.d.ts" />

interface IScope {
    $watch(
        whatchFn: (scope: IScope) => void,
        listenerFn?: (oldValue: any, newValue: any, scope: IScope) => void
    );
    $digest();
}

interface IWatcher {
    watchFn: (scope: IScope) => any;
    listenerFn: (oldValue: any, newValue: any, scope: IScope) => void;
    last?: any;
}

function initWatchVal() {}

class Scope implements IScope {
    private $$watchers: Array<IWatcher> = [];

    constructor() {}

    $watch(watchFn, listenerFn) {
        let watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn,
            last: initWatchVal
        };
        this.$$watchers.push(watcher);
    }

    $digest() {
        let self = this;
        let newValue, oldValue;
        _.forEach(this.$$watchers, function (watcher) {
            newValue = watcher.watchFn(self);
            oldValue = watcher.last;
            if (newValue !== oldValue) {
                watcher.last = newValue;
                watcher.listenerFn(newValue, oldValue, self);
            }
        });
    }
}