---
title: "Processing a complex syntax with Rust’s declarative macros"
date: 2023-04-17T20:51:02+0200
description: "Declarative macros in Rust are simple, yet their use appears limited. As I realized, with some tricks they can be used on a complex syntax however."
categories:
- rust
---

I am by no means a Rust expert, and I’m no expert on declarative macros. I was merely solving an issue I had: there was a lot of redundancy in the way my error types were coded. I didn’t want to repeat the same coding patterns all the time, yet the types also seemed too heterogenous for declarative macros. And going with procedural macros wasn’t worth the effort in this case.

After some experimentation I figured out how declarative macros could work in this scenario after all. I doubt that this approach is very original, and maybe I solved something in a sub-optimal way. I couldn’t find any helpful online sources however, which is why I’m documenting this in my own article. **Edit**: After publishing this article, I found that the pattern used here is called [TT munching](https://danielkeep.github.io/tlborm/book/pat-incremental-tt-munchers.html).

{{< toc >}}

## A use case for declarative macros

Let’s say you’ve made use of Rust’s great enum types:

```rust
pub enum Color {
    Red,
    Green,
    Blue,
}
```

Your enum is now usable, but it isn’t doing much at this point. In particular, you may want it to implement the `Debug` trait. Luckily, a macro can take care of that:

```rust
#[derive(Debug)]
pub enum Color {
    Red,
    Green,
    Blue,
}
```

Boom, the `Debug` trait is implemented by adding merely one line.

But what if you need some non-default functionality, e.g. a `name()` method?

```rust
impl Color {
    pub fn name(&self) -> &'static str {
        match self {
            Self::Red => "Red",
            Self::Green => "Green",
            Self::Blue => "Blue",
        }
    }
}
```

That’s quite a bit of typing just to turn something already present in the code (a variant name) into a string. And now whenever you add a new color to the enum you’ll have to update the `name()` method as well. Surely this could be simplified?

In fact, it would be possible to generate the `name()` method automatically using a `derive` macro. Such macros are very flexible, but they also introduce significant complexity: not only do you have to put the macro into a different crate, it cannot be implemented without additional dependencies and the code readability isn’t great either.

[Declarative macros](https://doc.rust-lang.org/rust-by-example/macros.html) on the other hand are simple. You don’t need to write any parsing code, you merely describe the input you expect and what you want to replace it with:

```rust
macro_rules! enhanced_enum {
    {$type:ident {
        $($variant:ident,)*
    }} => {
        #[derive(Debug)]
        pub enum $type {
            $($variant,)*
        }

        impl $type {
            pub fn name(&self) -> &'static str {
                match self {
                    $(
                        Self::$variant => stringify!($variant),
                    )*
                }
            }
        }
    }
}

enhanced_enum!{
    Color {
        Red,
        Green,
        Blue,
    }
}
```

This macro defines its own syntax resembling that of regular enum declarations: a type name (an identifier) is followed by brackets containing any number of variant names (also identifiers), each followed by a comma.

Note that writing the repetition as `$($variant:ident),*` would make the comma after the last variant optional. Personally, I consider omitting this comma bad style however. So I opted for putting the comma inside the parentheses, rendering it mandatory: `$($variant:ident,)*`.

## A more complicated scenario

But what if your variants don’t all follow the same syntax? For example, the color gray could contain a number indicating the shade of gray:

```rust
enhanced_enum!{
    Color {
        Red,
        Green,
        Blue,
        Gray(u8),
    }
}
```

With the current macro definition, this will produce an error:

```
error: no rules expected the token `(`
   |
   | macro_rules! enhanced_enum {
   | -------------------------- when calling this macro
...
   |         Gray(u8),
   |             ^ no rules expected this token in macro call
```

There also isn’t an obvious solution. While declarative macros support [variadic interfaces](https://doc.rust-lang.org/rust-by-example/macros/variadics.html), you cannot use that inside a repetition. You can either have a list of identifiers or you can have a list of identifiers followed by a type name in brackets.

We could try parsing “regular” variants first and the variants with a parameter later:

```rust
macro_rules! enhanced_enum {
    {$type:ident {
        $($variant:ident,)*
        $($variant_with_parameter:ident($param:ty),)*
    }} => {
        #[derive(Debug)]
        pub enum $type {
            $($variant,)*
            $($variant_with_parameter($param),)*
        }

        impl $type {
            pub fn name(&self) -> &'static str {
                match self {
                    $(
                        Self::$variant => stringify!($variant),
                    )*
                    $(
                        Self::$variant_with_parameter(_) =>
                            stringify!($variant_with_parameter),
                    )*
                }
            }
        }
    }
}
```

This doesn’t quite work however, the parser isn’t clever enough to know when the one repetition ends and the other one starts:

```
error: local ambiguity when calling macro `enhanced_enum`: multiple parsing options:
built-in NTs ident ('variant') or ident ('variant_with_parameter').
   |
   |         Red,
   |         ^^^
```

And either way, we wouldn’t want to dictate the order in which the variants need to be specified, would we?

## Token trees to the rescue

We’ve already seen the designators `ident` for identifiers and `ty` for type names. One designator is particularly helpful when dealing with complex structures however: `tt` (token tree).

Let’s start by stating that this designator appears to be misnamed. IMHO, it rather represents a single token – any token that the Rust lexer will recognize. If used in a repetition, it will result in a token list that can represent anything. In particular, such a token list can contain enum variants using different syntax:

```rust
macro_rules! enhanced_enum {
    {$type:ident {
        $($variants:tt)*
    }} => {
        #[derive(Debug)]
        pub enum $type {
            $($variants)*
        }
    }
}

enhanced_enum!{
    Color {
        Red,
        Green,
        Blue,
        Gray(u8),
    }
}
```

This works but it will merely take the variants as a token list and put them into the type verbatim. If we want to implement the `name()` method again, we will need to process the token list somehow.

As the documentation [explains](https://doc.rust-lang.org/reference/macros-by-example.html#forwarding-a-matched-fragment) however, forwarding a token list to another macro allows that macro to match it. And we can use recursion to match one variant at a time, leaving processing of the rest to the recursive call:

```rust
macro_rules! enhanced_enum {
    {$type:ident {
        $($variants:tt)*
    }} => {
        #[derive(Debug)]
        pub enum $type {
            $($variants)*
        }

        impl $type {
            pub fn name(&self) -> &'static str {
                impl_name_method!{self $($variants)*}
                // This statement will never be reached
                ""
            }
        }
    }
}

macro_rules! impl_name_method {
    // Simple variant: Red,
    {$self:ident $variant:ident, $($rest:tt)*} => {
        if let Self::$variant = $self {
            return stringify!($variant);
        }
        impl_name_method!{$self $($rest)*}
    };

    // Variant with parameter: Gray(u8),
    {$self:ident $variant:ident($param:ty), $($rest:tt)*} => {
        if let Self::$variant(_) = $self {
            return stringify!($variant);
        }
        impl_name_method!{$self $($rest)*}
    };

    // Entire token list consumed, nothing left
    {$self:ident} => {};
}
```

Why are we passing `self` around here? That’s because of [macro hygiene](https://doc.rust-lang.org/reference/macros-by-example.html#hygiene): macros cannot access variables defined outside unless these have been passed in explicitly. Otherwise we’ll get an error:

```
error[E0424]: expected value, found module `self`
   |
   | /             pub fn name(&self) -> &'static str {
   | |                 impl_name_method!{$($variants)*}
   | |                 // This statement will never be reached
   | |                 ""
   | |             }
   | |_____________- this function has a `self` parameter, but a macro invocation can
   |                 only access identifiers it receives from parameters
...
   |           if let Self::$variant(_) = self {
   |                                      ^^^^ `self` value is a keyword only available
   |                                           in methods with a `self` parameter
```

The more important issue with this approach: we are producing a series of `if` statements. A single `match` statement would make more sense, already because it doesn’t require returning an empty string as an unreachable default. But macros cannot be called from inside a `match` statement.

## Pre-processing tokens

We can work around this issue by processing the tokens first, accumulating the results and producing the entire `match` statement in one go, along with the actual method:

```rust
macro_rules! enhanced_enum {
    {$type:ident {
        $($variants:tt)*
    }} => {
        #[derive(Debug)]
        pub enum $type {
            $($variants)*
        }

        impl $type {
            impl_name_method!{[] $($variants)*}
        }
    }
}

macro_rules! impl_name_method {
    // Simple variant: Red,
    {[$($processed:tt)*] $variant:ident, $($rest:tt)*} => {
        impl_name_method!{[
            $($processed)*
            Self::$variant => stringify!($variant),
        ] $($rest)*}
    };

    // Variant with parameter: Gray(u8),
    {[$($processed:tt)*] $variant:ident($param:ty), $($rest:tt)*} => {
        impl_name_method!{[
            $($processed)*
            Self::$variant(_) => stringify!($variant),
        ] $($rest)*}
    };

    // Entire token list consumed, nothing left
    {[$($processed:tt)*]} => {
        pub fn name(&self) -> &'static str {
            match self {
                $($processed)*
            }
        }
    };
}
```

It’s the same recursive calls here but instead of producing output directly we move it into the `$processed` token list. Initially, `$processed` is an empty list. But at some point the entire input will be consumed and all the processing results moved to `$processed`. That’s when we can produce a `match` statement containing all of the `$processed` token list.

Note that we have to wrap `$processed` in brackets here. Otherwise we’ll get the “local ambiguity” error again because the parser won’t know where one token list stops and the next one starts.

## Implementing the Display trait

We could use the same approach to implement the `Display` trait automatically. Why specify the strings displayed for particular enum variants in a trait implementation when we can specify them inline? For example:

```rust
enhanced_enum!{
    Color {
        ///The color red
        Red,
        ///The color green
        Green,
        ///The color blue
        Blue,
        ///The color gray (shade {})
        Gray(u8),
    }
}
```

These display strings will even double as type documentation – somewhat awkward if there are format arguments, but you cannot have everything.

Given what we know already, the approach should be mostly straightforward. One merely has to remember that `///` is implicitly converted into the `#[doc="…"]` attribute.

```rust
macro_rules! enhanced_enum {
    {$type:ident {
        $($variants:tt)*
    }} => {
        #[derive(Debug)]
        pub enum $type {
            $($variants)*
        }

        impl std::fmt::Display for $type {
            impl_display!{[] $($variants)*}
        }
    }
}

macro_rules! impl_display {
    // Simple variant: Red,
    {[$($processed:tt)*] #[doc=$doc:literal] $variant:ident, $($rest:tt)*} => {
        impl_display!{[
            $($processed)*
            Self::$variant => write!(f, $doc),
        ] $($rest)*}
    };

    // Variant with parameter: Gray(u8),
    {[$($processed:tt)*] #[doc=$doc:literal] $variant:ident($param:ty), $($rest:tt)*} => {
        impl_display!{[
            $($processed)*
            Self::$variant(parameter) => write!(f, $doc, parameter),
        ] $($rest)*}
    };

    // Entire token list consumed, nothing left
    {[$($processed:tt)*]} => {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match self {
                $($processed)*
            }
        }
    };
}
```

Oops, almost. [Macro hygiene](https://doc.rust-lang.org/reference/macros-by-example.html#hygiene) is messing with us again:

```
error[E0425]: cannot find value `f` in this scope
   |
   |               Self::$variant => write!(f, $doc),
   |                                        ^ not found in this scope
```

While `f` clearly exists in the scope, it’s defined by a different macro invocation than the one where it’s being used. We could move the method declaration into the `enhanced_enum!` macro and pass `f` around then. I found a different solution however, a slight adjustment to the `impl_display!` macro:

```rust
macro_rules! impl_display {
    // Simple variant: Red,
    {[$($processed:tt)*] #[doc=$doc:literal] $variant:ident, $($rest:tt)*} => {
        impl_display!{[
            $($processed)*
            (Self::$variant, f) => write!(f, $doc),
        ] $($rest)*}
    };

    // Variant with parameter: Gray(u8),
    {[$($processed:tt)*] #[doc=$doc:literal] $variant:ident($param:ty), $($rest:tt)*} => {
        impl_display!{[
            $($processed)*
            (Self::$variant(parameter), f) => write!(f, $doc, parameter),
        ] $($rest)*}
    };

    // Entire token list consumed, nothing left
    {[$($processed:tt)*]} => {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match (self, f) {
                $($processed)*
            }
        }
    };
}
```

Instead of matching only `self`, we match the tuple `(self, f)`. This makes sure that we always have a locally defined `f`. And the compiler should optimize the variable passing away here.

## Conclusion

As we’ve seen, declarative macros can be used to process a complex and heterogenous syntax. In fact, you aren’t limited by Rust’s enum syntax and could go with something more fancy instead:

```rust
enhanced_enum!{
    Color is any of [
        Red ("The color red"),
        Green ("The color green"),
        Blue ("The color blue"),
        Gray ("The color gray (shade {})", u8),
    ]
}
```

It won’t really improve code readability however, so it’s probably better to stick close to common syntactical constructs.