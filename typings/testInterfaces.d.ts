/**
 * Created by LCsaba on 16/12/19.
 */
/// <reference path="../src/angular.ts" />

interface IScopeExt extends IScope {
    a?: any;
    anotherValue?: any;
    aProperty?: any;
    array?: any;
    arrayLike?: object;
    asyncApplied?: boolean;
    asyncEvaluated?: boolean;
    asyncEvaluatedImmediately?: boolean;
    asyncEvaluatedTimes?: number;
    aValue?: any;
    aValueWas?: any;
    counter?: number;
    counterA?: number;
    counterB?: number;
    didEvalAsync?: boolean;
    didPostDigest?: boolean;
    initial?: any;
    name?: any;
    nameUpper?: any;
    number?: number;
    obj: any;
    phaseInApplyFunction?: any;
    phaseInListenerFunction?: any;
    phaseInWatchFunction?: any;
    someValue?: any;
    user?: any;
    value?: any;
    watchedValue?: any;
}