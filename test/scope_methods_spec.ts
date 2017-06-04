/**
 * Created by LCsaba on 17/05/29.
 */
/// <reference path="..\typings\index.d.ts" />
/// <reference path="..\src\angular.ts" />

describe('Scope', () => {
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

        describe('$watchCollection', () => {
            let scope;
            beforeEach(() =>  scope = new Scope());

            it('works like a normal watch for non-collections', () => {
                let valueProvided;

                scope.aValue = 42;
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => {
                        valueProvided = newValue;
                        scope.counter++;
                    }
                );

                scope.$digest();
                expect(scope.counter).toBe(1);
                expect(valueProvided).toBe(scope.aValue);

                scope.aValue = 43;
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('works like a normal watch for NaNs', () => {
                scope.aValue = 0/0;
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.aValue,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);
                scope.$digest();
                expect(scope.counter).toBe(1);
            });

            it('notices when the value becomes an array', () => {
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arr,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.arr = [1, 2, 3];
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices an item added to an array', () => {
                scope.arr = [1, 2, 3];
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arr,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.arr.push(4);
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices an item removed to an array', () => {
                scope.arr = [1, 2, 3];
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arr,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.arr.shift();
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices an item replaced in an array', () => {
                scope.arr = [1, 2, 3];
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arr,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.arr[1] = 42;
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices items reordered in an array', () => {
                scope.arr = [2, 1, 3];
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arr,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.arr.sort();
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('does not fail on NaNs in arrays', () => {
                scope.arr = [2, NaN, 3];
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arr,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);
            });

            it('notices an item replaced in an arguments object', () => {
                (function (a, b, c) {
                    scope.arrayLike = arguments;
                })(1, 2, 3);
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arrayLike,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.arrayLike[1] = 42;
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices an item replaced in a NodeList object', () => {
                document.documentElement.appendChild(document.createElement('div'));
                scope.arrayLike = document.getElementsByTagName('div');

                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.arrayLike,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                document.documentElement.appendChild(document.createElement('div'));
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices when the value becomes an object', () => {
                scope.counter = 0;

                scope.$watchCollection(
                    scope => scope.obj,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.obj = { a: 1 };
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices when an attribute is added to the object', () => {
                scope.counter = 0;
                scope.obj = { a: 1 };

                scope.$watchCollection(
                    scope => scope.obj,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.obj.b = 42;
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('notices when an attribute is changed in an object', () => {
                scope.counter = 0;
                scope.obj = { a: 1 };

                scope.$watchCollection(
                    scope => scope.obj,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.obj.a = 42;
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });

            it('does nat fail on NaN attributes in objects', () => {
                scope.counter = 0;
                scope.obj = { a: NaN };

                scope.$watchCollection(
                    scope => scope.obj,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                scope.$digest();
                expect(scope.counter).toBe(1);
            });

            it('notices when an attribute is removed from the object', () => {
                scope.counter = 0;
                scope.obj = { a: 1, b: 2 };

                scope.$watchCollection(
                    scope => scope.obj,
                    (newValue, oldValue, scope) => scope.counter++
                );

                scope.$digest();
                expect(scope.counter).toBe(1);

                delete scope.obj.b;
                scope.$digest();
                expect(scope.counter).toBe(2);

                scope.$digest();
                expect(scope.counter).toBe(2);
            });
        });
    });
});