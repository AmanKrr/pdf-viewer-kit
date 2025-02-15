/**
 * Implements a Trie (prefix tree) for efficient word storage and retrieval.
 */
declare class Trie {
    private root;
    /**
     * Inserts a word into the Trie.
     *
     * @param {string} word - The word to be inserted into the Trie.
     */
    insert(word: string): void;
    /**
     * Searches for words in the Trie that start with a given prefix.
     *
     * @param {string} prefix - The prefix to search for.
     * @returns {string[]} A list of words that start with the specified prefix.
     */
    search(prefix: string): string[];
    /**
     * Collects all words from a given TrieNode.
     *
     * @param {TrieNode} node - The TrieNode to start collecting words from.
     * @param {string} prefix - The prefix accumulated so far.
     * @returns {string[]} A list of words found in the Trie from the given node.
     */
    private collectWords;
}
export default Trie;
