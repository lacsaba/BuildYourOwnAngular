/**
 * Created by LCsaba on 16/12/19.
 */

/// <reference path="../typings/index.d.ts" />

interface IScope {
    $watch(
        whatchFn: (scope: IScope) => void,
        listenerFn?: (oldValue: any, newValue: any, scope: IScope) => void,
        valuEq?: boolean
    );
    $digest();
    $$digestOnce();
}

interface IWatcher {
    watchFn: (scope: IScope) => any;
    listenerFn: (oldValue: any, newValue: any, scope: IScope) => void;
    last?: any;
    valueEq?: boolean;
}

function initWatchVal() {}

class Scope implements IScope {
    private $$watchers: Array<IWatcher> = [];
    private $$lastDirtyWatch: IWatcher = null;

    constructor() {}

    $watch(watchFn, listenerFn, valueEq) {
        let watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {},
            last: initWatchVal,
            valueEq: !!valueEq
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
            try {
                newValue = watcher.watchFn(this);
                oldValue = watcher.last;
                if (!this.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                    this.$$lastDirtyWatch = watcher;
                    watcher.last = watcher.valueEq ? _.cloneDeep(newValue) : newValue;
                    watcher.listenerFn(newValue,
                        oldValue === initWatchVal ? newValue : oldValue,
                        this);
                    dirty = true;
                } else if (watcher === this.$$lastDirtyWatch) {
                    return false;
                }
            } catch (e) {
                console.log(e);
            }
        });
        return dirty;
    }

    $$areEqual(newValue, oldValue, valueEq) {
        if (valueEq) {
            return _.isEqual(newValue, oldValue);
        } else {
            return newValue === oldValue
                || (typeof newValue === 'number' && typeof oldValue === 'number'
                && isNaN(newValue) && isNaN(oldValue));
        }
    }
}