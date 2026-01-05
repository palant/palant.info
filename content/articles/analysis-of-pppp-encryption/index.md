---
title: "Analysis of PPPP “encryption”"
date: 2026-01-05T16:50:53+0100
description: The “encryption” used by PPPP protocol is even worse than I described earlier. It turns out, there are at most 157,092 ways to encrypt a particular packet.
categories:
- security
- IoT
---

My first article on the PPPP protocol already [said everything there was to say about PPPP “encryption”](/2025/09/08/a-look-at-a-p2p-camera-lookcam-app/#the-encryption):

* Keys are static and usually trivial to extract from the app.
* No matter how long the original key, it is mapped to an effective key that’s merely four bytes long.
* The “encryption” is extremely susceptible to known-plaintext attacks, usually allowing reconstruction of the effective key from a single encrypted packet.

So this thing is completely broken, why look any further? There is at least one situation where you don’t know the app being used so you cannot extract the key and you don’t have any traffic to analyze either. It’s when you are trying to [scan your local network for potential hidden cameras](https://github.com/pmarrapese/iot/tree/master/p2p/lansearch).

This script will currently only work for cameras using plaintext communication. Other cameras expect a properly encrypted “LAN search” packet and will ignore everything else. How can this be solved without listing all possible keys in the script? By sending all possible ciphertexts of course!

TL;DR: What would be completely ridiculous with any reasonable protocol turned out to be quite possible with PPPP. There are at most 157,092 ways in which a “LAN search” packet can be encrypted. I’ve opened a [pull request](https://github.com/pmarrapese/iot/pull/6) to have the PPPP device detection script adjusted.

*Note*: Cryptanalysis isn’t my topic, I am by no means an expert here. These issues are simply too obvious.

{{< toc >}}

## Mapping keys to effective keys

The key which is specified as part of the app’s “init string” is not being used for encryption directly. Nor is it being fed into any of the established key stretching algorithms. Instead, a key represented by the byte sequence \(b_1, b_2, \ldots, b_n\) is mapped to four bytes \(k_1, k_2, k_3, k_4\) that become the effective key. These bytes are calculated as follows (\(\lfloor x \rfloor\) means rounding down, \(\otimes\) stands for the bitwise XOR operation):

\[
  \begin{aligned}
  k_1 &= (b_1 + b_2 + \ldots + b_n) \mod 256\\
  k_2 &= (-b_1 + -b_2 + \ldots + -b_n) \mod 256\\
  k_3 &= (\lfloor b_1 \div 3 \rfloor + \lfloor b_2 \div 3 \rfloor + \ldots + \lfloor b_n \div 3 \rfloor) \mod 256\\
  k_4 &= b_1 \otimes b_2 \otimes \ldots \otimes b_n
  \end{aligned}
\]

In theory, a 4 byte long effective key means \(256^4 = 4{,}294{,}967{,}296\) possible values. But that would only be the case if these bytes were independent of each other.

## Redundancies within the effective key

Of course the bytes of the effective key are not independent. This is most obvious with \(k_2\) which is completely determined by \(k_1\):

\[
\begin{aligned}
k_2 &= (-b_1 + -b_2 + \ldots + -b_n) \mod 256\\
    &= -(b_1 + b_2 + \ldots + b_n) \mod 256\\
    &= -k_1 \mod 256
\end{aligned}
\]

This means that we can ignore \(k_2\), bringing the number of possible effective keys down to \(256^3 = 16{,}777{,}216\).

Now let’s have a look at the relationship between \(k_1\) and \(k_4\). Addition and bitwise XOR operations are very similar, the latter merely ignores carry. This difference affects all the bits of the result but the lowest one, no carry to be considered here. This means that the lowest bits of \(k_1\) and \(k_4\) are always identical. So \(k_4\) has only 128 possible values for any value of \(k_1\), bringing the total number of effective keys down to \(256 \cdot 256 \cdot 128 = 8{,}388{,}608\).

And that’s how far we can get considering only redundancies. It can be shown that a key can be constructed resulting in any combination of \(k_1\) and \(k_3\) values. Similarly, it can be shown that any combination of \(k_1\) and \(k_4\) is possible as long as the lowest bit is identical.

## ASCII to the rescue

But the keys we are dealing with here aren’t arbitrary bytes. These aren’t limited to alphanumeric characters, some keys also contain punctuation, but they are all invariably limited to the ASCII range. And that means that the highest bit is never set in any of the \(b_i\) values.

Which in turn means that the highest bit is never set in \(k_4\) due to the nature of the bitwise XOR operation. We can once again rule out half of the effective keys, for any given value of \(k_1\) there are only 64 possible values of \(k_4\). We now have \(256 \cdot 256 \cdot 64 = 4{,}194{,}304\) possible effective keys.

## How large is n?

Now let’s have a thorough look at how \(k_3\) relates to \(k_1\), ignoring the modulo operation at first. We are taking one third of each byte, rounding it down and summing that up. What if we were to sum up first and round down at the end, how would that relate? Well, it definitely cannot be smaller than rounding down in each step, so we have an upper bound here.

\[
\lfloor b_1 \div 3 \rfloor + \lfloor b_2 \div 3 \rfloor + \ldots + \lfloor b_n \div 3 \rfloor \leq \lfloor (b_1 + b_2 + \ldots + b_n) \div 3 \rfloor
\]

How much smaller can the left side get? Each time we round down this removes at most two thirds, and we do this \(n\) times. So altogether these rounding operations reduce the result by at most \(n \cdot 2 \div 3\). This gives us a lower bound:

\[
\lceil (b_1 + b_2 + \ldots + b_n - n \cdot 2) \div 3 \rceil \leq \lfloor b_1 \div 3 \rfloor + \lfloor b_2 \div 3 \rfloor + \ldots + \lfloor b_n \div 3 \rfloor
\]

If \(n\) is arbitrary these bounds don’t help us at all. But \(n\) isn’t arbitrary, the keys used for PPPP encryption tend to be fairly short. Let’s say that we are dealing with keys of length 16 at most which is a safe bet. If we know the sum of the bytes these bounds allow us to narrow down \(k_3\) to \(\lceil 16 \cdot 2 \div 3 \rceil = 11\) possible values.

But we don’t know the sum of bytes. What we have is \(k_1\) which is that sum modulo 256, and the sum is actually \(i \cdot 256 + k_1\) where \(i\) is some nonnegative integer. How large can \(i\) get? Remembering that we are dealing with ASCII keys, each byte has at most the value 127. And we have at most 16 bytes. So the sum of bytes cannot be higher than \(127 \cdot 16 = 2032\) (or 7F0 in hexadecimal). Consequently, \(i\) is 7 at most.

Let’s write down the bounds for \(k_3\) now:

\[
\lceil (i \cdot 256 + k_1 - n \cdot 2) \div 3 \rceil \leq j \cdot 256 + k_3 \leq \lfloor (i \cdot 256 + k_1) \div 3 \rfloor
\]

We have to consider this for eight possible values of \(i\). Wait, do we really?

Once we move into modulo 256 space again, the \(i \cdot 256 \div 3\) part of our bounds (which is the only part dependent on \(i\)) will assume the same value after every three \(i\) values. So only three values of \(i\) are really relevant, say 0, 1 and 2. Meaning that for each value of \(k_1\) we have \(3 \cdot 11 = 33\) possible values for \(k_3\).

This gives us \(256 \cdot 33 \cdot 64 = 540{,}672\) as the number of possible effective keys. My experiments with random keys indicate that this should be pretty much as far down as it goes. There may still be more edge conditions rendering some effective keys impossible, but if these exist their impact is insignificant.

Not all effective keys are equally likely however, the \(k_3\) values at the outer edges of the possible range are very unlikely. So one could prioritize the keys by probability – if the total number weren’t already low enough to render this exercise moot.

## How many ciphertexts is that?

We have the four byte plaintext `F1 30 00 00` and we have 540,672 possible effective keys. How many ciphertexts does this translate to? With any reasonable encryption scheme the answer would be: slightly less than 540,672 due to a few unlikely collisions which could occur here.

But PPPP doesn’t use a reasonable encryption scheme. With merely four bytes of plaintext there is a significant chance that PPPP will only use part of the effective key for encryption, resulting in identical ciphertexts for every key sharing that part. I didn’t bother analyzing this possibility mathematically, my script simply generated all possible ciphertexts. So the exact answer is: 540,672 effective keys produce 157,092 ciphertexts.

And that’s why you should leave cryptography to experts.

## Understanding the response

Now let’s say we send 157,092 encrypted requests. An encrypted response comes back. How do we decrypt it without knowing which of the requests was accepted?

All PPPP packets start with the magic byte `F1`, so the first byte of our response’s plaintext must be `F1` as well. The “encryption” scheme used by PPPP allows translating that knowledge directly into the value of \(k_1\). Now one could probably (definitely) guess more plaintext parts and with some clever tricks deduce the rest of the effective key. But there are only \(33 \cdot 64 = 2{,}112\) possible effective keys for each value of \(k_1\) anyway. It’s much easier to simply try out all 2,112 possibilities and see which one results in a response that makes sense.

The response here is 24 bytes large, making ambiguous decryptions less likely. Still, my experiments show that in approximately 4% of the cases closely related keys will produce valid but different decryption results. So you will get two or more similar device IDs and any one of them could be correct. I don’t think that this ambiguity can be resolved without further communication with the device, but at least with [my changes](https://github.com/pmarrapese/iot/pull/6) the script reliably detects when a PPPP device is present on the network.
