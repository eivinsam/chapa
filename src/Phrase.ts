
const emptyPhraseList = Object.freeze<Phrase>([]);

export class Phrase {
    readonly rank?: number;

    constructor(rank?: number) {
        this.rank = rank;
    }

    mergeLeft(lhs: Phrase): readonly Phrase[] { return emptyPhraseList; }
    mergeRight(rhs: Phrase): readonly Phrase[] { return emptyPhraseList; }
}
