/**
 * Created by LCsaba on 16/12/19.
 */
/// <reference path="../src/angular.ts" />

interface IScopeExt extends IScope {
    aProperty?: any;
    counter?: number;
    counterA?: number;
    counterB?: number;
    someValue?: any;
    name?: any;
    nameUpper?: any;
    initial?: any;
    array?: any;
    aValue?: any;
    number?: number;
    asyncEvaluated?: boolean;
    asyncEvaluatedImmediately?: boolean;
    asyncEvaluatedTimes?: number;
    phaseInWatchFunction?: any;
    phaseInListenerFunction?: any;
    phaseInApplyFunction?: any;
    asyncApplied?: boolean;
    watchedValue?: any;
}