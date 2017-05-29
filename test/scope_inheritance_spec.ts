/**
 * Created by LCsaba on 17/05/29.
 */
/// <reference path="..\typings\index.d.ts" />
/// <reference path="..\src\angular.ts" />

describe('Scope', () => {
    describe('inheritance', () => {
        it('inherits the parent\'s properties', () => {
            let parent: IScopeExt = new Scope();
            parent.aValue = [1, 2, 3];
            let child: IScopeExt = parent.$new();

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it('does not cause a parent to inherit its properties', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();
            child.aValue = [1, 2, 3];

            expect(parent.aValue).toBeUndefined();
        });

        it('inherits the parents properties whenever they are defined', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();
            parent.aValue = [1, 2, 3];

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it('can manipulate a parent scopes property', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();
            parent.aValue = [1, 2, 3];
            child.aValue.push(4);
            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it('can watch a property in the parent', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();
            parent.aValue = [1, 2, 3];
            child.counter = 0;
            child.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++,
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
            let aa: IScopeExt = a.$new();
            let aaa: IScopeExt = aa.$new();
            let aab: IScopeExt = aa.$new();
            let ab: IScopeExt = a.$new();
            let abb: IScopeExt = ab.$new();
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
            let child: IScopeExt = parent.$new();

            parent.name = 'Joe';
            child.name = 'Jill';

            expect(child.name).toBe('Jill');
            expect(parent.name).toBe('Joe');
        });

        it('does not shadow members of parent scopes attributes', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();

            parent.user = { name: 'Joe' };
            child.user.name = 'Jill';

            expect(child.user.name).toBe('Jill');
            expect(parent.user.name).toBe('Jill');
        });

        it('does not digest its parent(s)', function() {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();
            parent.aValue = 'abc';
            parent.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.aValueWas = newValue
            );
            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it('keeps a record of its children', () => {
            let parent: IScopeExt = new Scope();
            let child1: IScopeExt = parent.$new();
            let child2: IScopeExt = parent.$new();
            let child2_1: IScopeExt = child2.$new();

            expect(parent.$$children.length).toBe(2);
            expect(parent.$$children[0]).toBe(child1);
            expect(parent.$$children[1]).toBe(child2);
            expect(child1.$$children.length).toBe(0);
            expect(child2.$$children.length).toBe(1);
            expect(child2.$$children[0]).toBe(child2_1);
        });

        it('digests its children', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();

            parent.aValue = 'abc';
            child.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.aValueWas = newValue
            );
            parent.$digest();
            expect(child.aValueWas).toBe('abc');
        });

        it('digests from root on $apply', () => {
            let parent: IScopeExt = new Scope();
            let child = parent.$new();
            let child2 = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );
            child2.$apply((scope) => {});

            expect(parent.counter).toBe(1);
        });

        it('schedules a digest from root on $evalAsync', (done) => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();
            let child2: IScopeExt = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );
            child2.$evalAsync((scope: IScopeExt) => {});

            setTimeout(() => {
                expect(parent.counter).toBe(1);
                done();
            });
        });

        it('does not have access to parent attributes when isolated', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);

            parent.aValue = 'abc';

            expect(child.aValue).toBeUndefined();
        });

        it('cannot watch parent attributes when isolated', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);

            parent.aValue = 'abc';
            child.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.aValueWas = newValue
            );

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it('digests from root on $apply when isolated', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);
            let child2: IScopeExt = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );
            child2.$apply(() => {});
            expect(parent.counter).toBe(1);
        });

        it('schedules a digest from root on $evalAsync when isolated', (done) => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);
            let child2: IScopeExt = child.$new();

            parent.aValue = 'abc';
            parent.counter = 0;
            parent.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++
            );
            child2.$evalAsync((scope: IScopeExt) => {});

            setTimeout(() => {
                expect(parent.counter).toBe(1);
                done();
            }, 50);
        });

        it('executes $evalAsync functions on isolated scopes', (done) => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);

            child.$evalAsync((scope) => scope.didEvalAsync = true);

            setTimeout(() => {
                expect(child.didEvalAsync).toBe(true);
                done();
            }, 50);
        });

        it('executes $$postDigest functions on isolated scopes', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);

            child.$$postDigest(() => child.didPostDigest = true);
            parent.$digest();
            expect(child.didPostDigest).toBe(true);
        });

        it('executes $applyAsync functions on isolated scopes', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new(true);
            let applied = false;

            parent.$applyAsync(() => applied = true);
            child.$digest();
            expect(applied).toBe(true);
        });

        it('can take some other scope as the parent', () => {
            let prototypeParent: IScopeExt = new Scope();
            let hierarchyParent: IScopeExt = new Scope();
            let child: IScopeExt = prototypeParent.$new(false, hierarchyParent);

            prototypeParent.a = 42;
            expect(child.a).toBe(42);

            child.counter = 0;
            child.$watch((scope: IScopeExt) => {scope.counter++;});

            prototypeParent.$digest();
            expect(child.counter).toBe(0);

            hierarchyParent.$digest();
            expect(child.counter).toBe(2);
        });

        it('is no longer digested when $destroy has been called', () => {
            let parent: IScopeExt = new Scope();
            let child: IScopeExt = parent.$new();

            child.aValue =[1, 2, 3];
            child.counter = 0;
            child.$watch(
                (scope: IScopeExt) => scope.aValue,
                (newValue, oldValue, scope: IScopeExt) => scope.counter++,
                true
            );

            parent.$digest();
            expect(child.counter).toBe(1);

            child.aValue.push(4);
            parent.$digest();
            expect(child.counter).toBe(2);

            child.$destroy();
            child.aValue.push(5);
            parent.$digest();
            expect(child.counter).toBe(2);
        });
    });
});