/*
  Copyright 2025 Aman Kumar

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/**
 * Represents a node in a Trie (prefix tree).
 */
class TrieNode {
  children: Record<string, TrieNode>;
  isEndOfWord: boolean;

  /**
   * Initializes a new TrieNode.
   * Each node maintains a map of child nodes and a flag indicating whether it's the end of a word.
   */
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

/**
 * Implements a Trie (prefix tree) for efficient word storage and retrieval.
 */
class SearchTrie {
  private _root: TrieNode = new TrieNode();

  /**
   * Inserts a word into the Trie.
   *
   * @param {string} word - The word to be inserted into the Trie.
   */
  insert(word: string): void {
    let node = this._root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  /**
   * Searches for words in the Trie that start with a given prefix.
   *
   * @param {string} prefix - The prefix to search for.
   * @returns {string[]} A list of words that start with the specified prefix.
   */
  search(prefix: string): string[] {
    let node = this._root;
    for (const char of prefix) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }
    return this._collectWords(node, prefix);
  }

  /**
   * Collects all words from a given TrieNode.
   *
   * @param {TrieNode} node - The TrieNode to start collecting words from.
   * @param {string} prefix - The prefix accumulated so far.
   * @returns {string[]} A list of words found in the Trie from the given node.
   */
  private _collectWords(node: TrieNode, prefix: string): string[] {
    let results: string[] = [];

    if (node.isEndOfWord) {
      results.push(prefix);
    }

    for (const char in node.children) {
      results.push(...this._collectWords(node.children[char], prefix + char));
    }

    return results;
  }
}

export default SearchTrie;
