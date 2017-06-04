
/**
 * Created by LCsaba on 17/06/04.
 */
/// <reference path="..\typings\index.d.ts" />
/// <reference path="..\src\angular.ts" />

describe('Scope', () => {
    let scope: IScopeExt;
    let parent;
    let child;
    let isolatedChild;

    describe('Events', () => {
        beforeEach(() => {
            parent = new Scope();
            scope = parent.$new();
            child = scope.$new();
            isolatedChild = scope.$new(true);
        });

        it('allows registering listeners', () => {
            let listener1 = () => {};
            let listener2 = () => {};
            let listener3 = () => {};

            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);
            scope.$on('someOtherEvent', listener3);

            expect(scope.$$listeners).toEqual({
                someEvent: [listener1, listener2],
                someOtherEvent: [listener3]
            });
        });

        it('registers different listeners for every scope', () => {
            let listener1 = () => {};
            let listener2 = () => {};
            let listener3 = () => {};

            scope.$on('someEvent', listener1);
            child.$on('someEvent', listener2);
            isolatedChild.$on('someEvent', listener3);

            expect(scope.$$listeners).toEqual({someEvent: [listener1]});
            expect(child.$$listeners).toEqual({someEvent: [listener2]});
            expect(isolatedChild.$$listeners).toEqual({someEvent: [listener3]}); 
        });
        
        it('calls the listeners of the matching event on $emit', () => {
            let listener1 = jasmine.createSpy('');
            let listener2 = jasmine.createSpy('');

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);

            scope.$emit('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
        });

        it('calls the listeners of the matching event on $broadcast', () => {
            let listener1 = jasmine.createSpy('');
            let listener2 = jasmine.createSpy('');

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);

            scope.$broadcast('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
        });
    });
});