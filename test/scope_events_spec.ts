
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
        
        _.forEach(['$emit', '$broadcast'], method => {
            it('calls the listeners of the matching event on ' + method, () => {
            let listener1 = jasmine.createSpy('');
            let listener2 = jasmine.createSpy('');

            scope.$on('someEvent', listener1);
            scope.$on('someOtherEvent', listener2);

            scope[method]('someEvent');

            expect(listener1).toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
            });
            
            it('passes an event object with a name to listeners on ' + method, () => {
                let listener = jasmine.createSpy('');
                scope.$on('someEvent', listener);

                scope[method]('someEvent');

                expect(listener).toHaveBeenCalled();
                expect(listener.calls.mostRecent().args[0].name).toEqual('someEvent');
            });

            it('passes the same event object to each listener on ' + method, () => {
                let listener1 = jasmine.createSpy('');
                let listener2 = jasmine.createSpy('');
                scope.$on('someEvent', listener1);
                scope.$on('someEvent', listener2);

                scope[method]('someEvent');

                expect(listener1).toHaveBeenCalled();
                expect(listener2).toHaveBeenCalled();

                let event1 = listener1.calls.mostRecent().args[0];
                let event2 = listener2.calls.mostRecent().args[0];

                expect(event1).toBe(event2);
            });

            it('passes additional arguments to listeners on ' + method, () => {
                let listener = jasmine.createSpy('');
                scope.$on('someArgEvent', listener);

                scope[method]('someArgEvent', 'and', ['additional', 'arguments'], '...');

                expect(listener.calls.mostRecent().args[1]).toEqual('and');
                expect(listener.calls.mostRecent().args[2]).toEqual(['additional', 'arguments']);
                expect(listener.calls.mostRecent().args[3]).toEqual('...');
            });

            it('returns the event object on ' + method, () => {
                let returnedEvent = scope[method]('someEvent');

                expect(returnedEvent).toBeDefined();
                expect(returnedEvent.name).toEqual('someEvent');
            });

            it('can be deregistered ' + method, () => {
                let listener = jasmine.createSpy('');
                let deregister = scope.$on('someEvent', listener);

                deregister();

                scope[method]('someEvent');
                expect(listener).not.toHaveBeenCalled();
            });

            it('does not skip the next listener when removed on ' + method, () => {
                let deregister;

                let listener = () => deregister();
                let nextListener = jasmine.createSpy('');

                deregister = scope.$on('someEvent', listener);
                scope.$on('someEvent', nextListener);

                scope[method]('someEvent');

                expect(nextListener).toHaveBeenCalled();
            });

            it('sets defaultPrevented when preventDefault called on' + method, () => {
                let listener = event => event.preventDefault();

                scope.$on('someEvent', listener);

                let event = scope[method]('someEvent');

                expect(event.defaultPrevented).toBe(true);
            });
        });

        it('propagates up the scope hierarchy on $emit', () => {
            let parentListener = jasmine.createSpy('');
            let scopeListener = jasmine.createSpy('');

            parent.$on('someEvent', parentListener);
            scope.$on('someEvent', scopeListener);

            scope.$emit('someEvent');

            expect(scopeListener).toHaveBeenCalled();
            expect(parentListener).toHaveBeenCalled();
        });

        it('propagates the same event up on $emit', () => {
            let parentListener = jasmine.createSpy('');
            let scopeListener = jasmine.createSpy('');

            parent.$on('someEvent', parentListener);
            scope.$on('someEvent', scopeListener);

            scope.$emit('someEvent');

            let scopeEvent = scopeListener.calls.mostRecent().args[0];
            let parentEvent = parentListener.calls.mostRecent().args[0];
            expect(scopeEvent).toBe(parentEvent);
        });

        it('propagates down the scope hierarchy on $broadcast', () => {
            let scopeListener = jasmine.createSpy('');
            let childListener = jasmine.createSpy('');
            let isolatedChildListener = jasmine.createSpy('');

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);
            isolatedChild.$on('someEvent', isolatedChildListener);

            scope.$broadcast('someEvent');

            expect(scopeListener).toHaveBeenCalled();
            expect(childListener).toHaveBeenCalled();
            expect(isolatedChildListener).toHaveBeenCalled();
        });

        it('propagates the same event down on $broadcast', () => {
            let scopeListener = jasmine.createSpy('');
            let childListener = jasmine.createSpy('');
            let isolatedChildListener = jasmine.createSpy('');

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);
            isolatedChild.$on('someEvent', isolatedChildListener);

            scope.$broadcast('someEvent');

            let scopeEvent = scopeListener.calls.mostRecent().args[0];
            let childEvent = childListener.calls.mostRecent().args[0];
            let isolatedChildEvent = isolatedChildListener.calls.mostRecent().args[0];

            expect(scopeEvent).toBe(childEvent);
            expect(childEvent).toBe(isolatedChildEvent);
        });

        it('attaches targetScope on $emit', () => {
            let scopeListener = jasmine.createSpy('');
            let parentListener = jasmine.createSpy('');

            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');

            expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        });

        it('attaches targetScope on $broadcast', () => {
            let scopeListener = jasmine.createSpy('');
            let childListener = jasmine.createSpy('');

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            scope.$broadcast('someEvent');

            expect(scopeListener.calls.mostRecent().args[0].targetScope).toBe(scope);
            expect(childListener.calls.mostRecent().args[0].targetScope).toBe(scope);
        });

        it('attaches current scope on $emit', () => {
            let currentScopeOnScope, currentScopeOnParent;
            let scopeListener = event => { currentScopeOnScope = event.currentScope; }
            let parentListener = event => { currentScopeOnParent = event.currentScope; }

            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');

            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnParent).toBe(parent);
        });

        it('attaches current scope on $broadcast', () => {
            let currentScopeOnScope, currentScopeOnChild;
            let scopeListener = event => { currentScopeOnScope = event.currentScope; }
            let childListener = event => { currentScopeOnChild = event.currentScope; }

            scope.$on('someEvent', scopeListener);
            child.$on('someEvent', childListener);

            scope.$broadcast('someEvent');

            expect(currentScopeOnScope).toBe(scope);
            expect(currentScopeOnChild).toBe(child);
        });

        it('sets currentScope to null after propagation on $emit', () => {
            let event;
            let scopeListener = evt => { event = evt; };

            scope.$on('someEvent', scopeListener);

            scope.$emit('someEvent');

            expect(event.currentScope).toBeNull();
        });

        it('sets currentScope to null after propagation on $broadcast', () => {
            let event;
            let scopeListener = evt => { event = evt; };

            scope.$on('someEvent', scopeListener);

            scope.$broadcast('someEvent');

            expect(event.currentScope).toBeNull();
        });

        it('does not propagate to parents when stopped', () => {
            let scopeListener = event => event.stopPropagation();
            let parentListener = jasmine.createSpy('');

            scope.$on('someEvent', scopeListener);
            parent.$on('someEvent', parentListener);

            scope.$emit('someEvent');

            expect(parentListener).not.toHaveBeenCalled();
        });

        it('is received by listeners on current scope after being stopped', () => {
            let listener1 = event => event.stopPropagation();
            let listener2 = jasmine.createSpy('');

            scope.$on('someEvent', listener1);
            scope.$on('someEvent', listener2);

            scope.$emit('someEvent');

            expect(listener2).toHaveBeenCalled();
        });
    });
});