---
categories:
- keepass
- password-managers
date: 2023-03-29T14:34:06+0200
description: KeePass password databases are widely used but not properly documented.
  This is my attempt to document the file format with all its ambiguities.
lastmod: '2023-04-07 09:16:48'
title: Documenting KeePass KDBX4 file format
---

I’ve been playing around with KeePass databases. One aspect was rather surprising: given how many open source products use this format, it is remarkably underdocumented. At best, you can find [outdated and incomplete descriptions by random people](https://gist.github.com/lgg/e6ccc6e212d18dd2ecd8a8c116fb1e45). The KeePass developers themselves never bothered providing complete documentation. All you get is a semi-intelligible list of changes [from KDBX 3.1 to KDBX 4](https://keepass.info/help/kb/kdbx_4.html) and [from KDBX 4 to KDBX 4.1](https://keepass.info/help/kb/kdbx_4.1.html). With the starting point not being documented, these are only moderately useful.

And so it’s not surprising that the implementations I looked at aren’t actually implementing the same file format. They all probably manage to handle common files in the same way, but each of them has subtle differences when handling underdocumented format features.

I’ll try to explain the format and the subtle details here. For that, I looked at the source code of [KeePass](https://github.com/dlech/KeePass2.x), [KeePassXC](https://github.com/keepassxreboot/keepassxc), [keepass-rs](https://github.com/sseemayer/keepass-rs/) Rust library and the [kxdbweb](https://github.com/keeweb/kdbxweb/) JavaScript library. Let’s hope this documentation helps whoever else needs to work with that file format, and studying source code will no longer be required.

I can only document the latest version of the format (KDBX 4.1), though I’ll try to highlight changes wherever I’m aware of them.

{{< toc >}}

## The outer header

### Outer header format

A general note first: all numbers are stored using little-endian format. So the UInt32 number 0x12345678 is stored as bytes `78 56 34 12` on disk.

The KDBX4 format has two binary file headers: the outer and the inner header. The former is unencrypted and contains all the information necessary to decrypt the file’s payload. The latter is stored in the encrypted part of the file.

The outer header starts with some version information:

| Field            | Type       | Value            |
|------------------|------------|------------------|
| Signature1       | UInt32     | 0x9AA2D903       |
| Signature2       | UInt32     | 0xB54BFB67       |
| VersionMinor     | UInt16     | Minor part of the format version, e.g. 1 for 4.1 |
| VersionMajor     | UInt16     | Major part of the format version, e.g. 4 for 4.1 |

While `Signature1` value is meant to be always the same, `Signature2` has the value 0xB54BFB65 for the KeePass 1.x format.

Presumably, details of the binary format only ever change with a major format version. So a library determining whether it supports the format should be safe checking `VersionMajor` field only. KeePass itself refuses opening files with an unknown `VersionMajor` value and asks for a user confirmation when encountering an unknown `VersionMinor` value.

The version information is followed by a list of header fields. Each header field has the following format:

| Field            | Type       | Value            |
|------------------|------------|------------------|
| Type             | UInt8      | Field type identifier |
| Size             | UInt32     | Size of field value |
| Data             | byte[Size] | Field value |

*Note*: In the KDBX3 format the `Size` field had type `UInt16`.

The following field types are currently supported:

| Field type       | Data type  | Value            |
|------------------|------------|------------------|
| 0 (EndOfHeader)  |            | Indicates the last header field, typically contains the byte sequence `0d 0a 0d 0a` |
| 2 (CipherID)     | UUID (16 bytes) | The cipher used for database encryption |
| 3 (Compression)  | UInt32     | Compression algorithm: 0 = None, 1 = Gzip |
| 4 (MainSeed)     | byte[32]   | Random data used in key derivation |
| 7 (EncryptionIV) | byte[] | Initialization vector for encryption. Size is 16 bytes for CBC ciphers, 12 bytes for ChaCha20. |
| 11 (KdfParameters) | VariantMap | Parameters specific to the key derivation algorithm (new in KDBX4) |
| 12 (PublicCustomData) | VariantMap | Unencrypted storage for arbitrary data, meant to be used by KeePass plugins (new in KDBX4) |

The outer header ends when an `EndOfHeader` field is encountered. Technically speaking, all of the fields listed are optional. In practice however, only the `PublicCustomData` field is optional. All other fields are required for the database to be decrypted.

When reading KDBX4 files, it should be advisable to fail on unexpected fields. Implementors of KeePass and KeePassXC chose to be very forgiving however, resulting in unknown fields being dropped from the database silently. KeePass never rejects any fields, KeePassXC only fails when encountering no longer supported KDBX3 fields:

| Field type       | Replacement            |
|------------------|------------------------|
| 5 (TransformSeed) | AES-KDF parameter, moved to KdfParameters |
| 6 (TransformRounds) | AES-KDF parameter, moved to KdfParameters |
| 8 (StreamKey) | Moved to [inner header](#the-inner-header) |
| 9 (StreamStartBytes) | Replaced by [header integrity data](#header-integrity-data) |
| 10 (StreamCipher) | Moved to [inner header](#the-inner-header) |

### Supported ciphers

KeePassXC knows four possible values for the `CipherID` field:

| Value                                | Cipher       |
|--------------------------------------|--------------|
| 61ab05a1-9464-41c3-8d74-3a563df8dd35 | AES128-CBC   |
| 31c1f2e6-bf71-4350-be58-05216afc5aff | AES256-CBC   |
| ad68f29f-576f-4bb9-a36a-d47af965346c | Twofish-CBC  |
| d6038a2b-8b6f-4cb5-a524-339a31dbb59a | ChaCha20     |

Out of these, AES128 is generally unsupported. It is unclear when this cipher was even used.

The default encryption cipher is AES256-CBC. KeePass introduced support for the ChaCha20 cipher along with the KDBX4 format, and the plan is probably to make it the default in the long term.

*Note*: ChaCha20 really means the unauthenticated ChaCha20 stream cipher without Poly1305. As we’ll see below, KeePass has their own encryption authentication bolted on.

For some reason, KeePassXC does not merely support Twofish-CBC for legacy reasons but also allows creating new databases using this cipher. This is quite a footgun as many other tools will not be able to open such databases (KeePass and kdbxweb in particular won’t).

### The VariantMap structure

The `VariantMap` fields are a key-value storage. They start with a UInt16 value encoding the format version. Usually, it should have the value `0x100`. Implementors are told to ignore the lower 8 bits of the version number, only raising an error if the higher bits encode an unsupported version. So `0x123` should be accepted here, `0x200` should not (keepass-rs didn’t get the memo).

The version number is followed by any number of entries using the following format:

| Field            | Type       | Value            |
|------------------|------------|------------------|
| Type             | UInt8      | Type of the value |
| KeySize          | UInt32     | Size of the key name |
| Key              | byte[KeySize] | Key name      |
| ValueSize        | UInt32     | Size of the value|
| Value            | byte[ValueSize] | Value       |

The end of this structure is indicated by a zero byte (not a complete entry).

Following types are currently supported:

| Type             | Meaning     |
|------------------|-------------|
| 0x04             | UInt32      |
| 0x05             | UInt64      |
| 0x08             | bool (1 byte) |
| 0x0C             | Int32       |
| 0x0D             | Int64       |
| 0x18             | String (UTF-8 without BOM) |
| 0x42             | byte[]      |

For most of these types, the explicit value size field is redundant. Implementors need to verify that the value size matches the corresponding type. It’s also advisable to check whether a variant map actually consumes exactly the amount of data reserved for it in the header field.

The `VariantMap` stored in the `KdfParameters` header field should have a very specific set of entries. The `$UUID` entry should contain 16 bytes indicating the key derivation algorithm:

| Value                                | Key derivation |
|--------------------------------------|----------------|
| c9d9f39a-628a-4460-bf74-0d08c18a4fea | AES-KDF        |
| ef636ddf-8c29-444b-91f7-a9a403e30a0c | Argon2d        |
| 9e298b19-56db-4773-b23d-fc3ec6f0a1e6 | Argon2id       |

The other parameters depend on the key derivation. AES-KDF appears to be a custom key derivation scheme invented by KeePass, its parameters are:

| Key | Value type | Value      |
|-----|------------|------------|
| R   | UInt64     | Number of rounds |
| S   | bytes[32]  | A random seed    |

The parameters for Argon2 variants are:

| Key | Value type | Value      |
|-----|------------|------------|
| S   | bytes[]    | Random salt, typically 32 bytes |
| P   | UInt32     | Parallelism |
| M   | UInt64     | Memory usage *in bytes*, usually needs to be divided by 1024 |
| I   | UInt64     | Iterations |
| V   | UInt32     | Argon2 version (0x10 or 0x13) |
| K   | bytes[]    | Optional key |
| A   | bytes[]    | Optional associated data |

Note that while key and associated data parameters are theoretically allowed, KeePass doesn’t currently set them. Correspondingly, all of KeePassXC, keepass-rs and kdbxweb currently ignore these parameters.

Also, while it might look like the `KdfParameters` field could store some additional data, this data is not guaranteed to survive. KeePassXC and keepass-rs will remove any entries they don’t recognize. The `VariantMap` is only an intermediate format here and is immediately converted to something more robust.

### Example of a KXDB4 outer header

So much for the theory. Here is what an actual file header might look like:

```
03 d9 a2 9a   67 fb 4b b5   01 00   04 00
┗━━━━━━━━━┛   ┗━━━━━━━━━┛   ┗━━━┛   ┗━━━┛
Signature1    Signature2    Version: 4.1

02   10 00 00 00   31 c1 f2 e6 bf 71 43 50 be 58 05 21 6a fc 5a ff
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     CipherID: AES256-CBC

03   04 00 00 00   01 00 00 00
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
      Compression: Gzip

04   20 00 00 00   12 34 56 78 12 34 56 78 12 34 56 78 12 34 56 78
                   12 34 56 78 12 34 56 78 12 34 56 78 12 34 56 78
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                       MainSeed (random)

07   10 00 00 00   12 34 56 78 12 34 56 78 12 34 56 78 12 34 56 78
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     EncryptionIV (random)

0b   8b 00 00 00          00 01
┗━━━━━━━━━━━━━━┛          ┗━━━┛
KdfParameters starting    VariantMap version: 0x100

    42   05 00 00 00   24 55 55 49 44   10 00 00 00
                   ef 63 6d df 8c 29 44 4b 91 f7 a9 a4 03 e3 0a 0c
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              bytes[] entry, Key $UUID, Value Argon2d

    05   01 00 00 00   49   08 00 00 00   02 00 00 00 00 00 00 00
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                    UInt64 entry, Key I, Value 2

    05   01 00 00 00   4d   08 00 00 00   00 00 00 40 00 00 00 00
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
             UInt64 entry, Key M, Value 0x40000000 (1 GB)

    04   01 00 00 00   50   04 00 00 00   08 00 00 00
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              UInt32 entry, Key P, Value 8

    42   01 00 00 00   53   20 00 00 00
                   12 34 56 78 12 34 56 78 12 34 56 78 12 34 56 78
                   12 34 56 78 12 34 56 78 12 34 56 78 12 34 56 78
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                 bytes[] entry, Key S, Value random

    04   01 00 00 00   56   04 00 00 00   13 00 00 00
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
              UInt32 entry, Key V, Value 0x13

    00
    ┗┛
    End of VariantMap

00    04 00 00 00   0d 0a 0d 0a
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
         EndOfHeader
```

## Header integrity data

There are two more binary fields between the outer header and the encrypted data: the header’s SHA-256 hash and its HMAC-SHA-256 signature (more on that below). Both are 32 bytes long.

*Note*: These fields are new in the KDBX4 format and weren’t present in KDBX3.

While seemingly redundant, these two fields serve different purposes. The former is used to recognize data corruption, an operation performed before the access credentials are known. The latter is used to recognize malicious data manipulations once the credentials are available.

## Key derivation

### Key file format

A user can choose a key file in addition or instead of a database password. A typical KeePass key file looks like this:

```xml
<KeyFile>
<Meta>
  <Version>2.0</Version>
</Meta>
<Key>
  <Data Hash="653bb124">
    6162636465666768696a6b6c6d6e6f707172737475767778797a303132333435
  </Data>
</Key>
</KeyFile>
```

That’s 32 bytes of key data in the `<Data>` tag: base64-encoded for version 1 and hex-encoded for version 2. Version 2 of the format also provides a `Hash` attribute to help recognize data corruption, that’s the first four bytes of the SHA-256 hash of the key.

*Note*: Version 1 of the format was indicated by `<Version>1.00</Version>`. KeePass’ version parser is rather flexible and will accept up to four numeric version components. Other implementations created various workarounds for this inconsistency: checking whether the version *starts* with `1.0` (KeePassXC), checking only the version part before the dot (kdbxweb) and straight out ignoring the version information (keepass-rs).

Files not in XML format can also be keys:

* Files containing exactly 32 bytes are assumed to be raw keys
* Files containing exactly 64 bytes are assumed to be hex-encoded keys
* Other files are turned into a key by hashing them with SHA-256

The first two formats are considered legacy and will yield corresponding warnings in the applications.

### Creating a composite key

Altogether, there seem to be three possible sources of key data: a database password, a key file and some abstract key provider (typically a hardware device). Key providers are assumed to implement a challenge-response scheme, the challenge used to produce key data being the contents of the `MainSeed` header field. The details of key provider implementations differ depending on the product: in KeePass you can only have either a key file or a key provider, in kdbxweb you can have both, and KeePassXC even has provisions for multiple key providers. keepass-rs on the other hand does not support key providers at all.

All the various key sources are mashed together into a composite key. Since a database password has a wrong size, it is being hashed with SHA-256 first, resulting in 32 bytes. Then all key sources present are concatenated and hashed with SHA-256.

In other words: if the database has only a password, its composite key will be `SHA256(SHA256(password))`. If there is also a key file, it will be `SHA256(SHA256(password) + keyfile)`. If there is a key provider, its data will come instead (KeePass) or after (KeePassXC and kxdbweb) the keyfile data.

### Computing the keys

The composite key is used as the input to the key derivation algorithm, either AES-KDF or Argon2. This part is mostly straightforward, all the necessary parameters are in the `KdfParameters` field. You only have to keep in mind that KeePass stores Argon2 memory cost in bytes whereas all implementations take this value in kilobytes.

Since KeePass uses CBC, it needs two keys: one encryption key and one authentication (HMAC) key. So the derived key is mangled further: `SHA256(MainSeed + DerivedKey)` becomes the encryption key and `SHA512(MainSeed + DerivedKey + "\x01")` the main HMAC key (yes, that’s a single `01` byte being hashed along with the other data).

But that’s not quite the end of it. KeePass has a very “special” approach to encryption authentication: rather than store an HMAC signature of the entire encrypted data, it splits the encrypted data into blocks of typically 1 MB. Each block is signed separately.

Now this could allow an attacker to maliciously manipulate the data: the blocks can potentially be reordered without affecting the signature. KeePass addresses this by using a different HMAC key for each block: `SHA512(BlockIndex + HmacKey)`. Here, `BlockIndex` is a `UInt64` value, encoded as eight bytes. The first signed block in the file gets assigned `BlockIndex` 0, the next one 1 and so on.

It’s the same with the HMAC key used to sign the header (see [Header integrity data](#header-integrity-data) above). `BlockIndex` used for the header is `0xFFFFFFFFFFFFFFFF`.

### Key changes on database saves

When a database is opened and subsequently saved, it’s expected that the `EncryptionIV` header field is replaced by a new random value: the same initialization vector should never be used to encrypt different data. However, KeePass and KeePassXC will also replace `MainSeed` and the salt/seed value in `KdfParameters` field. This means that the keys change each time the database is saved.

This approach is quite wasteful. It requires a new set of keys to be derived each time the file is saved, which could take several seconds depending on device and database configuration.

I *guess* that the goal here is still securing KeePass’ unconventional approach to encryption authentication: even with HMAC keys depending on the block index, without key changes an attacker could combine blocks from old database versions with new blocks without failing integrity checks.

## Data encryption and compression

The “inner” data is being put through three processing steps:

1. If the `Compression` header field is 1, the data is compressed using the Gzip algorithm.
2. The data is encrypted with the symmetric cipher designated in the `CipherID` header field, using the [derived encryption key](#computing-the-keys) and the initialization vector from the `EncryptionIV` header field.
3. The result is turned into an “HmacBlockStream” by splitting it into blocks (typically 1 MB in size). For each block, [a different HMAC key is calculated according to its block index](#computing-the-keys). A block signature is calculated as `HMAC-SHA256(BlockIndex + BlockSize + BlockContents)`. Here, `BlockIndex` is the same `UInt64` value (encoded as eight bytes) as for the HMAC key calculation. `BlockSize` is a `UInt32` value, encoded as four bytes. These two are prepended to the actual block content being signed, don’t ask me why.

When decrypting the data, these layers have to be removed in the reverse order of course.

If you wonder about the complicated approach in the third step: the goal appears to have been allowing the database contents to be read as a stream in one pass. One HMAC signature for the entire file contents would have been sufficient. But then one would either have to read the entire file first to validate the signature before it can be decrypted. Or one would have to start processing decrypted data before it has been authorized.

Instead, each of these layers is meant as a stream wrapper. The file only needs to be read once, no more than 1 MB of file contents have to be buffered at a time, and all data coming out is already authenticated. Yes, I also suspect that there are simpler approaches.

## The inner header

KDBX4 format introduced an inner header. The format is identical to [outer header fields](#outer-header-format), the field types are different however:

| Field type          | Data type  | Value            |
|---------------------|------------|------------------|
| 0 (EndOfHeader)     |            | Indicates the last header field, typically contains zero bytes |
| 1 (StreamCipher)    | UInt32     | Stream cipher algorithm: 1 = ArcFourVariant, 2 = Salsa20, 3 = ChaCha20 |
| 2 (StreamKey)       | bytes[]    | Stream cipher key (32 bytes for Salsa20, 64 bytes for ChaCha20) |
| 3 (Binary)          | bytes[]    | Binary attachment data. This field can be present multiple times according to the number of attachments in the file. |

*Note*: In KDBX3 the `RandomStreamID` and `RandomStreamKey` parameters resided in the outer header, and the latter was 32 bytes long.

*Note*: The cipher algorithm ArcFourVariant is legacy and only supported by KeePass. Salsa20 is the format used by KDBX3 files while any KDBX4 files can be expected to use ChaCha20.

The stream cipher defined here is used [“protect” (meaning: obfuscate) password values](#the-protected-values). And the data inside the `Binary` fields is further explained under [The non-trivial parts](#the-non-trivial-parts).

## The XML data

### Example of the data

The main content of a KeePass database is some extensive XML data. Here is what my test database decrypts into:

```xml
<KeePassFile>
  <Meta>
    <Generator>KeePassXC</Generator>
    <DatabaseName>Passwords</DatabaseName>
    <DatabaseNameChanged>ZHCz2w4AAAA=</DatabaseNameChanged>
    <DatabaseDescription/>
    <DatabaseDescriptionChanged>YXCz2w4AAAA=</DatabaseDescriptionChanged>
    <DefaultUserName/>
    <DefaultUserNameChanged>YXCz2w4AAAA=</DefaultUserNameChanged>
    <MaintenanceHistoryDays>365</MaintenanceHistoryDays>
    <Color/>
    <MasterKeyChanged>bXCz2w4AAAA=</MasterKeyChanged>
    <MasterKeyChangeRec>-1</MasterKeyChangeRec>
    <MasterKeyChangeForce>-1</MasterKeyChangeForce>
    <MemoryProtection>
      <ProtectTitle>False</ProtectTitle>
      <ProtectUserName>False</ProtectUserName>
      <ProtectPassword>True</ProtectPassword>
      <ProtectURL>False</ProtectURL>
      <ProtectNotes>False</ProtectNotes>
    </MemoryProtection>
    <CustomIcons/>
    <RecycleBinEnabled>True</RecycleBinEnabled>
    <RecycleBinUUID>AAAAAAAAAAAAAAAAAAAAAA==</RecycleBinUUID>
    <RecycleBinChanged>YXCz2w4AAAA=</RecycleBinChanged>
    <EntryTemplatesGroup>AAAAAAAAAAAAAAAAAAAAAA==</EntryTemplatesGroup>
    <EntryTemplatesGroupChanged>YXCz2w4AAAA=</EntryTemplatesGroupChanged>
    <LastSelectedGroup>AAAAAAAAAAAAAAAAAAAAAA==</LastSelectedGroup>
    <LastTopVisibleGroup>AAAAAAAAAAAAAAAAAAAAAA==</LastTopVisibleGroup>
    <HistoryMaxItems>10</HistoryMaxItems>
    <HistoryMaxSize>6291456</HistoryMaxSize>
    <SettingsChanged>YXCz2w4AAAA=</SettingsChanged>
    <CustomData>
      <Item>
        <Key>KPXC_DECRYPTION_TIME_PREFERENCE</Key>
        <Value>1000</Value>
      </Item>
      <Item>
        <Key>_LAST_MODIFIED</Key>
        <Value>Tue Mar 28 18:25:59 2023 GMT</Value>
      </Item>
    </CustomData>
  </Meta>
  <Root>
    <Group>
      <UUID>lPaUSHCcTZmLUNLZ9Yvc9g==</UUID>
      <Name>Root</Name>
      <Notes/>
      <IconID>48</IconID>
      <Times>
        <LastModificationTime>p7602w4AAAA=</LastModificationTime>
        <CreationTime>YXCz2w4AAAA=</CreationTime>
        <LastAccessTime>p7602w4AAAA=</LastAccessTime>
        <ExpiryTime>YXCz2w4AAAA=</ExpiryTime>
        <Expires>False</Expires>
        <UsageCount>0</UsageCount>
        <LocationChanged>YXCz2w4AAAA=</LocationChanged>
      </Times>
      <IsExpanded>True</IsExpanded>
      <DefaultAutoTypeSequence/>
      <EnableAutoType>null</EnableAutoType>
      <EnableSearching>null</EnableSearching>
      <LastTopVisibleEntry>AAAAAAAAAAAAAAAAAAAAAA==</LastTopVisibleEntry>
      <Entry>
        <UUID>NvY54Wr7RvOH8mBDYgpH2g==</UUID>
        <IconID>0</IconID>
        <ForegroundColor/>
        <BackgroundColor/>
        <OverrideURL/>
        <Tags/>
        <Times>
          <LastModificationTime>lSK12w4AAAA=</LastModificationTime>
          <CreationTime>h3Cz2w4AAAA=</CreationTime>
          <LastAccessTime>lSK12w4AAAA=</LastAccessTime>
          <ExpiryTime>h3Cz2w4AAAA=</ExpiryTime>
          <Expires>False</Expires>
          <UsageCount>0</UsageCount>
          <LocationChanged>kXCz2w4AAAA=</LocationChanged>
        </Times>
        <String>
          <Key>Notes</Key>
          <Value/>
        </String>
        <String>
          <Key>Password</Key>
          <Value Protected="True">YjYJQA==</Value>
        </String>
        <String>
          <Key>Title</Key>
          <Value>Hi</Value>
        </String>
        <String>
          <Key>URL</Key>
          <Value>https://example.com/</Value>
        </String>
        <String>
          <Key>UserName</Key>
          <Value>me</Value>
        </String>
        <Binary>
          <Key>smiley.jpg</Key>
          <Value Ref="0"/>
        </Binary>
        <AutoType>
          <Enabled>True</Enabled>
          <DataTransferObfuscation>0</DataTransferObfuscation>
          <DefaultSequence/>
        </AutoType>
        <History>
          <Entry>
            <UUID>NvY54Wr7RvOH8mBDYgpH2g==</UUID>
            <IconID>0</IconID>
            <ForegroundColor/>
            <BackgroundColor/>
            <OverrideURL/>
            <Tags/>
            <Times>
              <LastModificationTime>kHCz2w4AAAA=</LastModificationTime>
              <CreationTime>h3Cz2w4AAAA=</CreationTime>
              <LastAccessTime>kHCz2w4AAAA=</LastAccessTime>
              <ExpiryTime>h3Cz2w4AAAA=</ExpiryTime>
              <Expires>False</Expires>
              <UsageCount>0</UsageCount>
              <LocationChanged>kXCz2w4AAAA=</LocationChanged>
            </Times>
            <String>
              <Key>Notes</Key>
              <Value/>
            </String>
            <String>
              <Key>Password</Key>
              <Value Protected="True">1eTWlg==</Value>
            </String>
            <String>
              <Key>Title</Key>
              <Value>Hi</Value>
            </String>
            <String>
              <Key>URL</Key>
              <Value>https://example.com/</Value>
            </String>
            <String>
              <Key>UserName</Key>
              <Value>me</Value>
            </String>
            <AutoType>
              <Enabled>True</Enabled>
              <DataTransferObfuscation>0</DataTransferObfuscation>
              <DefaultSequence/>
            </AutoType>
          </Entry>
        </History>
      </Entry>
      <Entry>
        <UUID>9jU9DC4ZSTChxxILyLU89g==</UUID>
        <IconID>0</IconID>
        <ForegroundColor/>
        <BackgroundColor/>
        <OverrideURL/>
        <Tags/>
        <Times>
          <LastModificationTime>VCi12w4AAAA=</LastModificationTime>
          <CreationTime>or602w4AAAA=</CreationTime>
          <LastAccessTime>VCi12w4AAAA=</LastAccessTime>
          <ExpiryTime>or602w4AAAA=</ExpiryTime>
          <Expires>False</Expires>
          <UsageCount>0</UsageCount>
          <LocationChanged>p7602w4AAAA=</LocationChanged>
        </Times>
        <String>
          <Key>Notes</Key>
          <Value/>
        </String>
        <String>
          <Key>Password</Key>
          <Value Protected="True">PTP8JA==</Value>
        </String>
        <String>
          <Key>Title</Key>
          <Value>another</Value>
        </String>
        <String>
          <Key>URL</Key>
          <Value/>
        </String>
        <String>
          <Key>UserName</Key>
          <Value>asdf</Value>
        </String>
        <String>
          <Key>custom field</Key>
          <Value>some content</Value>
        </String>
        <Binary>
          <Key>avatar3.png</Key>
          <Value Ref="1"/>
        </Binary>
        <AutoType>
          <Enabled>True</Enabled>
          <DataTransferObfuscation>0</DataTransferObfuscation>
          <DefaultSequence/>
        </AutoType>
        <History>
          <Entry>
            <UUID>9jU9DC4ZSTChxxILyLU89g==</UUID>
            <IconID>0</IconID>
            <ForegroundColor/>
            <BackgroundColor/>
            <OverrideURL/>
            <Tags/>
            <Times>
              <LastModificationTime>p7602w4AAAA=</LastModificationTime>
              <CreationTime>or602w4AAAA=</CreationTime>
              <LastAccessTime>p7602w4AAAA=</LastAccessTime>
              <ExpiryTime>or602w4AAAA=</ExpiryTime>
              <Expires>False</Expires>
              <UsageCount>0</UsageCount>
              <LocationChanged>p7602w4AAAA=</LocationChanged>
            </Times>
            <String>
              <Key>Notes</Key>
              <Value/>
            </String>
            <String>
              <Key>Password</Key>
              <Value Protected="True">dduD9Q==</Value>
            </String>
            <String>
              <Key>Title</Key>
              <Value>another</Value>
            </String>
            <String>
              <Key>URL</Key>
              <Value/>
            </String>
            <String>
              <Key>UserName</Key>
              <Value>asdf</Value>
            </String>
            <AutoType>
              <Enabled>True</Enabled>
              <DataTransferObfuscation>0</DataTransferObfuscation>
              <DefaultSequence/>
            </AutoType>
          </Entry>
          <Entry>
            <UUID>9jU9DC4ZSTChxxILyLU89g==</UUID>
            <IconID>0</IconID>
            <ForegroundColor/>
            <BackgroundColor/>
            <OverrideURL/>
            <Tags/>
            <Times>
              <LastModificationTime>piK12w4AAAA=</LastModificationTime>
              <CreationTime>or602w4AAAA=</CreationTime>
              <LastAccessTime>piK12w4AAAA=</LastAccessTime>
              <ExpiryTime>or602w4AAAA=</ExpiryTime>
              <Expires>False</Expires>
              <UsageCount>0</UsageCount>
              <LocationChanged>p7602w4AAAA=</LocationChanged>
            </Times>
            <String>
              <Key>Notes</Key>
              <Value/>
            </String>
            <String>
              <Key>Password</Key>
              <Value Protected="True">vUY13w==</Value>
            </String>
            <String>
              <Key>Title</Key>
              <Value>another</Value>
            </String>
            <String>
              <Key>URL</Key>
              <Value/>
            </String>
            <String>
              <Key>UserName</Key>
              <Value>asdf</Value>
            </String>
            <Binary>
              <Key>avatar3.png</Key>
              <Value Ref="1"/>
            </Binary>
            <AutoType>
              <Enabled>True</Enabled>
              <DataTransferObfuscation>0</DataTransferObfuscation>
              <DefaultSequence/>
            </AutoType>
          </Entry>
        </History>
      </Entry>
    </Group>
    <DeletedObjects/>
  </Root>
</KeePassFile>
```

### The non-trivial parts

For most part, this XML format is self-explaining. One non-obvious aspect here are times however. These are stored as strings like `h3Cz2w4AAAA=`. That’s the Base64 representation of a UInt64 number, storing the number of seconds since 0001-01-01 00:00 UTC. In this particular case, it’s 0xedbb37087 or 63815512199 seconds, meaning 2023-03-27 11:09:59 UTC.

*Note*: KDBX3 used to save times as plain strings in the ISO 8601 format.

The other non-obvious aspect are binary attachments. These are denoted by the `<Binary>` tag, but the `<Value>` tag inside it has only a `Ref` attribute. That’s a zero-based index referring to one of the `Binary` fields in the [inner header](#the-inner-header).

The `Binary` fields have a single byte (flags) preceding the actual file data. The only supported flag is currently `0x01` indicating “protected.” This flag has no impact on how the data is stored in the database, it’s rather an indicator that the binary requires additional protection in memory. Whether/how this is implemented differs wildly depending on product.

KeePass protects binaries by encrypting their data in memory with a stream cipher. KeePassXC does not support this feature at all and simply sets this flag for all binaries just in case. keepass-rs also ignores this flag but at least keeps it unchanged. And kdbxweb obfuscates the binary data by xor’ing it with a random salt, storing the result and the salt in two fields of the same data structure.

*Note*: KDBX3 format didn’t have an inner header, meaning that binary files were not stored there. Instead, data of attachments was kept inside the `<Value>` tag like for regular fields.

### Which fields are required?

The KeePass XML format certainly could use a proper XML schema definition. In particular, it’s not obvious which fields are optional and which ones have to be present. Yes, that’s an issue KeePass users [raised 14 years ago](https://sourceforge.net/p/keepass/discussion/329221/thread/fd78ba87/).

But the answer given back there is mostly correct. Looking through KeePass and KeePassXC code, there don’t seem to be all too many constrains on the format:

* The document root has to be a `<KeePassFile>` tag.
* There has to be exactly one `<Root>` tag.
* The `<Root>` tag has to contain exactly one `<Group>` tag.
* The `<String>` and `<Binary>` tags need both a `<Key>` and a `<Value>` child.
* Duplicate keys for `<String>` tags aren’t allowed.

Even `<UUID>` tags are optional. When missing, a new UUID will be generated for groups and entries.

*Edit* (2023-03-29): Turns out, there is a proper [documentation for the XML format](https://github.com/keepassxreboot/keepassxc-specs/blob/master/kdbx-xml/rfc.txt) after all, written by KeePassXC developers. I’m not sure how accurate it is (e.g. the description of the `_DATETIME_` format is outdated), but it is definitely better than nothing.

### The “protected” values

Some fields enjoy additional protection. In my example, these are only passwords though protection for other fields could be enabled as well. Instead of the actual value, for “protected” fields we see:

```xml
<Value Protected="True">YjYJQA==</Value>
```

The Base64-decoded data is binary gibberish. This data has been additionally encrypted with a stream cipher. The cipher algorithm and key are determined by the `StreamCipher` and `StreamKey` fields of the [inner header](#the-inner-header). All “protected” values have to be decrypted in the order in which they appear in the XML file.

If the cipher algorithm is Salsa20, the `StreamKey` field is the actual encryption key. The nonce is always the byte sequence `e8 30 09 4b 97 20 5d 2a`.

For ChaCha20 the `StreamKey` value is hashed with SHA-512. The first 32 bytes of the result are taken as the encryption key, the next 12 bytes as nonce.