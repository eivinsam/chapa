import { Chart } from '../src';
import { Phrase } from '../src';

interface Token extends Phrase {
    readonly orth: string;
}

interface ComplexPhrase extends Phrase {
    readonly head: Phrase;
    readonly mod: Phrase;
    readonly errors: readonly string[];
}

type RSA = string | Array<RSA>;

class Hello extends Phrase {
    mergeRight(rhs: Phrase): readonly Phrase[] {
        if (rhs instanceof World) {
            return [new Greeting('Hello, world!')];
        } else {
            return super.mergeRight(rhs);
        }
    }
}
class World extends Phrase {}
class Greeting extends Phrase {
    readonly text: string;
    constructor(text: string) {
        super();
        this.text = text;
    }
}

const errorIf = (condition: boolean, message: string) => condition ? [message] : [];
const calculateRank = (head: Phrase, mod: Phrase, errors: readonly string[]) =>
    (head.rank ?? 0) + (mod.rank ?? 0) + errors.length;
class Determiner extends Phrase implements Token {
    readonly orth: string;
    constructor(orth: string) {
        super();
        this.orth = orth;
    }
}
class Preposition extends Phrase implements Token {
    readonly orth: string;
    constructor(orth: string) {
        super();
        this.orth = orth;
    }

    mergeRight(rhs: Phrase): readonly Phrase[] {
        if (rhs instanceof NounPhrase) {
            return [new MarkedNoun(this, rhs, errorIf(!rhs.determined, 'Noun phrase is not complete'))];
        }
        return super.mergeRight(rhs);
    }
}
class MarkedNoun extends Phrase implements ComplexPhrase {
    readonly errors: readonly string[];
    readonly head: Phrase;
    readonly mod: Phrase;

    constructor(head: Phrase, mod: Phrase, errors: readonly string[]) {
        super(calculateRank(head, mod, errors));
        this.errors = errors;
        this.head = head;
        this.mod = mod;
    }
}
class NounPhrase extends Phrase {
    readonly determined: boolean;
    constructor(determined: boolean, rank = 0) {
        super(rank);
        this.determined = determined;
    }

    mergeLeft(lhs: Phrase): readonly Phrase[] {
        if (lhs instanceof Determiner) {
            return [new ComplexNoun(this, lhs, errorIf(this.determined, 'Noun already has determiner'))];
        }
        return super.mergeLeft(lhs);
    }
    mergeRight(rhs: Phrase): readonly Phrase[] {
        if (rhs instanceof MarkedNoun) {
            return [new ComplexNoun(this, rhs, errorIf(!this.determined, 'Noun phrase is not complete'))];
        }
        return super.mergeRight(rhs);
    }
}
class Noun extends NounPhrase implements Token {
    readonly orth: string;
    constructor(orth: string) {
        super(false);
        this.orth = orth;
    }
}
class ComplexNoun extends NounPhrase implements ComplexPhrase {
    readonly head: NounPhrase;
    readonly mod: Phrase;
    readonly errors: string[];
    constructor(head: NounPhrase, mod: Phrase, errors: string[]) {
        super(head.determined || mod instanceof Determiner, calculateRank(head, mod, errors));
        this.head = head;
        this.mod = mod;
        this.errors = errors;
    }
}

describe('Chart', () => {
    describe('1-rule grammar', () => {
        const helloToken = new Hello();
        const worldToken = new World();

        test('Hello world', () => {
            const chart = new Chart();
            chart.add(helloToken);
            expect(chart.parse()).toEqual([helloToken]);
            chart.add(worldToken);
            expect(chart.parse()).toEqual([expect.objectContaining({ text: 'Hello, world!' })]);
        });

        test('World hello', () => {
            expect(new Chart().add(worldToken).add(helloToken).parse())
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
                return `${(phrase.rank ?? 0) > 0 ? '*' : ''}[${print(phrase.head)} ${print(phrase.mod)}]`;
            } else {
                return '[??]';
            }
        };
        const noun = 'N';
        const _a = new Determiner('a');
        const _car = new Noun('car');
        const _dog = new Noun('dog');
        const _house = new Noun('house');
        const _hill = new Noun('hill');
        const _in = new Preposition('in');
        const _on = new Preposition('on');

        const parse = (maxRank: number, ...tokens: Token[]) =>
            tokens.reduce(
                (chart, tok) => chart.add(tok),
                new Chart(),
            ).parse(maxRank);

        test('a car: 1', () => {
            const result = parse(Infinity, _a, _car);
            expect(result).toEqual([new ComplexNoun(_car, _a, [])]);
            expect(result.map(print)).toEqual([__a_car]);
        });

        test('a a car: 0', () => {
            expect(parse(0, _a, _a, _car)).toEqual([]);
        });

        test('a a car: 1 error', () => {
            expect(parse(Infinity, _a, _a, _car)).toEqual([
                new ComplexNoun(new ComplexNoun(_car, _a, []), _a, ['Noun already has determiner'])]);
        });

        test('a dog in a house: 1', () => {
            expect(parse(0, _a, _dog, _in, _a, _house).map(print))
                .toEqual([__in(__a_house, __a_dog)]);
        });

        test('a dog in a car in a house: 2', () => {
            const result = parse(0, _a, _dog, _in, _a, _car, _in, _a, _house).map(print);
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining([
                __in(__in(__a_house, __a_car), __a_dog), // 1 2
                __in(__a_house, __in(__a_car, __a_dog)), // 2 1
            ]));
        });

        test('a dog in a car in a house on a hill: 5', () => {
            const result = parse(0, _a, _dog, _in, _a, _car, _in, _a, _house, _on, _a, _hill).map(print);
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
