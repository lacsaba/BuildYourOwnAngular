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
    });
});
