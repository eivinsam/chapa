# chapa
A TypeScript ***cha***rt ***pa***rser

A chart parser is extremely flexible, and is able to parse any context-free language, including arbitrarily ambiguous ones, and handles both left- and right-recursive rules robustly.  The implementation used here is fairly simple and efficient, and should perform well under most circumstances.  Best-case complexity should be O(*n*log*m*) for *n* input-elements and *m* rules, while worst-case complexity som something like O(*n*³log*m*) for extremely ambiguous grammars.

The concept is pretty simple: you define context-free grammar from a bunch of Phrase types.
Each Phrase type describes what rules exist for combining ("merging") it with other Phrases from the left and right side, for example:  
```js
class Foo extends Phrase {}
class Bar extends Phrase {
    mergeLeft(lhs){
        if (lhs instanceof Foo) {
            return [new FooBar()];
        }   
        return super.mergeLeft(lhs);
    }
}
class Baz extends Phrase {}
class FooBar extends Phrase {}
```

You then create a Chart with that Ruleset, and feed it with a stream of Phrases eg. wrapped tokens:
```js
const chart = new Chart(ruleset);
chart.add(new Foo);
chart.add(new Bar);
```

At any point you can ask for a parse of the input so far, returning all produced Phrases that cover all of the input:
```js
console.log(chart.parse()); // [FooBar{}]
console.log(chart.parse()); // [FooBar{}]
chart.add(new Baz);
console.log(chart.parse()); // []
// There are no rules for combining any of 
//   Bar + Baz, or
//   FooBar + Baz
```

A phrase can have an optional field `rank` that describes the quality of the Phrase; lower rank means higher quality.  A Phrase with no rank field is treated as having rank 0.  Produced phrases are handled by rank priority, ie. the lowest rank first, and `parse()` takes an optional argument specifying the highest rank to process. Phrases with too high rank is saved in a priority queue, and can be processed later by calling `parse()` again with higher `maxRank`.  This enables the implementation of probabilistic or otherwise ranking grammars, keeping erroneous Phrases around for error messages in case of no valid parses (as seen in the baby-english tests in `test/Chart.test.ts`), etc.

Phrases will never be modified, copied or created by the library itself.
