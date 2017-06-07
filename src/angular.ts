/**
 * Created by LCsaba on 16/12/19.
 */

/// <reference path="../typings/index.d.ts" />

interface IScope {
    $watch(
        whatchFn: (scope: IScope) => any,
        listenerFn?: (newValue: any, oldValue: any, scope: IScope) => void,
        valuEq?: boolean
    );
    $digest();
    $$digestOnce();
    $eval(expr: (scope: IScope) => any, locals?: Object): any;
    $apply(expr);
    $applyAsync(expr);
    $evalAsync(expr);
    $new(isolated?: boolean, scope?: IScope): IScope;
    $$everyScope(fn);
    $$postDigest(fn);
    $destroy(): void;
    $parent: IScope;
    $$phase;
    $$children: Array<IScope>;
    $$lastDirtyWatch: IWatcher;
    $$applyAsyncId?: any;
    $$postDigestQueue?: Array<any>;
    $watchCollection(
        whatchFn: (scope: IScope) => any,
        listenerFn?: (newValue: any, oldValue: any, scope: IScope) => void
    );
    $$listeners: IListenerContainer;
    $on(name: string, listener: (event: IAngularEvent, ...args: any[]) => any): Function;
    $emit(name: string): IAngularEvent;
    $broadcast(name: string): IAngularEvent;
    $$fireEventOnScope(eventName, listenerArgs);
}

interface IWatcher {
    watchFn: (scope: IScope) => any;
    listenerFn: (newValue: any, oldValue: any, scope: IScope) => void;
    last?: any;
    valueEq?: boolean;
}

interface IAngularEvent {
    targetScope?: IScope;
    currentScope?: IScope;
    name: string;
    preventDefault?: Function;
    defaultPrevented?: boolean;

    // Available only events that were $emit-ted
    stopPropagation?: Function;
}

interface IListenerContainer {
    [eventName: string]: ((event: IAngularEvent, ...args: any[]) => any)[];
}

function initWatchVal() {}

class Scope implements IScope {
    private $$watchers: Array<IWatcher> = [];
    $$lastDirtyWatch: IWatcher = null;
    private $$asyncQueue: Array<any> = [];
    private $$applyAsyncQueue: Array<any> = [];
    $$applyAsyncId?: any = null;
    $$postDigestQueue: Array<any> = [];
    $$children: Array<IScope> = [];
    $$phase: string = null;
    $root: IScope = this;
    $parent: IScope = null;
    $$listeners: any = {};

    constructor() {}

    $watch(watchFn, listenerFn, valueEq?) {
        let watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {},
            last: initWatchVal,
            valueEq: !!valueEq
        };

        // If a watch removes itself, the watch collection gets shifted to the left, that's why unshift is needed.
        // The trick is to reverse the $$watches array, so that new watches are added to the beginning of it and
        // iteration is done from the end to the beginning. When a watcher is then removed, the part of the watch
        // array that gets shifted has already been handled during that digest iteration and it won’t affect the rest of it.
        this.$$watchers.unshift(watcher);
        this.$root.$$lastDirtyWatch = null;

        return () => {
            let index = this.$$watchers.indexOf(watcher);
            if (index >= 0) {
                this.$$watchers.splice(index, 1);
                this.$root.$$lastDirtyWatch = null;
            }
        };
    }

    $digest() {
        let dirty, ttl = 10;
        this.$root.$$lastDirtyWatch = null;
        this.$beginPhase('$digest');

        /**
        * $applyAsync should not do a digest if one happens to be launched for
        * some other reason before the timeout triggers. In those cases the digest should
        * drain the queue and the $applyAsync timeout should be cancelled
        */
        if (this.$root.$$applyAsyncId) {
            clearTimeout(this.$root.$$applyAsyncId);
            this.$$flushApplyAsync();
        }

        do {
            while(this.$$asyncQueue.length) {
                try {
                    let asyncTask = this.$$asyncQueue.shift();
                    asyncTask.scope.$eval(asyncTask.expression);
                }
                catch (e) { console.error('Error in $$asyncQueue: ' + e); }
            }
            dirty = this.$$digestOnce();
            if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
                this.$clearPhase();
                throw '10 digest iterations reached';
            }
        } while (dirty || this.$$asyncQueue.length);
        this.$clearPhase();

        while (this.$$postDigestQueue.length) {
            try {
                this.$$postDigestQueue.shift()();
            }
            catch (e) { console.error('Error in $$postDigestQueue: ' + e); }
        }
    }

    $$digestOnce() {
        let dirty = false, continueLoop = true;
        this.$$everyScope((scope) => {
            let newValue, oldValue;
            _.forEachRight(scope.$$watchers, (watcher) => { // iteration order has to be reversed, because of the watchers being added to the beginning of the array
                try {
                    if (!watcher) { return dirty; }
                    newValue = watcher.watchFn(scope);
                    oldValue = watcher.last;
                    if (!scope.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                        this.$root.$$lastDirtyWatch = watcher;
                        watcher.last = watcher.valueEq ? _.cloneDeep(newValue) : newValue;
                        watcher.listenerFn(newValue,
                            oldValue === initWatchVal ? newValue : oldValue,
                            scope);
                        dirty = true;
                    } else if (watcher === this.$root.$$lastDirtyWatch) {
                        continueLoop = false;
                        return false;
                    }
                } catch (e) {
                    console.log('Error in $$digestOnce: ' + e);
                }
            });
            return continueLoop;
        });
        return dirty;
    }

    $$areEqual(newValue, oldValue, valueEq) {
        if (valueEq) {
            return _.isEqual(newValue, oldValue);
        }
        return newValue === oldValue
            || (typeof newValue === 'number' && typeof oldValue === 'number'
            && isNaN(newValue) && isNaN(oldValue));
    }

    $eval(expr, locals?: any) {
        return expr(this, locals);
    }

    $apply(expr) {
        try {
            this.$beginPhase('$apply');
            this.$eval(expr);
        } finally {
            this.$clearPhase();
            this.$root.$digest();
        }
    }

    /**
     * the main point of $applyAsync is to optimize things that happen in quick
     * succession so that they only need a single digest
     * It is a useful little optimization for situations where you need to $apply,
     * but know you’ll be doing it several times within a short period of time.
     */
    $applyAsync(expr) {
        this.$$applyAsyncQueue.push(() => this.$eval(expr));
        if (this.$root.$$applyAsyncId === null) {
            this.$root.$$applyAsyncId = setTimeout(() => {
                this.$apply(() => this.$$flushApplyAsync());
            }, 0);
        }
    }

    $$flushApplyAsync() {
        while (this.$$applyAsyncQueue.length) {
            try {
                this.$$applyAsyncQueue.shift()();
            }
            catch (e) {
                console.error('Error in $$flushApplyAsync: ' + e);
            }
        }
        this.$root.$$applyAsyncId = null;
    }

    $evalAsync(expr) {
        /*
        * Note that we also check the length of the current async queue in two places here:
         • Before calling setTimeout, we make sure that the queue is empty. That’s because we don’t
         want to call setTimeout more than we need to. If there’s something in the queue, we already
         have a timeout set and it will eventually drain the queue.
        * */
        if (!this.$$phase && !this.$$asyncQueue.length) {
            setTimeout(() => {
                /*
                 • Inside the setTimeout function we make sure that the queue is not empty. The queue may
                 have been drained for some other reason before the timeout function was executed, and we
                 don’t want to kick off a digest unnecessarily, if we have nothing to do.
                * */
                if (this.$$asyncQueue.length) {
                    this.$root.$digest();
                }
            }, 0);
        }
        this.$$asyncQueue.push({scope: this, expression: expr});
    }

    $beginPhase(phase) {
        if (this.$$phase) {
            throw this.$$phase + ' already in progress';
        }
        this.$$phase = phase;
    }

    $clearPhase() {
        this.$$phase = null;
    }

    $$postDigest(fn) {
        this.$$postDigestQueue.push(fn);
    }

    $new(isolated, parentScope = this) {
        let child;
        if (isolated) {
            child = new Scope();
            child.$root = parentScope.$root;
            child.$$asyncQueue = parentScope.$$asyncQueue;
            child.$$postDigestQueue = parentScope.$$postDigestQueue;
            child.$$applyAsyncQueue = parentScope.$$applyAsyncQueue;
        } else {
            let ChildScope = () => {};
            ChildScope.prototype = this;
            child = new ChildScope();
        }

        parentScope.$$children.push(child);
        child.$$watchers = [];
        child.$$listeners = {};
        child.$$children = [];
        child.$parent = parentScope;
        return child;
    }

    $$everyScope(fn: Function) {
        if (fn(this)) {
            return this.$$children.every((childScope) => childScope.$$everyScope(fn));
        } else {
            return false;
        }
    }

    $destroy() {
        this.$broadcast('$destroy');
        if (this.$parent) {
            let siblings: Array<IScope> = this.$parent.$$children;
            let indexOfThis = siblings.indexOf(this);
            if (indexOfThis >=0 ) {
                siblings.splice(indexOfThis, 1);
            }
        }
        this.$$watchers = null;
        this.$$listeners = {};
    }

    $watchCollection(watchFn, listenerFn) {
        let newValue;
        let oldValue;
        let oldLength;
        let veryOldValue;
        let trackVeryOldValue: boolean = listenerFn.length > 1;
        let changeCount = 0;
        let firstRun: boolean = true;

        let internalWatchFn = (scope) => {
            let newLength;
            newValue = watchFn(scope);

            if (_.isObject(newValue)) {
                if (this.isArrayLike(newValue)) {
                    if (!_.isArray(oldValue)) {
                        changeCount++;
                        oldValue = [];
                    }
                    if (newValue.length !== oldValue.length) {
                        changeCount++;
                        oldValue.length = newValue.length;
                    }
                    _.forEach(newValue, (newItem, i) => {
                        // Why not use $$areEqual here?
                        //if (!this.$$areEqual(newItem, oldValue[i], false)) {
                        let bothNaN = _.isNaN(newItem) && _.isNaN(oldValue[i]);
                        if (!bothNaN && newItem !== oldValue[i]) {
                            changeCount++;
                            oldValue[i] = newItem;
                        }
                    });
                } else {
                    if (!_.isObject(oldValue) || this.isArrayLike(oldValue)) {
                        changeCount++;
                        oldValue = {};
                        oldLength = 0;
                    }
                    newLength = 0;
                    _.forOwn(newValue, (newVal, key) => {
                        newLength++;
                        if (oldValue.hasOwnProperty(key)){
                            var bothNaN = _.isNaN(newVal) && _.isNaN(oldValue[key]);
                            if (!bothNaN && oldValue[key] !== newVal) { 
                                changeCount++;
                                oldValue[key] = newVal;
                            }
                        } else {
                            changeCount++;
                            oldLength++;
                            oldValue[key] = newVal;
                        }
                    });
                    if (oldLength > newLength) {
                        changeCount++;
                        _.forOwn(oldValue, (oldVal, key) => {
                        if (!newValue.hasOwnProperty(key)) {
                            oldLength--;
                            delete oldValue[key];
                        }
                    });
                    }
                }
            } else {
                !this.$$areEqual(newValue, oldValue, false) && changeCount++;
                oldValue = newValue;
            }
            return changeCount;
        };
        let internalListenerFn = () => {
            if (firstRun) {
                listenerFn(newValue, newValue, this);
                firstRun = false;
            } else {
                listenerFn(newValue, veryOldValue, this);
            }

            trackVeryOldValue && (veryOldValue = _.clone(newValue));
        };

        return this.$watch(internalWatchFn, internalListenerFn);
    }

    isArrayLike(obj) {
        if (_.isNull(obj) || _.isUndefined(obj)) {
            return false;
        }

        let length = obj.length;
        return length === 0 || (_.isNumber(length) && length > 0 && (length - 1) in obj);
    }

    $on(eventName, listenerFn) {
        let listeners = this.$$listeners[eventName];
        if (!listeners) {
            this.$$listeners[eventName] = listeners = [];
        }
        listeners.push(listenerFn);

        return () => {
            let index = listeners.indexOf(listenerFn);
            if (index > -1) {
                listeners[index] = null;
            }
        };
    }

    // not in Angular
    $$fireEventOnScope(eventName, listenerArgs) {        
        let listeners = this.$$listeners[eventName] || [];
        let i = 0;
        while(i < listeners.length) {
            if (listeners[i] === null) {
                listeners.splice(i, 1);
            } else {
                try {
                    listeners[i].apply(null, listenerArgs);
                } catch(e) { console.error('Error in $$fireEventOnScope: ' + e); }
                i++;
            }
        }
        return event;
    }

    $emit(eventName) {
        let propagationStopped = false;
        let event = {
            name: eventName,
            targetScope: this,
            currentScope: null,
            stopPropagation: () => propagationStopped = true,
            defaultPrevented: false,
            preventDefault: () => event.defaultPrevented = true
        };
        let listenerArgs = [event].concat(_.tail(arguments));
        let scope = this as IScope;
        do {
            event.currentScope = scope;
            scope.$$fireEventOnScope(eventName, listenerArgs);
            scope = scope.$parent;
        } while(scope && !propagationStopped);
        event.currentScope = null;
        return event;
    }

    $broadcast(eventName) {
        let event = {
            name: eventName,
            targetScope: this,
            currentScope: null,
            defaultPrevented: false,
            preventDefault: () => event.defaultPrevented = true
        };
        let listenerArgs = [event].concat(_.tail(arguments));
        this.$$everyScope(scope => {
            event.currentScope = scope;
            scope.$$fireEventOnScope(eventName, listenerArgs);
            return true;
        });
        event.currentScope = null;
        return event;
    }
}