import { Phrase, Ruleset } from './Ruleset';

interface Item {
    readonly start: number;
    readonly end: number;
    readonly phrase: Phrase;
}

class Position {
    public asStart: Item[] = [];
    public asEnd: Item[] = [];
}

export class Chart {
    private readonly ruleset: Ruleset;
    private itemsWith: Position[] = [new Position()];
    private whole: Phrase[] = [];
    private agenda: Item[] = [];

    private addItem(item: Item) {
        this.itemsWith[item.start].asStart.push(item);
        this.itemsWith[item.end].asEnd.push(item);
        if (item.start === 0 && item.end === this.itemsWith.length - 1) {
            this.whole.push(item.phrase);
        }
    }

    private tryToMerge(lhs: Item, rhs: Item) {
        for (const merger of this.ruleset.merge(lhs.phrase, rhs.phrase)) {
            this.agenda.push({
                start: lhs.start,
                end: rhs.end,
                phrase: merger,
            });
        }
    }

    public constructor(ruleset: Ruleset) {
        this.ruleset = ruleset;
    }

    public add(phrase: Phrase): Chart {
        const item = {
            start: this.itemsWith.length - 1,
            end: this.itemsWith.length,
            phrase,
        };
        this.itemsWith.push(new Position());
        this.whole = [];
        this.agenda.push(item);
        return this;
    }

    public parse(): Phrase[] {
        let item: Item | undefined;
        // eslint-disable-next-line no-cond-assign
        while (item = this.agenda.pop()) {
            this.addItem(item);
            for (const lhs of this.itemsWith[item.start].asEnd) {
                this.tryToMerge(lhs, item);
            }
            for (const rhs of this.itemsWith[item.end].asStart) {
                this.tryToMerge(item, rhs);
            }
        }
        return this.whole;
    }
}
