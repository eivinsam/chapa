import { Phrase } from './Phrase';
import TinyQueue from 'tinyqueue';

interface Item {
    readonly start: number;
    readonly end: number;
    readonly rank: number; // a memo of (phrase.rank ?? 0)
    readonly phrase: Phrase;
}

class Position {
    public asStart: Item[] = [];
    public asEnd: Item[] = [];
}

const compareItems = (a: Item, b: Item) => a.rank - b.rank;

export class Chart {
    private itemsWith: Position[] = [new Position()];
    private whole: Phrase[] = [];
    private agenda: TinyQueue<Item> = new TinyQueue<Item>([], compareItems);

    private addItem(item: Item) {
        this.itemsWith[item.start].asStart.push(item);
        this.itemsWith[item.end].asEnd.push(item);
        if (item.start === 0 && item.end === this.itemsWith.length - 1) {
            this.whole.push(item.phrase);
        }
    }

    private pushMerger(lhs: Item, rhs: Item, merger: Phrase) {
        this.agenda.push({
            start: lhs.start,
            end: rhs.end,
            rank: merger.rank ?? 0,
            phrase: merger,
        });
    }

    private tryToMerge(lhs: Item, rhs: Item) {
        for (const merger of lhs.phrase.mergeRight(rhs.phrase)) {
            this.pushMerger(lhs, rhs, merger);
        }
        for (const merger of rhs.phrase.mergeLeft(lhs.phrase)) {
            this.pushMerger(lhs, rhs, merger);
        }
    }

    public add(phrase: Phrase): Chart {
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

    public parse(maxRank = Infinity): Phrase[] {
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
