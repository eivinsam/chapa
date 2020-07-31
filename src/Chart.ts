import { Phrase, Ruleset } from './Ruleset';
import TinyQueue from 'tinyqueue';

interface Item<PT extends Phrase> {
    readonly start: number;
    readonly end: number;
    readonly rank: number; // a memo of (phrase.rank ?? 0)
    readonly phrase: PT;
}

class Position<PT extends Phrase> {
    public asStart: Item<PT>[] = [];
    public asEnd: Item<PT>[] = [];
}

const compareItems = (a: Item<any>, b: Item<any>) => a.rank - b.rank;

export class Chart<PT extends Phrase> {
    private readonly ruleset: Ruleset<PT>;
    private itemsWith: Position<PT>[] = [new Position()];
    private whole: PT[] = [];
    private agenda: TinyQueue<Item<PT>> = new TinyQueue<Item<PT>>([], compareItems);

    private addItem(item: Item<PT>) {
        this.itemsWith[item.start].asStart.push(item);
        this.itemsWith[item.end].asEnd.push(item);
        if (item.start === 0 && item.end === this.itemsWith.length - 1) {
            this.whole.push(item.phrase);
        }
    }

    private tryToMerge(lhs: Item<PT>, rhs: Item<PT>) {
        for (const merger of this.ruleset.merge(lhs.phrase, rhs.phrase)) {
            this.agenda.push({
                start: lhs.start,
                end: rhs.end,
                rank: merger.rank ?? 0,
                phrase: merger,
            });
        }
    }

    public constructor(ruleset: Ruleset<PT>) {
        this.ruleset = ruleset;
    }

    public add(phrase: PT): Chart<PT> {
        const item = {
            start: this.itemsWith.length - 1,
            end: this.itemsWith.length,
            rank: phrase.rank ?? 0,
            phrase,
        };
        this.itemsWith.push(new Position());
        this.whole = [];
        this.agenda.push(item);
        return this;
    }

    public parse(maxRank = Infinity): PT[] {
        for (;;) {
            const item = this.agenda.peek();
            if (!item || item.rank > maxRank) {
                return this.whole;
            } else {
                this.agenda.pop();
            }
            this.addItem(item);
            for (const lhs of this.itemsWith[item.start].asEnd) {
                this.tryToMerge(lhs, item);
            }
            for (const rhs of this.itemsWith[item.end].asStart) {
                this.tryToMerge(item, rhs);
            }
        }
    }
}
