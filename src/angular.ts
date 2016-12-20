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
    private $$lastDirtyWatch: IWatcher = null;

    constructor() {}

    $watch(watchFn, listenerFn) {
        let watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {},
            last: initWatchVal
        };
        this.$$watchers.push(watcher);
        this.$$lastDirtyWatch = null;
    }

    $digest() {
        let dirty, ttl = 10;
        this.$$lastDirtyWatch = null;
        do {
            dirty = this.$$digestOnce();
            if (dirty && !(ttl--)) {
                throw '10 digest iterations reached';
            }
        } while (dirty);

    }

    $$digestOnce() {
        let newValue, oldValue, dirty = false;
        _.forEach(this.$$watchers, (watcher) => {
            newValue = watcher.watchFn(this);
            oldValue = watcher.last;
            if (newValue !== oldValue) {
                this.$$lastDirtyWatch = watcher;
                watcher.last = newValue;
                watcher.listenerFn(newValue,
                    oldValue === initWatchVal ? newValue : oldValue,
                    this);
                dirty = true;
            } else if (watcher === this.$$lastDirtyWatch) {
                return false;
            }
        });
        return dirty;
    }
}