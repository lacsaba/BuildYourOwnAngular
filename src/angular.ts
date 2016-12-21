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

        this.$$watchers.unshift(watcher); // if a watch removes itself, the watch collection gets shifted to the left, that's why unshift is needed. The trick is to reverse the $$watches array, so that new watches are added to the beginning of it and iteration is done from the end to the beginning. When a watcher is then removed, the part of the watch array that gets shifted has already been handled during that digest iteration and it won’t affect the rest of it.
        this.$$lastDirtyWatch = null;

        return () => {
            let index = this.$$watchers.indexOf(watcher);
            if (index >= 0) {
                this.$$watchers.splice(index, 1);
                this.$$lastDirtyWatch = null;
            }
        };
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
        _.forEachRight(this.$$watchers, (watcher) => { // iteration order has to be reversed, because of the watchers being added to the beginning of the array
            try {
                if (!watcher) { return dirty; }
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