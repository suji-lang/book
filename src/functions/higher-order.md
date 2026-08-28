# Higher-Order Functions

Higher-order functions are functions that take other functions as parameters or return functions as results.

## Overview

Higher-order functions enable powerful abstraction and code reuse by treating functions as first-class values.

## Functions as Parameters

### Basic Example

```suji
import std:println

apply_twice = |fn, x| {
    fn(fn(x))
}

double = |x| x * 2
increment = |x| x + 1

println(apply_twice(double, 3))     # 12 (double(double(3)))
println(apply_twice(increment, 5))  # 7 (increment(increment(5)))
```

### Map

Transform each element in a collection:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
squared = numbers::map(|x| x * x)
println(squared)  # [1, 4, 9, 16, 25]
```

### Filter

Keep only elements that match a predicate:

```suji
import std:println

numbers = [1, 2, 3, 4, 5, 6]
evens = numbers::filter(|x| x % 2 == 0)
println(evens)  # [2, 4, 6]
```

### Fold

Combine elements into a single value with `fold(initial, fn)`. This is the only
reducing method — there is no `list::reduce()`:

```suji
import std:println

numbers = [1, 2, 3, 4, 5]
sum = numbers::fold(0, |acc, x| acc + x)
product = numbers::fold(1, |acc, x| acc * x)

println(sum)      # 15
println(product)  # 120
```

`map`, `filter` and `fold` are the built-in higher-order list methods. Anything else
(`each`, `find`, `any`, `all`, `sort_by`, `group_by`, …) you write yourself with a
`loop through`, as shown below.

## Functions as Return Values

### Function Factories

```suji
import std:println

make_multiplier = |factor| {
    |x| x * factor
}

times_2 = make_multiplier(2)
times_10 = make_multiplier(10)

println(times_2(5))   # 10
println(times_10(5))  # 50
```

### Configurable Functions

```suji
import std:println

create_validator = |min_length, pattern| {
    check = |input| {
        long_enough = input::length() >= min_length
        matches = input ~ pattern
        long_enough && matches
    }
    check
}

validate_username = create_validator(3, /^[a-zA-Z0-9_]+$/)
validate_password = create_validator(8, /^.*[A-Z].*[0-9].*$/)

println(validate_username("abc"))    # true
println(validate_password("Pass1")) # false (too short)
```

## Common Higher-Order Functions

### ForEach

There is no `list::each()`; `loop through` is the way to run a function for every
element, and it wraps up neatly as a helper:

```suji
import std:println

for_each = |list, fn| {
    loop through list with item {
        fn(item)
    }
}

names = ["Alice", "Bob", "Charlie"]
for_each(names, |name| println("Hello, ${name}!"))
```

### Find

`list::find()` does not exist either. Write it with an early `return`:

```suji
import std:println

find = |list, predicate| {
    loop through list with item {
        predicate(item) && return item
    }
    nil
}

numbers = [1, 3, 5, 8, 10]
first_even = find(numbers, |x| x % 2 == 0)
println(first_even)  # 8
```

### Any / All

Same again — `any` and `all` are helpers you define, not methods:

```suji
import std:println

any = |list, predicate| {
    loop through list with item {
        predicate(item) && return true
    }
    false
}

all = |list, predicate| {
    loop through list with item {
        !predicate(item) && return false
    }
    true
}

numbers = [2, 4, 6, 8]
println(any(numbers, |x| x > 5))        # true
println(all(numbers, |x| x % 2 == 0))  # true
```

### Sort By

There is no built-in `list::sort_by()`. If you need ordering by a key, write a small helper.

```suji
import std:println

insert_sorted = |list, item, key_fn| {
    out = []
    inserted = false
    loop through list with existing {
        match { !inserted && key_fn(item) < key_fn(existing) => {
            out::push(item)
            inserted = true
        } }
        out::push(existing)
    }
    match { inserted == false => { out::push(item) } }
    out
}

sort_by = |list, key_fn| {
    result = []
    loop through list with item {
        result = insert_sorted(result, item, key_fn)
    }
    result
}

users = [
    {name: "Alice", age: 30},
    {name: "Bob", age: 25},
    {name: "Charlie", age: 35},
]

by_age = sort_by(users, |u| u:age)
println(by_age[0]:name)  # Bob (youngest)
```

`list::sort()` sorts numbers and strings directly; the helper above is only needed when
you sort by a derived key.

### Group By

Group elements by key function:

```suji
import std:println

group_by = |list, key_fn| {
    result = {}
    loop through list with item {
        key = key_fn(item)
        group = result::get(key, [])
        group::push(item)
        result[key] = group
    }
    result
}

users = [
    {name: "Alice", role: "admin"},
    {name: "Bob", role: "user"},
    {name: "Charlie", role: "admin"},
]

by_role = group_by(users, |u| u:role)
println(by_role:admin::length())  # 2
```

## Function Combinators

### Compose

Combine two functions. Suji has built-in composition operators (`>>` and `<<`), but
writing `compose` by hand shows what they do:

```suji
import std:println

compose = |f, g| {
    |x| f(g(x))
}

add_1 = |x| x + 1
times_2 = |x| x * 2

# (x + 1) * 2
add_then_multiply = compose(times_2, add_1)
println(add_then_multiply(5))  # 12

# The same thing with the operator
println((add_1 >> times_2)(5))  # 12
```

### Pipe

Apply value through functions:

```suji
import std:println

pipe = |x, functions| {
    result = x
    loop through functions with fn {
        result = fn(result)
    }
    result
}

result = pipe(5, [
    |x| x + 1,
    |x| x * 2,
    |x| x ^ 2,
])
println(result)  # 144
```

### Partial

There are no variadic parameters, so a generic `partial` is not expressible. Bind the
known arguments in a closure with the arity you actually need:

```suji
import std:println

add_three = |a, b, c| a + b + c

partial_1 = |fn, first| {
    rest = |b, c| fn(first, b, c)
    rest
}

add_5_and = partial_1(add_three, 5)
println(add_5_and(3, 7))  # 15
```

## Practical Examples

### Data Pipeline

```suji
import std:println

process_data = |data, transformers| {
    result = data
    loop through transformers with transform {
        result = transform(result)
    }
    result
}

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

result = process_data(data, [
    |nums| nums::filter(|x| x % 2 == 0),
    |nums| nums::map(|x| x * x),
    |nums| nums::fold(0, |acc, x| acc + x)
])

println(result)  # 220
```

### Validation Pipeline

```suji
import std:println

validate_all = |value, validators| {
    loop through validators with validator {
        valid, error = validator(value)
        !valid && return false, error
    }
    return true, nil
}

valid, error = validate_all("test@example.com", [
    |v| match { v != nil => (true, nil), _ => (false, "Required"), },
    |v| match { v::length() > 0 => (true, nil), _ => (false, "Not empty"), },
    |v| match { v ~ /@/ => (true, nil), _ => (false, "Invalid email"), },
])

println(valid)  # true
println(error)  # nil
```

### Retry Logic

A function that returns a `(value, error)` pair can be retried by a higher-order
wrapper. Suji has no exceptions, so the wrapped function reports failure in its return
value rather than raising:

```suji
import std:println

retry = |fn, max_attempts| {
    attempt = 1
    loop {
        result, error = fn()
        done = error == nil || attempt >= max_attempts
        done && return result, error
        attempt = attempt + 1
    }
}

# A call that fails the first two times
attempts = 0
flaky = || {
    attempts = attempts + 1
    match {
        attempts < 3 => (nil, "temporary failure"),
        _ => ("payload", nil),
    }
}

result, error = retry(flaky, 5)
println(result)   # payload
println(attempts) # 3
```

## Best Practices

### DO:
- Use higher-order functions for abstraction
- Prefer the built-in methods (`map`, `filter`, `fold`) over hand-written loops
- Name function parameters descriptively
- Keep functions pure when possible
- Use lambdas for simple transformations

### DON'T:
- Overuse higher-order functions
- Create deeply nested function calls
- Ignore performance implications
- Make functions too abstract
- Forget about readability

## See Also

- [Function Basics](basics.md)
- [Closures](closures.md)
- [Function Composition](../fundamentals/operators/composition.md)
- [Lists](../fundamentals/data-types/lists.md)
