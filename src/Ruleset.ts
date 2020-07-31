
export interface Phrase {
    readonly tag: string;
    readonly rank?: number;
}

export type Merger<T extends Phrase, L extends T = any, R extends T = any>
    = (lhs: Phrase | L, rhs: Phrase | R) => readonly T[];

export interface Rule<T extends Phrase, L extends T = any, R extends T = any> {
    readonly lhs: L['tag'];
    readonly rhs: R['tag'];
    readonly merge: Merger<T>;
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

const newRhsMap = () => new Map<string, Merger<any>[]>();
const newMergerArray = () => [] as Merger<any>[];

export class Ruleset<BasePhrase extends Phrase> {
    private readonly map = new Map<string, Map<string, Merger<BasePhrase>[]>>();

    private getMergers(lhs: string, rhs: string): Merger<BasePhrase>[] {
        return computeIfMissing(computeIfMissing(this.map, lhs, newRhsMap), rhs, newMergerArray);
    }

    public constructor(rules: readonly Rule<BasePhrase>[] = []) {
        this.add(rules);
    }

    public add(rules: readonly Rule<BasePhrase>[]): void {
        for (const rule of rules) {
            this.getMergers(rule.lhs, rule.rhs).push(rule.merge);
        }
    }

    public merge(lhs: BasePhrase, rhs: BasePhrase): BasePhrase[] {
        return this.getMergers(lhs.tag, rhs.tag).flatMap(merger => merger(lhs, rhs));
    }
}
