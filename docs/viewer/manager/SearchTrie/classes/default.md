[**pdf-kit v1.5.0**](../../../../README.md)

***

[pdf-kit](../../../../modules.md) / [viewer/manager/SearchTrie](../README.md) / default

# Class: default

Defined in: viewer/manager/SearchTrie.ts:37

Implements a Trie (prefix tree) for efficient word storage and retrieval.

## Constructors

### Constructor

> **new default**(): `SearchTrie`

#### Returns

`SearchTrie`

## Properties

### \_root

> `private` **\_root**: `TrieNode`

Defined in: viewer/manager/SearchTrie.ts:38

## Methods

### \_collectWords()

> `private` **\_collectWords**(`node`, `prefix`): `string`[]

Defined in: viewer/manager/SearchTrie.ts:78

Collects all words from a given TrieNode.

#### Parameters

##### node

`TrieNode`

The TrieNode to start collecting words from.

##### prefix

`string`

The prefix accumulated so far.

#### Returns

`string`[]

A list of words found in the Trie from the given node.

***

### insert()

> **insert**(`word`): `void`

Defined in: viewer/manager/SearchTrie.ts:45

Inserts a word into the Trie.

#### Parameters

##### word

`string`

The word to be inserted into the Trie.

#### Returns

`void`

***

### search()

> **search**(`prefix`): `string`[]

Defined in: viewer/manager/SearchTrie.ts:62

Searches for words in the Trie that start with a given prefix.

#### Parameters

##### prefix

`string`

The prefix to search for.

#### Returns

`string`[]

A list of words that start with the specified prefix.
