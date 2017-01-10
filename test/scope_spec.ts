/**
 * Created by LCsaba on 16/12/17.
 */

// <reference path="..\typings\index.d.ts" />
/// <reference path="..\src\angular.ts" />


describe('Scope', function () {
    let scope: IScopeExt;
    it('can be constructed and used as an object', () => {
        scope = new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);
    });

    describe('digest', function () {

        beforeEach(() => scope = new Scope());

        it('calls the listener function of a watch on first $digest', () => {
            let watchFn = () => 'wat';
            let listenerFn = jasmine.createSpy("wat");
            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();
        });

        it('calls the watch function with the scope as the argument', () => {
            let watchFn = jasmine.createSpy("wut");
            let listenerFn = function () {};

            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it('calls the listener function when the watched value changes', () => {
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) =>  scope.someValue ,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.someValue = 'b';
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('calls the listener when watch value is first undefined', () => {
            scope.counter = 0;
            scope.$watch(
                (scope: IScopeExt) =>  scope.someValue ,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('calls listener with new value as old value the first time', () => {
            scope.someValue = 123;
            let oldValueGiven = null;

            scope.$watch(
                (scope: IScopeExt) =>  scope.someValue ,
                (newValue, oldValue, scope: IScopeExt) => oldValueGiven = oldValue
            );

            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it('may have watchers that omit the listener', () => {
            let watchFn = jasmine.createSpy('wat').and.returnValue('something');
            scope.$watch(watchFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it('triggers chained watchers in the same digest', () => {
            scope.name = 'Jane';
            scope.$watch(
                (scope: IScopeExt) =>  scope.nameUpper ,
                (newValue, oldValue, scope: IScopeExt) => {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );

            scope.$watch(
                (scope: IScopeExt) =>  scope.name ,
                (newValue, oldValue, scope: IScopeExt) => {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );

            scope.$digest();
            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';
            scope.$digest();
            expect(scope.initial).toBe('B.');
        });

        it('gives up on the watches after 10 iterations', () => {
            scope.counterA = 0;
            scope.counterB = 0;

            scope.$watch(
                (scope: IScopeExt) =>  scope.counterA ,
                (newValue, oldValue, scope: IScopeExt) => scope.counterB++
            );

            scope.$$digestOnce();
            scope.$watch(
                (scope: IScopeExt) =>  scope.counterB ,
                (newValue, oldValue, scope: IScopeExt) => scope.counterA++
            );

            expect((function () { scope.$digest();})).toThrow();
        });

        it('ends the digest when the last watch is clean', () => {
            scope.array = _.range(100);
            let watchExecutions = 0;

            _.times(100, (i) => {
                scope.$watch(
                    (scope: IScopeExt) =>  {
                        watchExecutions++;
                        return scope.array[i];
                    } ,
                    (newValue, oldValue, scope: IScopeExt) => {}
                );
            });

            scope.$digest();
            expect(watchExecutions).toBe(200);

            scope.array[0] = 420;
            scope.$digest();
            expect(watchExecutions).toBe(301);
        });

        it('does not end digest so that new watches are not run', () => {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => {
                    scope.$watch(
                        (scope: IScopeExt) => scope.aValue,
                        (newValue, oldValue, scope: IScopeExt) => scope.counter++
                    );
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('compares based on value if enabled', () => {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++,
                true
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
            scope.aValue.push(4);
            scope.$digest();
            expect(scope.counter).toBe(2);
        });

        it('correctly handles NaNs', () => {
            scope.number = 0/0; // NaN
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) => scope.number,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('catches exceptions in watch functions and continues', () => {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) => { throw 'Error'; },
                (newValue, oldValue, scope: IScopeExt) => {}
            );
            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('catches exceptions in listener functions and continues', () => {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => { throw 'Error'; }
            );
            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('allows destroying a $watch with a removal function', () => {
            scope.aValue = 'abc';
            scope.counter = 0;

            let destroyWatch = scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.aValue = 'def';
            scope.$digest();
            expect(scope.counter).toBe(2);

            scope.aValue = 'ghi';
            destroyWatch();
            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it('allows destroying a $watch during digest', () => {
            scope.aValue = 'abc';

            let watchCalls = [];

            scope.$watch(
                (scope: IScopeExt) => {
                    watchCalls.push('first');
                    return scope.aValue;
                }
            );

            let destroyWatch = scope.$watch(
                (scope: IScopeExt) => {
                    watchCalls.push('second');
                    destroyWatch();
                }
            );

            scope.$watch(
                (scope: IScopeExt) => {
                    watchCalls.push('third');
                    return scope.aValue;
                }
            );

            scope.$digest();
            expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
        });

        it('allows a $watch to destroy another during digest', () => {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => {
                    destroyWatch();
                }
            );

            let destroyWatch = scope.$watch(
                (scope: IScopeExt) => {},
                (newValue, oldValue, scope: IScopeExt) => {}
            );

            scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('allows destroying several $watches during digest', () => {
            scope.aValue = 'abc';
            scope.counter = 0;

            let destroyWatch1 = scope.$watch(
                (scope: IScopeExt) => {
                    destroyWatch1();
                    destroyWatch2();
                }
            );

            let destroyWatch2 = scope.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );

            scope.$digest();
            expect(scope.counter).toBe(0);
        });

        it('has a $$phase filed whose value is the current digest phase', () => {
            scope.aValue = [1, 2, 3];
            scope.phaseInWatchFunction = undefined;
            scope.phaseInListenerFunction = undefined;
            scope.phaseInApplyFunction = undefined;

            scope.$watch(
                (scope: IScopeExt) => {
                    scope.phaseInWatchFunction = scope.$$phase;
                    return scope.aValue;
                },
                (newValue, oldValue, scope: IScopeExt) => {
                    scope.phaseInListenerFunction = scope.$$phase;
                }
            );

            scope.$apply((scope) => {
                scope.phaseInApplyFunction = scope.$$phase;
            });

            expect(scope.phaseInWatchFunction).toBe('$digest');
            expect(scope.phaseInListenerFunction).toBe('$digest');
            expect(scope.phaseInApplyFunction).toBe('$apply');
        });
    });

    describe('$scope methods', () => {
        describe('$eval', () => {
            let scope;

            beforeEach(() => {
                scope = new Scope();
            });

            it('executes $evaled function and returns result', () => {
                scope.aValue = 42;

                let result = scope.$eval((scope) => scope.aValue);

                expect(result).toBe(42);
            });

            it('passes the second $eval argument straight through', () => {
                scope.aValue = 42;

                let result = scope.$eval((scope, arg) => scope.aValue + arg, 2);

                expect(result).toBe(44);
            });
        });

        describe('$apply', () => {
            let scope;

            beforeEach(() => {
                scope = new Scope();
            });

            it('executes the given function and starts the digest', () => {
                scope.aValue = 'someValue';
                scope.counter = 0;

                scope.$watch(
                    (scope: IScopeExt) => scope.aValue,
                    (newValue, oldValue, scope: IScopeExt) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.$apply((scope) => {
                    scope.aValue = 'someOtherValue';
                });
                expect(scope.counter).toBe(2);
            });
        });

        describe('$evalAsync', () => {
            let scope;

            beforeEach(() => {
                scope = new Scope();
            });

            it('executes given function later in the same cycle', () => {
                scope.aValue = [1, 2, 3];
                scope.asyncEvaluated = false;
                scope.asyncEvalueatedImmediately = false;

                scope.$watch(
                    (scope: IScopeExt) => scope.aValue,
                    (newValue, oldValue, scope: IScopeExt) => {
                        scope.$evalAsync((scope) => {
                            scope.asyncEvaluated = true;
                        });
                        scope.asyncEvaluatedImmediately = true;
                    }
                );

                scope.$digest();
                expect(scope.asyncEvaluated).toBe(true);
                expect(scope.asyncEvalueatedImmediately).toBe(false);
            });

            it('executes $evalAsynced function added by watch functions', () => {
                scope.aValue = [1, 2, 3];
                scope.asyncEvaluated = false;

                scope.$watch(
                    (scope: IScopeExt) => {
                        if (!scope.asyncEvaluated) {
                            scope.asyncEvaluated = true;
                        }
                        return scope.aValue;
                    },
                    (newValue, oldValue, scope: IScopeExt) => {}
                );

                scope.$digest();
                expect(scope.asyncEvaluated).toBe(true);
            });

            it('executes $evalAsynced functions even when not dirty', () => {
                scope.aValue = [1, 2, 3];
                scope.asyncEvaluatedTimes = 0;

                scope.$watch(
                    (scope: IScopeExt) => {
                        if (scope.asyncEvaluatedTimes < 2) {
                            scope.$evalAsync((scope) => {
                                scope.asyncEvaluatedTimes++;
                            });
                        }
                        return scope.aValue;
                    },
                    (newValue, oldValue, scope: IScopeExt) => {}
                );

                scope.$digest();
                expect(scope.asyncEvaluatedTimes).toBe(2);
            });

            it('eventually halts $evalAsyncs added by watches', () => {
                scope.aValue = [1, 2, 3];

                scope.$watch(
                    (scope: IScopeExt) => {
                        scope.$evalAsync((scope) => {});
                        return scope.aValue;
                    },
                    (newValue, oldValue, scope: IScopeExt) => {}
                );
                expect(() => { scope.$digest(); }).toThrow();
            });

            it('schedules a digest in $evalAsync', (done) => {
                scope.aValue = 'abc';
                scope.counter= 0;

                scope.$watch(
                    (scope: IScopeExt) =>  scope.aValue,
                    (newValue, oldValue, scope: IScopeExt) => scope.counter++
                );

                scope.$evalAsync((scope) => {});

                expect(scope.counter).toBe(0);
                setTimeout(() => {
                    expect(scope.counter).toBe(1);
                    done();
                }, 50);
            });

            it('catches exceptions in $evalAsync', (done) => {
                scope.aValue = 'abc';
                scope.counter = 0;

                scope.$watch(
                    (scope: IScopeExt) =>  scope.aValue,
                    (newValue, oldValue, scope: IScopeExt) => scope.counter++
                );

                scope.$evalAsync((scope) => { throw 'Error'; });

                setTimeout(() => {
                    expect(scope.counter).toBe(1);
                    done();
                }, 50);
            });
        });

        describe('$applyAsync', () => {
            let scope;
            beforeEach(() => scope = new Scope());

            it('allows async $apply with $applyAsync', (done) => {
                scope.counter = 0;

                scope.$watch(
                    (scope: IScopeExt) =>  scope.aValue,
                    (newValue, oldValue, scope: IScopeExt) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.$applyAsync((scope) => {
                    scope.aValue = 'abc';
                });
                expect(scope.counter).toBe(1);

                setTimeout(() => {
                    expect(scope.counter).toBe(2);
                    done();
                }, 50);
            });

            it('never executes $applyAsynced function in the same cycle', (done) => {
                scope.aValue = [1, 2, 3];
                scope.asyncApplied = false;

                scope.$watch(
                    (scope: IScopeExt) =>  scope.aValue,
                    (newValue, oldValue, scope: IScopeExt) => {
                        scope.$applyAsync((scope) => {
                            scope.asyncApplied = true;
                        });
                    }
                );

                scope.$digest();
                expect(scope.asyncApplied).toBe(false);
                setTimeout(() => {
                    expect(scope.asyncApplied).toBe(true);
                    done();
                }, 50);
            });

            it('coalesces many calls to $applyAsync', (done) => {
                scope.counter = 0;

                scope.$watch(
                    (scope: IScopeExt) =>  {
                        scope.counter++;
                        return scope.aValue;
                    },
                    (newValue, oldValue, scope: IScopeExt) => {}
                );

                scope.$applyAsync((scope) => {
                    scope.aValue = 'abc';
                });
                scope.$applyAsync((scope) => {
                    scope.aValue = 'def';
                });
                setTimeout(() => {
                    expect(scope.counter).toBe(2);
                    done();
                }, 50);
            });

            it('cancels and flushes $applyAsync if digested first', (done) => {
                scope.counter = 0;

                scope.$watch(
                    (scope: IScopeExt) =>  {
                        scope.counter++;
                        return scope.aValue;
                    },
                    (newValue, oldValue, scope: IScopeExt) => {}
                );

                scope.$applyAsync((scope) => {
                    scope.aValue = 'abc';
                });
                scope.$applyAsync((scope) => {
                    scope.aValue = 'def';
                });

                scope.$digest();
                expect(scope.counter).toBe(2);
                expect(scope.aValue).toEqual('def');

                setTimeout(() => {
                    expect(scope.counter).toBe(2);
                    done();
                }, 50);
            });

            it('catches exceptions in $applyAsync', (done) => {
                scope.$applyAsync((scope) => {
                    throw 'Error';
                });
                scope.$applyAsync((scope) => {
                    throw 'Error';
                });
                scope.$applyAsync((scope) => {
                    scope.applied = true;
                });
                setTimeout(function() {
                    expect(scope.applied).toBe(true);
                    done();
                }, 50);
            });
        });

        describe('$postDigest', () => {
            let scope;
            beforeEach(() =>  scope = new Scope());

            it('runs after each digest', () => {
                scope.counter = 0;
                scope.$$postDigest(() => scope.counter++);
                expect(scope.counter).toBe(0);
                scope.$digest();
                expect(scope.counter).toBe(1);
                scope.$digest();
                expect(scope.counter).toBe(1);
            });

            it('does not include $$postDigest in the digest', () => {
                scope.aValue = 'original value';
                scope.$$postDigest(() =>  scope.aValue = 'changed value');
                scope.$watch(
                    (scope) => scope.aValue,
                    (newValue, oldValue, scope) => scope.watchedValue = newValue
                );
                scope.$digest();
                expect(scope.watchedValue).toBe('original value');
                scope.$digest();
                expect(scope.watchedValue).toBe('changed value');
            });

            it('catches exceptions in $$postDigest', () => {
                let didRun = false;
                scope.$$postDigest(() =>  { throw 'Error'; });
                scope.$$postDigest(() =>  didRun = true);
                scope.$digest();
                expect(didRun).toBe(true);
            });
        });
    });

    describe('inheritance', () => {
        it('inherits the parent\'s properties', () => {
            let parent: IScopeExt = new Scope();
            parent.aValue = [1, 2, 3];

            let child = parent.$new();

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it('does not cause a parent to inherit its properties', () => {
            let parent: IScopeExt = new Scope();

            let child = parent.$new();
            child.aValue = [1, 2, 3];

            expect(parent.aValue).toBeUndefined();
        });

        it('inherits the parents properties whenever they are defined', () => {
            let parent: IScopeExt = new Scope();

            let child = parent.$new();
            parent.aValue = [1, 2, 3];

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it('can manipulate a parent scopes property', () => {
            let parent: IScopeExt = new Scope();
            let child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.aValue.push(4);
            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it('can watch a property in the parent', () => {
            let parent: IScopeExt = new Scope();
            let child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(
                (scope) => scope.aValue,
                (newValue, oldValue, scope) => scope.counter++,
                true
            );
            child.$digest();
            expect(child.counter).toBe(1);
            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);
        });

        it('can be nested at any depth', () => {
            let a: IScopeExt = new Scope();
            let aa = a.$new();
            let aaa = aa.$new();
            let aab = aa.$new();
            let ab = a.$new();
            let abb = ab.$new();
            a.value = 1;
            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);
            ab.anotherValue = 2;
            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();
        });

        it('shadows a parents property with the same name', () => {
            let parent: IScopeExt = new Scope();
            let child = parent.$new();

            parent.name = 'Joe';
            child.name = 'Jill';

            expect(child.name).toBe('Jill');
            expect(parent.name).toBe('Joe');
        });

        it('does not shadow members of parent scopes attributes', () => {
            let parent: IScopeExt = new Scope();
            let child = parent.$new();

            parent.user = { name: 'Joe' };
            child.user.name = 'Jill';

            expect(child.user.name).toBe('Jill');
            expect(parent.user.name).toBe('Jill');
        });

        it('does not digest its parent(s)', function() {
            let parent: IScopeExt = new Scope();
            let child = parent.$new();
            parent.aValue = 'abc';
            parent.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.aValueWas = newValue
            );
            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });
    });
});
