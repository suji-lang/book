# Hello World

Let's write your first Suji program and understand it step by step.

## Your First Program

Create a file called `hello.si`:

```suji
import std:println
println("Hello, World!")
```

Run it:

```bash
suji hello.si
```

Output:
```
Hello, World!
```

Congratulations! You've just written and run your first Suji program!

## Breaking It Down

Let's understand what each part does:

### Line 1: Import Statement

```suji
import std:println
```

This line imports the `println` function from Suji's standard library. In Suji:
- `std` is the standard library module
- The colon `:` is used to access nested modules or functions
- `println` is a function that prints text followed by a newline

**Why do we need to import?** Suji keeps the global namespace clean. You explicitly import only what you need.

### Line 2: Print Statement

The second line, `println("Hello, World!")`, calls the `println` function with
the string `"Hello, World!"` as an argument.
- Strings in Suji are enclosed in double quotes `"` or single quotes `'`
- Function calls use parentheses: `function_name(arguments)`
- `println` adds a newline character after printing

## Variations

### Using Single Quotes

```suji
import std:println
println('Hello, World!')
```

Single quotes and double quotes behave identically, including for interpolation.

### Using print (No Newline)

```suji
import std:print
print("Hello, ")
print("World!")
```

Output:
```
Hello, World!
```

The `print` function doesn't add a newline, so both calls print on the same line.

### Multiple Imports

```suji
import std:print
import std:println

print("Hello, ")
println("World!")
```

You can import multiple functions with separate import statements.

## Adding Variables

Let's make it more interactive:

```suji
import std:println

name = "Alice"
println("Hello, ${name}!")
```

Output:
```
Hello, Alice!
```

**What's new?**
- `name = "Alice"` creates a variable called `name`
- `${name}` is **string interpolation** - it inserts the value of `name` into the string
- Interpolation works in single-quoted, double-quoted and triple-quoted strings
  alike, and `${...}` can hold any expression

## Creating a Function

Let's turn our greeting into a reusable function:

```suji
import std:println

greet = |name| {
    "Hello, ${name}!"
}

message = greet("Alice")
println(message)
```

Output:
```
Hello, Alice!
```

**Understanding the function:**
- `greet = |name| { ... }` defines a function called `greet`
- `|name|` declares the parameter list (between pipe characters `|`)
- The function body is in braces `{ }`
- The last expression in a function is automatically returned
- `greet("Alice")` calls the function with "Alice" as the argument

## A More Complete Example

Here's a program that demonstrates multiple concepts:

```suji
import std:println

# Function to create a greeting
greet = |name, language| {
    match language {
        "english" => "Hello, ${name}!",
        "spanish" => "¡Hola, ${name}!",
        "french" => "Bonjour, ${name}!",
        _ => "Hi, ${name}!",
    }
}

# Use the function
names = ["Alice", "Bob", "Charlie"]

loop through names with name {
    message = greet(name, "english")
    println(message)
}
```

Output:
```
Hello, Alice!
Hello, Bob!
Hello, Charlie!
```

**What's happening?**
1. We define a `greet` function that takes two parameters
2. We use `match` to choose a greeting based on the language
3. Every arm ends with a comma — including the last one, which is required
   whenever an arm's body is a plain expression
4. We create a list of names, loop through it, and print each greeting

## Common Beginner Mistakes

### Mistake 1: Forgetting to Import

Nothing at all is available without an import — there is no prelude:

```suji
# println("Hello")
#
# [401] Error: Undefined variable
#        Variable 'println' is not defined

import std:println

println("Hello")
```

### Mistake 2: Leaving Off the Last Comma in a `match`

```suji
import std:println

# This does NOT parse, because the final arm's body is a bare expression:
#
# label = match 1 {
#     1 => "one",
#     _ => "many"
# }

label = match 1 {
    1 => "one",
    _ => "many",
}

println(label)  # one
```

An arm whose body is a `{ ... }` block may omit the comma; an arm whose body is
an expression may not.

### Mistake 3: Missing Quotes

```suji
import std:println

# println(Hello)
#
# [401] Error: Undefined variable — `Hello` is read as a variable name

println("Hello")
```

### Mistake 4: Reaching for `if`

Suji has no `if`, `else`, `for` or `while` keywords. Conditions are `match`
expressions and iteration is `loop`:

```suji
import std:println

temperature = 30

# if temperature > 25 { ... }   <- not valid Suji

message = match {
    temperature > 25 => "warm",
    _ => "cool",
}

println(message)  # warm
```

### Semicolons Are Optional

Coming from JavaScript or Rust, you may reach for semicolons. They are accepted
as statement separators but never required, and a newline does the same job:

```suji
import std:println

a = 1; b = 2

println(a + b)  # 3
```

## Try It Yourself

### Exercise 1: Personalize It
Modify the program to print your own name:

```suji
import std:println

your_name = "YourName"  # Change this
println("Hello, ${your_name}!")
```

### Exercise 2: Multiple Greetings
Print three different greetings:

```suji
import std:println

name = "Your Name"
# Add code here to print:
# - Good morning, [name]!
# - Good afternoon, [name]!
# - Good evening, [name]!
```

<details>
<summary>Solution</summary>

```suji
import std:println

name = "Alice"
println("Good morning, ${name}!")
println("Good afternoon, ${name}!")
println("Good evening, ${name}!")
```
</details>

### Exercise 3: Create a Function
Write a function that takes a name and returns a farewell message:

```suji
import std:println

farewell = |name| {
    # Your code here — the last expression in the body is the return value
    ""
}

println(farewell("Alice"))  # your version should print: Goodbye, Alice!
```

<details>
<summary>Solution</summary>

```suji
import std:println

farewell = |name| {
    "Goodbye, ${name}!"
}

println(farewell("Alice"))
```
</details>

## What's Next?

Now that you've written your first program, learn more:

- [CLI & REPL](cli-repl.md) - Master the command-line interface and interactive REPL
- [Language Overview](../fundamentals/overview.md) - Understand Suji's design philosophy  
- [Data Types](../fundamentals/data-types/README.md) - Learn about strings, numbers, lists, and more
- [Functions](../functions/basics.md) - Deep dive into function syntax and features

## Quick Reference

Here are the key concepts from this chapter:

| Concept | Syntax | Example |
|---------|--------|---------|
| Import | `import module:function` | `import std:println` |
| String (double quotes) | `"text"` | `"Hello"` |
| String (single quotes) | `'text'` | `'Hello'` |
| String interpolation | `"${variable}"` | `"Hello, ${name}!"` |
| Variable | `name = value` | `name = "Alice"` |
| Function | `name = \|params\| { body }` | `greet = \|n\| "Hi, ${n}!"` |
| Function call | `function(args)` | `println("Hello")` |

Keep experimenting and have fun learning Suji!
