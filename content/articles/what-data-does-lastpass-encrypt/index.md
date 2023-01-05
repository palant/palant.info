---
categories:
- lastpass
- security
- password-managers
date: 2022-12-24T21:56:11+0100
description: LastPass doesn’t explain what data in its “vault” is encrypted. Everyone
  can download their data and see for themselves easily however.
lastmod: '2023-01-05 07:12:45'
title: What data does LastPass encrypt?
---

A few days ago LastPass admitted that unknown attackers copied their “vault data.” It certainly doesn’t help that LastPass failed to clarify which parts of the vaults are encrypted and which are not. LastPass support adds to the confusion by stating that [password notes aren’t encrypted](https://defcon.social/@deaddrop/109565784698153212) which I’m quite certain is wrong.

In fact, it’s pretty easy to view your own LastPass data. And it shows that barely anything changed since I [wrote about their “encrypted vault” myth](/2018/07/09/is-your-lastpass-data-really-safe-in-the-encrypted-online-vault/#the-encrypted-vault-myth) four years go. Passwords, account and user names, as well as password notes are encrypted. Everything else: not so much. Page addresses are merely hex-encoded and various metadata fields are just plain text.

{{< toc >}}

## Downloading your LastPass data

When you are logged into LastPass, a copy of your “vault data” can still be downloaded under `https://lastpass.com/getaccts.php`. Only one detail changed: a POST request is required now, so simply opening the address in the browser won’t do.

Instead, you can open Developer Tools on lastpass.com and enter the following command:

```js
fetch("https://lastpass.com/getaccts.php", {method: "POST"})
  .then(response => response.text())
  .then(text => console.log(text.replace(/>/g, ">\n")));
```

This will produce your account’s data, merely with additional newlines inserted for readability.

Side note: you can also download the data in the original binary format by adding `mobile=1` to the request body. It’s really the same data however, merely less readable.

## What’s in the data

Obviously, the most interesting part here are the accounts. These look like this:

```xml
<account name="!abcd|efgh" urid="0" id="123456" url="687474703A2F2F6578616D706C652E636F6D"
    m="0" http="0" fav="0" favico="0" autologin="0" basic_auth="0" group="" fiid="654321"
    genpw="0" extra="!ijkl|mnop" isbookmark="0" never_autofill="0" last_touch="1542801288"
    last_modified="1516645222" sn="0" realm="" sharedfromaid="" pwprotect="0"
    launch_count="0" username="!qrst|uvwx">
  <login urid="0" url="687474703A2F2F6578616D706C652E636F6D" submit_id="" captcha_id=""
      custom_js="" u="!qrst|uvwx" p="!stuv|wxyz" o="" method="">
  </login>
</account>
```

First of all, encrypted data should have the format `!<base64>|<base64>`. This is AES-CBC encryption. The first base64 string is the initialization vector, the second one the actual encrypted data. If you see encrypted data that is merely a base64 string: that’s AES-ECB encryption which absolutely shouldn’t be used today. But LastPass only replaced it around five years ago, and I’m not sure whether they managed to migrate all existing passwords.

As you can see here, the encrypted fields are `name`, `username` (duplicated as `u`), `p` (password) and `extra` (password notes).

Everything else is not encrypted. The `url` attributes in particular are merely hex encoded, any hex to text web page can decode that easily. Metadata like modification times and account settings is plain text.

There are more unencrypted settings here, for example:

```xml
<neveraccounts>
<neverautologin url="64726976652e676f6f676c652e636f6d"/>
</neveraccounts>
```

Apparently, `drive.google.com` is an exception from the password autofill for some reason. More interesting:

```xml
<equivdomains>
  <equivdomain edid="1" domain="616d65726974726164652e636f6d"/>
  <equivdomain edid="1" domain="7464616d65726974726164652e636f6d"/>
  …
</equivdomains>
```

This lists `ameritrade.com` and `tdameritrade.com` as equivalent domains, passwords from one are autofilled on another. As these fields aren’t encrypted, someone with access to this data on LastPass servers could add a rule to automatically fill in `google.com` password on `malicious.com` for example. I reported this issue in 2018, supposedly it was resolved in August 2018.

## What’s the deal with the encrypted username field?

The account data starts with:

```xml
<accounts accts_version="105" updated_enc="1" encrypted_username="acbdefgh"
    cbc="1" pd="123456">
```

What’s the deal with the `encrypted_username` field? Does it mean that LastPass doesn’t know the decrypted account name (email address)?

That’s of course not the case, LastPass knows the email address of each user. They wouldn’t be able to send out breach notifications to everyone otherwise.

LastPass merely uses this field to verify that it got the correct encryption key. If decrypting this value yields the user’s email address then the encryption key is working correctly.

And: yes, this is AES-ECB, a long deprecated encryption scheme. But here it really doesn’t matter.

## Why is unencrypted metadata an issue?

As I’ve already established in the [previous article](/2022/12/23/lastpass-has-been-breached-what-now/), decrypting LastPass data is possible but expensive. Nobody will do that for all the millions of LastPass accounts.

But the unencrypted metadata allows prioritizing. Someone with access to `admin.bigcorp.com`? And this account has also been updated recently? Clearly someone who is worth the effort.

And it’s not only that. Merely knowing who has the account where exposes users to phishing attacks for example. The attackers now know exactly who has an account with a particular bank, so they can send them phishing emails for that exact bank.