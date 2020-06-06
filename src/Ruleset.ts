
export interface Phrase {
    readonly tag: string;
}

export type Merger<L extends Phrase = any, R extends Phrase = any> = (lhs: Phrase | L, rhs: Phrase | R) => readonly Phrase[];

export interface Rule<L extends Phrase = any, R extends Phrase = any> {
    readonly lhs: L['tag'];
    readonly rhs: R['tag'];
    readonly merge: Merger;
}

const computeIfMissing = <T>(map: Map<string, T>, key: string, generator: () => T) => {
    const found = map.get(key);
    if (found !== undefined) {
        return found;
    }
    const computed = generator();
    map.set(key, computed);
    return computed;
};

const newRhsMap = () => new Map<string, Merger[]>();
const newMergerArray = () => [] as Merger[];

export class Ruleset {
    private readonly map = new Map<string, Map<string, Merger[]>>();

    private getMergers(lhs: string, rhs: string): Merger[] {
        return computeIfMissing(computeIfMissing(this.map, lhs, newRhsMap), rhs, newMergerArray);
    }

    public constructor(rules: readonly Rule[] = []) {
        this.add(rules);
    }

    public add(rules: readonly Rule[]): void {
        for (const rule of rules) {
            this.getMergers(rule.lhs, rule.rhs).push(rule.merge);
        }
    }

    public merge(lhs: Phrase, rhs: Phrase): Phrase[] {
        return this.getMergers(lhs.tag, rhs.tag).flatMap(merger => merger(lhs, rhs));
    }
}
