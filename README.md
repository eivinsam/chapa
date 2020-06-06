# chapa
A TypeScript ***cha***rt ***pa***rser

A chart parser is extremely flexible, and is able to parse any context-free language, 
including arbitrarily ambiguous ones, and handles both left- and right-recursive rules robustly.
The implementation used here is fairly simple and efficient, 
and should perform well under most circumstances. 
Best-case complexity should be O(*n*log*m*) for *n* input-elements and *m* rules, 
while worst-case complexity som something like O(*n*³log*m*) for extremely ambiguous grammars.

The concept is pretty simple: you define context-free grammar from a bunch of binary rules. 
Each rule is described by the left hand side and right hand side tags to accept, 
and a function that produces an array of new Phrases from combining adjacent phrases with those tags, for example:  
```js
const ruleset = new Ruleset([{
    lhs: 'foo',
    rhs: 'bar',
    // will always produce ['foo×bar']
    merge: (lhs, rhs) => [{ tag: `${lhs.tag}×${rhs.tag}` }, { tag: 'another' }], 
}]);
```

You then create a Chart with that Ruleset, and feed it with a stream of tagged phrases ie. tokens:
```js
const chart = new Chart(ruleset);
chart.add({ tag: 'foo' });
chart.add({ tag: 'bar' });
```

At any point you can ask for a parse of the input so far, 
returning all produced phrases that cover all of the input:
```js
console.log(chart.parse()); // [{ tag: 'foo×bar' }, { tag: 'another' }]
console.log(chart.parse()); // [{ tag: 'foo×bar' }, { tag: 'another' }]
chart.add({ tag: 'baz' });
console.log(chart.parse()); // []
// There are no rules for combining any of 
//   'bar' + 'baz', 
//   'foo×bar' + 'baz' , or 
//   'another' + 'baz'
```

Phrases will never be modified, copied or created by the library itself, 
so it is safe to add any information needed to these objects in order for 
the merge functions to produce whatever needed, and for the output to be useful.