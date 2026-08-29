// Import highlight.js core
import hljs from 'highlight.js/lib/core';

// Import Suji language definition
import suji from './suji.js';

// Import commonly used languages
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import ini from 'highlight.js/lib/languages/ini';
import toml from 'highlight.js/lib/languages/ini'; // Use ini for toml
import markdown from 'highlight.js/lib/languages/markdown';

// Register all languages
hljs.registerLanguage('suji', suji);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('toml', toml);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);

// Register 'si' as an alias for 'suji'
hljs.registerAliases(['si'], { languageName: 'suji' });

// Make hljs available globally (only if not already defined by mdBook's default)
if (!window.hljs) {
  window.hljs = hljs;
}

// Initialize highlighting on page load using the modern API
document.addEventListener('DOMContentLoaded', () => {
  hljs.highlightAll();
});

