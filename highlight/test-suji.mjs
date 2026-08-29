// Sanity check for the Suji highlight.js definition:
//
//   node highlight/test-suji.mjs
//
// Each case lists token classes that must appear and classes that must not, so
// regressions such as the pipeline operator being parsed as a lambda parameter
// list (which used to swallow the rest of the snippet) fail loudly.
import hljs from 'highlight.js/lib/core';
import suji from './suji.js';

hljs.registerLanguage('suji', suji);

const cases = [
  {
    label: 'lambda params',
    code: 'double = |x| x * 2',
    // the two delimiting pipes plus `=` and `*`
    want: ['operator'],
    minimum: { operator: 4 },
    reject: ['params'],
  },
  {
    label: 'lambda default',
    code: 'greet = |name = "World"| "Hi ${name}"',
    want: ['operator', 'string'],
    reject: ['params'],
  },
  {
    label: 'logical or',
    code: 'ok = a || b',
    reject: ['params'],
  },
  {
    label: 'shell pipeline',
    code: 'r = producer() | `grep x` | consume()',
    want: ['string', 'operator'],
    reject: ['params'],
  },
  {
    label: 'match alternatives',
    code: 'r = match n {\n    1 | 2 => "small",\n    _ => "big",\n}',
    want: ['keyword', 'number', 'string'],
    reject: ['params'],
  },
  {
    label: 'pipe apply',
    code: 'r = 5 |> double\nl = double <| 5',
    want: ['operator'],
    reject: ['params'],
  },
  {
    label: 'division not regex',
    code: 'half = total/2\nspaced = total / 2',
    want: ['number'],
    reject: ['regexp'],
  },
  {
    label: 'regex literal',
    code: 'ok = "a@b.c" ~ /^[^@]+@[^@]+$/',
    want: ['regexp', 'string'],
  },
  {
    label: 'interpolation in all string forms',
    code: 'a = "d ${x}"\nb = \'d ${x}\'\nc = """t ${x}"""\nd = \'\'\'t ${x}\'\'\'',
    want: ['string', 'subst'],
    // one subst per string form
    minimum: { subst: 4 },
  },
  {
    label: 'loop through',
    code: 'loop through xs with x {\n    println(x)\n}',
    want: ['keyword'],
  },
  {
    label: 'import',
    code: 'import std:println\nimport std:json as j',
    want: ['keyword', 'title'],
    reject: ['variable'],
  },
  {
    label: 'bare identifiers stay unclassed',
    code: 'x = foo(bar)\ntotal = items::map(|i| i * 2)',
    reject: ['variable'],
  },
  {
    label: 'map literal and access',
    code: 'config = { name: "App", "port": 8080 }\nt = config:name',
    want: ['attr', 'string', 'number'],
  },
  {
    label: 'call sites and method receivers',
    code: 'total = items::length()\nprintln(greet(name))',
    // `items` precedes `::`, so it is a receiver rather than a map key
    want: ['built_in', 'operator'],
    reject: ['attr'],
    minimum: { built_in: 3 },
  },
  {
    label: 'comment with slash and pipe',
    code: '# a comment with a / slash and | pipe\nx = 1',
    want: ['comment', 'number'],
    reject: ['regexp', 'params'],
  },
];

function classesOf(html) {
  const counts = {};
  for (const m of html.matchAll(/class="hljs-([a-z_]+)"/g)) {
    counts[m[1]] = (counts[m[1]] || 0) + 1;
  }
  return counts;
}

let failures = 0;
for (const c of cases) {
  const result = hljs.highlight(c.code, { language: 'suji' });
  const counts = classesOf(result.value);
  const problems = [];

  if (result.illegal) problems.push('rejected as illegal');
  for (const cls of c.want || []) {
    if (!counts[cls]) problems.push(`missing .hljs-${cls}`);
  }
  for (const cls of c.reject || []) {
    if (counts[cls]) problems.push(`unexpected .hljs-${cls}`);
  }
  for (const [cls, n] of Object.entries(c.minimum || {})) {
    if ((counts[cls] || 0) < n) {
      problems.push(`expected at least ${n} .hljs-${cls}, got ${counts[cls] || 0}`);
    }
  }

  if (problems.length) {
    failures++;
    console.log(`FAIL ${c.label}: ${problems.join('; ')}`);
  } else {
    console.log(`ok   ${c.label}`);
  }
}

console.log(`\ncases: ${cases.length}  failing: ${failures}`);
process.exit(failures ? 1 : 0);
