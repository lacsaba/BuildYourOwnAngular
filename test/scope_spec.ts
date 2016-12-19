/**
 * Created by LCsaba on 16/12/17.
 */

// <reference path="..\typings\index.d.ts" />
/// <reference path="..\src\angular.ts" />


describe('Scope', function () {
    let scope: IScopeExt;
    it('can be constructed and used as an object', function () {
        scope = new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);
    });

    describe('digest', function () {

        beforeEach(function () {
            scope = new Scope();
        });

        it('calls the listener function of a watch on first $digest', function () {
            let watchFn = function () { return 'wat'; };
            let listenerFn = jasmine.createSpy("wat");
            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();
        });

        it('calls the watch function with the scope as the argument', function () {
            let watchFn = jasmine.createSpy("wut");
            let listenerFn = function () {};

            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it('calls the listener function when the watched value changes', function (){
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                function () { return scope.someValue; },
                function (newValue, oldValue, scope) { scope.counter++;}
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

        it('calls the listener when watch value is first undefined', function () {
            scope.counter = 0;
            scope.$watch(
                function () { return scope.someValue; },
                function (newValue, oldValue, scope) { scope.counter++;}
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });
    });
});
