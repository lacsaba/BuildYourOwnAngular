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
    $$digestOnce();
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
            listenerFn: listenerFn || function () {},
            last: initWatchVal
        };
        this.$$watchers.push(watcher);
    }

    $digest() {
        let dirty;
        do {
            dirty = this.$$digestOnce();
        } while (dirty);
    }

    $$digestOnce() {
        let newValue, oldValue, dirty = false;
        _.forEach(this.$$watchers, (watcher) => {
            newValue = watcher.watchFn(this);
            oldValue = watcher.last;
            if (newValue !== oldValue) {
                watcher.last = newValue;
                watcher.listenerFn(newValue,
                    oldValue === initWatchVal ? newValue : oldValue,
                    this);
                dirty = true;
            }
        });
        return dirty;
    }
}