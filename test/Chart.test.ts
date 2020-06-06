import { Chart } from '../src/Chart';
import { Phrase, Ruleset } from '../src/Ruleset';
import has = Reflect.has;

interface Token extends Phrase {
    orth: string;
}

interface ComplexPhrase extends Phrase {
    head: Phrase;
    mod: Phrase;
}

type RSA = string | Array<RSA>;

describe('Chart', () => {
    describe('1-rule grammar', () => {
        const ruleset = new Ruleset([
            {
                lhs: 'hello',
                rhs: 'world',
                merge: (lhs, rhs) => [{ tag: 'greeting', text: 'Hello, World!' }],
            },
        ]);
        const helloToken = { tag: 'hello' };
        const worldToken = { tag: 'world' };

        test('Hello world', () => {
            const chart = new Chart(ruleset);
            chart.add(helloToken);
            expect(chart.parse()).toEqual([expect.objectContaining({ tag: 'hello' })]);
            chart.add(worldToken);
            expect(chart.parse()).toEqual([expect.objectContaining({ tag: 'greeting' })]);
        });

        test('World hello', () => {
            expect(new Chart(ruleset).add(worldToken).add(helloToken).parse())
                .toEqual([]);
        });
    });

    describe('baby english', () => {
        const __in = (place: string, thing: string): string => `[${thing} [in ${place}]]`;
        const __on = (place: string, thing: string): string => `[${thing} [on ${place}]]`;
        const __a_dog = '[dog a]';
        const __a_car = '[car a]';
        const __a_house = '[house a]';
        const __a_hill = '[hill a]';
        const print = (phrase: Phrase | Token | ComplexPhrase) => {
            if ('orth' in phrase) {
                return phrase.orth;
            } else if ('head' in phrase) {
                return `[${print(phrase.head)} ${print(phrase.mod)}]`;
            } else {
                return '[??]';
            }
        };
        const hasMod = (tag: string, phrase: Phrase | ComplexPhrase) => {
            while ('mod' in phrase) {
                if (phrase.mod.tag === tag) {
                    return true;
                } else {
                    phrase = phrase.head;
                }
            }
            return false;
        };
        const noun = 'N';
        const prep = 'P';
        const det = 'D';
        const _a = { tag: det, orth: 'a' };
        const _car = { tag: noun, orth: 'car' };
        const _dog = { tag: noun, orth: 'dog' };
        const _house = { tag: noun, orth: 'house' };
        const _hill = { tag: noun, orth: 'hill' };
        const _in = { tag: prep, orth: 'in' };
        const _on = { tag: prep, orth: 'on' };

        const babyEnglish = new Ruleset([
            {
                lhs: det,
                rhs: noun,
                merge: (DP: Phrase | ComplexPhrase, NP: Phrase | ComplexPhrase) =>
                    !hasMod(det, NP) ? [{ tag: noun, head: NP, mod: DP }] : [],
            },
            {
                lhs: prep,
                rhs: noun,
                merge: (PP: Phrase | ComplexPhrase, NP: Phrase | ComplexPhrase) =>
                    hasMod(det, NP) && !hasMod(noun, PP) ?
                        [{ tag: prep, head: PP, mod: NP }] : [],
            },
            {
                lhs: noun,
                rhs: prep,
                merge: (NP: Phrase | ComplexPhrase, PP: Phrase | ComplexPhrase) =>
                    hasMod(det, NP) && hasMod(noun, PP) ?
                        [{ tag: noun, head: NP, mod: PP }] : [],
            },
        ]);

        const parse = (...tokens: Token[]) =>
            tokens.reduce(
                (chart, tok) => chart.add(tok),
                new Chart(babyEnglish),
            ).parse();

        test('a car: 1', () => {
            const result = parse(_a, _car);
            expect(result).toEqual([{ tag: 'N', head: _car, mod: _a }]);
            expect(result.map(print)).toEqual([__a_car]);
        });

        test('a a car: 0', () => {
            expect(parse(_a, _a, _car)).toEqual([]);
        });

        test('a dog in a house: 1', () => {
            expect(parse(_a, _dog, _in, _a, _house).map(print))
                .toEqual([__in(__a_house, __a_dog)]);
        });

        test('a dog in a car in a house: 2', () => {
            const result = parse(_a, _dog, _in, _a, _car, _in, _a, _house).map(print);
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining([
                __in(__in(__a_house, __a_car), __a_dog), // 1 2
                __in(__a_house, __in(__a_car, __a_dog)), // 2 1
            ]));
        });

        test('a dog in a car in a house on a hill: 5', () => {
            const result = parse(_a, _dog, _in, _a, _car, _in, _a, _house, _on, _a, _hill).map(print);
            expect(result).toHaveLength(5);
            expect(result).toEqual(expect.arrayContaining([
                __on(__a_hill, __in(__a_house, __in(__a_car, __a_dog))), // 1 2 3
                __on(__a_hill, __in(__in(__a_house, __a_car), __a_dog)), // 2 1 3
                __in(__on(__a_hill, __in(__a_house, __a_car)), __a_dog), // 2 3 1
                __in(__on(__a_hill, __a_house), __in(__a_car, __a_dog)), // 1 3 2 and 3 1 2
                __in(__in(__on(__a_hill, __a_house), __a_car), __a_dog), // 3 2 1
            ]));
        });
    });
});
