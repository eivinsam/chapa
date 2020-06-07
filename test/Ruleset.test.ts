import { Ruleset } from '../src';

describe('Ruleset', () => {
    const mergeResult = Object.freeze([{ tag: 'ok' }]);
    const testRules = Object.freeze([
        {
            lhs: 'a',
            rhs: 'b',
            merge: (lhs, rhs) => mergeResult,
        },
    ]);
    test('successful lookup', () => {
        expect(new Ruleset(testRules).merge({ tag: 'a' }, { tag: 'b' }))
            .toEqual(mergeResult);
    });

    test('failing lookup due to antisymmetry', () => {
        expect(new Ruleset(testRules).merge({ tag: 'b' }, { tag: 'a' }))
            .toEqual([]);
    });

    test('failing lookup due to missing lhs', () => {
        expect(new Ruleset(testRules).merge({ tag: 'c' }, { tag: 'b' }))
            .toEqual([]);
    });

    test('failing lookup due to missing rhs', () => {
        expect(new Ruleset(testRules).merge({ tag: 'a' }, { tag: 'c' }))
            .toEqual([]);
    });
});
