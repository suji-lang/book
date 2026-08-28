/*
Language: Suji
Description: The Suji programming language - a dynamically typed scripting language
Author: Suji Contributors
Website: https://github.com/suji-lang/suji
Category: scripting
*/

export default function(hljs) {
  const KEYWORDS = {
    keyword: [
      'import', 'export', 'return', 'match', 'loop', 'through', 'with',
      'as', 'break', 'continue'
    ],
    literal: [
      'true', 'false', 'nil'
    ],
    built_in: [
      // Core standard library
      'std', 'println', 'print',
      // Data format modules
      'json', 'yaml', 'toml', 'csv',
      // System modules
      'io', 'env', 'os', 'path',
      // Utility modules
      'random', 'time', 'uuid', 'encoding', 'math', 'crypto', 'dotenv'
    ]
  };

  const NUMBER = {
    className: 'number',
    variants: [
      { begin: '\\b\\d+(\\.\\d+)?\\b' }
    ],
    relevance: 0
  };

  const STRING_INTERPOLATION = {
    className: 'subst',
    begin: '\\$\\{',
    end: '\\}',
    keywords: KEYWORDS,
    contains: []  // will be filled later
  };

  // All four string forms support ${...} interpolation. The triple-quoted
  // variants must be listed first so that """ is not scanned as an empty "".
  const STRING = {
    className: 'string',
    variants: [
      { // Triple-quoted multiline strings
        begin: '"""',
        end: '"""',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          STRING_INTERPOLATION
        ]
      },
      {
        begin: "'''",
        end: "'''",
        contains: [
          hljs.BACKSLASH_ESCAPE,
          STRING_INTERPOLATION
        ]
      },
      {
        begin: '"',
        end: '"',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          STRING_INTERPOLATION
        ]
      },
      {
        begin: "'",
        end: "'",
        contains: [
          hljs.BACKSLASH_ESCAPE,
          STRING_INTERPOLATION
        ]
      }
    ]
  };

  // Regex literals have no flags in Suji. The lookahead requires a closing
  // slash on the same line so that a division such as `a/b` is not mistaken for
  // the start of a regex (which would mis-colour the rest of the snippet).
  const REGEX = {
    className: 'regexp',
    begin: '/(?![\\s*/=])(?=[^\\n]*[^\\\\\\n]/)',
    end: '/',
    contains: [
      hljs.BACKSLASH_ESCAPE,
      {
        begin: '\\[',
        end: '\\]',
        relevance: 0,
        contains: [hljs.BACKSLASH_ESCAPE]
      }
    ]
  };

  const SHELL_COMMAND = {
    className: 'string',
    begin: '`',
    end: '`',
    contains: [STRING_INTERPOLATION]
  };

  const COMMENT = {
    className: 'comment',
    begin: '#',
    end: '$',
    contains: [
      hljs.PHRASAL_WORDS_MODE,
      {
        className: 'doctag',
        begin: '(?:TODO|FIXME|NOTE|BUG|HACK|XXX):',
        relevance: 0
      }
    ]
  };

  // Lambda parameter lists such as `|a, b = 1|` get no mode of their own: the
  // delimiting pipes are ordinary operators and the names ordinary identifiers,
  // which is how suji-lang.org paints them. Scanning them as a single span was
  // also what used to let a pipeline (`producer() | `grep x``) or a `||` swallow
  // the rest of a snippet while hunting for a closing pipe.
  const OPERATORS = {
    className: 'operator',
    begin: /(\|>|<\||>>|<<|\||~|!~|::|\.\.|\.\.=|=>|&&|\|\||[+\-*\/%^]=?|[!=<>]=?)/,
    relevance: 0
  };

  // A single colon marks a map key or a module qualifier (`config:name`,
  // `io:open`). The negative lookahead keeps the receiver of a method call
  // (`list::length()`) out of it.
  const MAP_KEY = {
    className: 'attr',
    begin: /[a-zA-Z_][a-zA-Z0-9_]*(?=\s*:(?!:))/,
    relevance: 0
  };

  // Call sites, so user-defined functions read like the stdlib ones
  const CALL = {
    className: 'built_in',
    begin: /[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
    relevance: 0
  };

  // Bare identifiers carry no class: they render in the base text colour, and
  // the mode exists only to consume the word so that MAP_KEY and OPERATORS
  // cannot match inside it. Classing them as `variable` would tint every name
  // in a program red, since that is the colour the themes give that class.
  const IDENTIFIER = {
    begin: /[a-zA-Z_][a-zA-Z0-9_]*/,
    relevance: 0
  };

  // Fill in STRING_INTERPOLATION.contains now that all modes are defined
  STRING_INTERPOLATION.contains = [
    NUMBER,
    STRING,
    REGEX,
    SHELL_COMMAND,
    OPERATORS,
    MAP_KEY,
    CALL,
    IDENTIFIER
  ];

  return {
    name: 'Suji',
    aliases: ['suji', 'si'],  // Support both 'suji' and 'si' code fence identifiers
    keywords: KEYWORDS,
    contains: [
      COMMENT,
      STRING,
      REGEX,
      SHELL_COMMAND,
      NUMBER,
      OPERATORS,
      MAP_KEY,
      CALL,
      {
        // Match expressions
        beginKeywords: 'match',
        end: /\{/,
        excludeEnd: true,
        keywords: KEYWORDS,
        contains: [COMMENT, STRING, NUMBER, OPERATORS, CALL, IDENTIFIER]
      },
      {
        // Loop expressions
        beginKeywords: 'loop',
        keywords: KEYWORDS,
        contains: [
          COMMENT,
          STRING,
          NUMBER,
          {
            begin: /through/,
            keywords: 'through with as'
          }
        ]
      },
      {
        // Import/export
        beginKeywords: 'import export',
        end: /$/,
        keywords: KEYWORDS,
        contains: [
          {
            className: 'title',
            begin: /[a-zA-Z_][a-zA-Z0-9_:]*/
          }
        ]
      },
      IDENTIFIER
    ]
  };
}

