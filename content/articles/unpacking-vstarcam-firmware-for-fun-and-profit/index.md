---
title: "Unpacking VStarcam firmware for fun and profit"
date: 2025-12-15T15:19:22Z
description: VStarcam firmware comes in lots of varieties and occasional proprietary formats that binwalk cannot handle. This article documents the formats and unpacking methods.
categories:
- security
- IoT
---

One important player in the [PPPP protocol business](/2025/11/05/an-overview-of-the-pppp-protocol-for-iot-cameras/) is VStarcam. At the very least they’ve already accumulated an impressive portfolio of security issues. Like [exposing system configuration including access password unprotected in the Web UI](https://github.com/Retr0-code/auth-traversal) (discovered by multiple people independently from the look of it). Or the [open telnet port accepting hardcoded credentials](https://brownfinesecurity.com/blog/vstarcam-cb73-hardcoded-root-password) (definitely discovered by lots of people independently). In fact, these cameras have been [seen used as part of a botnet](https://www.carson-saint.com/vstarcam-vulnerability-saint-blocks-eleven11bot-ddos-attacks/), likely thanks to some documented vulnerabilities in their user interface.

Is that a thing of the past? Are there updates fixing these issues? Which devices can be updated? These questions are surprisingly hard to answer. I found zero information on VStarcam firmware versions, available updates or security fixes. In fact, it doesn’t look like they ever even acknowledged learning about the existence of these vulnerabilities.

No way around downloading these firmware updates and having a look for myself. With surprising results. First of all: there are *lots* of firmware updates. It seems that VStarcam accumulated a huge number of firmware branches. And even though not all of them even have an active or downloadable update, the number of currently available updates goes into hundreds.

And the other aspect: the variety of update formats is staggering, and often enough standard tools like binwalk aren’t too useful. It took some time figuring out how to unpack some of the more obscure variants, so I’m documenting it all here.

*Warning*: Lots of quick-and-dirty Python code ahead. Minimal error checking, use at your own risk!

{{< toc >}}

## ZIP-packed incremental updates

These incremental updates don’t contain an image of the entire system, only the files that need updating. They always contain the main application however, which is what matters.

Recognizing this format is easy, the files start with the 32 bytes `www.object-camera.com.by.hongzx.` or `www.veepai.com/design.rock-peng.` (the old and the new variant respectively). The files end with the same string in reverse order. Everything in between is a sequence of ZIP files, with each file packed in its own ZIP file.

Each ZIP file is preceded by a 140 byte header: 64 byte directory name, 64 byte file name, 4 byte ZIP file size, 4 byte timestamp of some kind and 4 zero bytes. While `binwalk` can handle this format, having each file extracted into a separate directory structure isn’t optimal. A simple Python script can do better:

```python
#!/usr/bin/env python3
import datetime
import io
import struct
import os
import sys
import zipfile


def unpack_zip_stream(input: io.BytesIO, targetdir: str) -> None:
    targetdir = os.path.normpath(targetdir)
    while True:
        header = input.read(0x8c)
        if len(header) < 0x8c:
            break

        _, _, size, _, _ = struct.unpack('<64s64sLLL', header)
        data = input.read(size)

        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            for member in archive.infolist():
                path = os.path.normpath(
                    os.path.join(targetdir, member.filename)
                )
                if os.path.commonprefix((path, targetdir)) != targetdir:
                    raise Exception('Invalid target path', path)

                try:
                    os.makedirs(os.path.dirname(path))
                except FileExistsError:
                    pass

                with archive.open(member) as member_input:
                    data = member_input.read()
                with open(path, 'wb') as output:
                    output.write(data)

                time = datetime.datetime(*member.date_time).timestamp()
                os.utime(path, (time, time))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} in-file target-dir', file=sys.stderr)
        sys.exit(1)

    if os.path.exists(sys.argv[2]):
        raise Exception('Target directory exists')

    with open(sys.argv[1], 'rb') as input:
        header = input.read(32)
        if (header != b'www.object-camera.com.by.hongzx.' and
                header != b'www.veepai.com/design.rock-peng.'):
            raise Exception('Wrong file format')
        unpack_zip_stream(input, sys.argv[2])
```

## VStarcam pack system

This format is pretty simple. There is an identical section starting with `VSTARCAM_PACK_SYSTEM_HEAD` and ending with `VSTARCAM_PACK_SYSTEM_TAIL` at the start and at the end of the file. This section seems to contain a payload size and its MD5 hash.

There are two types of payload here. One is a raw SquashFS image starting with `hsqs`. These seem to be updates to the base system: they contain an entire Linux root filesystem and the Web UI root but not the actual application. The matching application lives on a different partition and is likely delivered via incremental updates.

The other variant seems to be used for hardware running LiteOS rather than Linux. The payload here starts with a 16 byte header: compressed size, uncompressed size and an 8 byte identification of the compression algorithm. The latter is usually `gziphead`, meaning standard gzip compression. After uncompressing you get a single executable binary containing the entire operating system, drivers, and the actual application.

So far binwalk can handle all these files just fine. I found exactly one exception, [firmware version 48.60.30.22](http://doraemon-hangzhou.eye4.cn/firmware_48.60.30.22_1577170721.bin). It seems to be another LiteOS-based update but the compression algorithm field is all zeroes. The actual compressed stream has some distinct features that make it look like none of the common compression algorithms.

{{< img src="mystery_compression.png" width="740" alt="Screenshot of a hexdump showing the first 160 and the last 128 bytes of a large file. The file starts with the bytes 30 c0 fb 54 and looks random except for two sequences of 14 identical bytes: ef at offset 0x24 and fb at offset 0x43. The file ending also looks random except for the closing sequence: ff ff 0f 00 00." />}}

Well, I had to move on here, so that’s the one update file I haven’t managed to unpack.

## VeePai updates

This is a format that seems to be used by newer VStarcam hardware. At offset 8 these files contain a firmware version like `www.veepai.com-10.201.120.54`. Offsets of the payload vary but it is a SquashFS image, so binwalk can be used to find and unpack it.

Normally these are updates for the partition where the VStarcam application resides in. In a few cases these are updating the Linux base system however, no application-specific files from what I could tell.

## Ingenic updates

This format seems to be specific to the Ingenic hardware platform, and I’ve seen other hardware vendors use it as well. One noticeable feature here is the presence of a `tag` partition containing various data sections, e.g. the `CMDL` section encoding Linux kernel parameters.

In fact, looking for that `tag` partition within the update might be helpful to recognize the format. While the update files usually start with the `11 22 33 44` magic bytes, they sometimes start with a different byte combination. There is always the firmware version at offset 8 in the file however.

The total size of the file header is 40 bytes. It is followed by a sequence of partitions, each preceded by a 16 byte header where bytes 1 to 4 encode the partition index and bytes 9 to 12 the partition size.

Binwalk can recognize and extract some partitions but not all of them. If you prefer having all partitions extracted you can use a simple Python script:

```python
#!/usr/bin/env python3
import io
import struct
import os
import sys


def unpack_ingenic_update(input: io.BytesIO, targetdir: str) -> None:
    os.makedirs(targetdir)

    input.read(40)
    while True:
        header = input.read(16)
        if len(header) < 16:
            break

        index, _, size, _ = struct.unpack('<LLLL', header)
        data = input.read(size)
        if len(data) < size:
            raise Exception(f'Unexpected end of data')

        path = os.path.join(targetdir, f'mtdblock{index}')
        with open(path, 'wb') as output:
            output.write(data)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} in-file target-dir', file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1], 'rb') as input:
        unpack_ingenic_update(input, sys.argv[2])
```

You will find some partitions rather tricky to unpack however.

### LZO-compressed partitions

Some partitions contain a file name at offset 34, typically `rootfs_camera.cpio`. These are LZO-compressed but lack the usual magic bytes. Instead, the first four bytes contain the size of compressed data in this partition. Once you replace these four bytes by `89 4c 5a 4f` (removing trailing junk is optional) the partition can be uncompressed with the regular `lzop` tool and the result fed into `cpio` to get the individual files.

### Ingenic’s jzlzma compression

Other Ingenic root partitions are more tricky. These also start with the data size but it is followed by the bytes `56 19 05 27` (that’s a uImage signature in reversed byte order). After that comes a compressed stream that sort of looks like LZMA but isn’t LZMA. What’s more: while binwalk will report that the Linux kernel is compressed via LZ4, it’s actually the same strange compression mechanism. The bootloader of these systems pre-dates the introduction of LZ4, so the same compression algorithm identifier was used for this compression mechanism that was later assigned to LZ4 by the upstream version of the bootloader.

What kind of compression is this? I’ve spent some time analyzing the bootloader but it turned out to be a red herring: apparently, the decompression is performed by hardware here, and the bootloader merely pushes the data into designated memory areas. Ugh!

At least the bootloader told me how it is called: jzlzma, which is apparently Ingenic’s proprietary LZMA variant. An LZMA header starts with a byte encoding some compression properties (typically `5D`), a 4 byte dictionary size and an 8 byte uncompressed size. Ingenic’s header is missing compression properties, and the uncompressed size is merely 4 bytes. But even accounting for these differences the stream cannot be decompressed with a regular LZMA decoder.

Luckily, with the algorithm name I found tools on Github that are meant to create firmware images for the Ingenic platform. These included an `lzma` binary which turned out to be an actual LZMA tool from 2005 hacked up to produce a second compressed stream in Ingenic’s proprietary format.

As I found, Ingenic’s format has essentially two differences to regular LZMA:

1. Bit order: Ingenic encodes bits within bytes in reverse order. Also, some of the numbers (not all of them) are written to the bit stream in reversed bit order.
2. Range coding: Ingenic doesn’t do any range coding, instead encoding all numbers verbatim.

That second difference essentially turns LZMA into LZ77. Clearly, the issue here was the complexity of implementing probabilistic range coding in hardware. Of course, that change makes the resulting algorithm produce considerably worse compression ratios than LZMA and even worse than much simpler LZ77-derived algorithms like deflate. And there is plenty of hardware to do deflate decompression. But at least they managed to obfuscate the data…

My original thought was “fixing” their stream and turning it into proper LZMA. But range coding is not only complex but also context-dependent, it cannot be done without decompressing. So I ended up just writing the decompression logic in Python which luckily was much simpler than doing the same thing for LZMA proper.

*Note*: The following script is minimalistic and wasn’t built for performance. Also, it expects a file that starts with a dictionary size (typically the bytes `00 00 01 00`), so if you have some header preceding it you need to remove it first. It will also happily “uncompress” any trailing junk you might have there.

```python
#!/usr/bin/env python3
import sys

kStartPosModelIndex, kEndPosModelIndex, kNumAlignBits = 4, 14, 4


def reverse_bits(n, bits):
    reversed = 0
    for i in range(bits):
        reversed <<= 1
        if n & (1 << i):
            reversed |= 1
    return reversed


def bit_stream(data):
    for byte in data:
        for bit in range(8):
            yield 1 if byte & (1 << bit) else 0


def read_num(stream, bits):
    num = 0
    for _ in range(bits):
        num = (num << 1) | next(stream)
    return num


def decode_length(stream):
    if next(stream) == 0:
        return read_num(stream, 3) + 2
    elif next(stream) == 0:
        return read_num(stream, 3) + 10
    else:
        return read_num(stream, 8) + 18


def decode_dist(stream):
    posSlot = read_num(stream, 6)
    if posSlot < kStartPosModelIndex:
        pos = posSlot
    else:
        numDirectBits = (posSlot >> 1) - 1
        pos = (2 | (posSlot & 1)) << numDirectBits
        if posSlot < kEndPosModelIndex:
            pos += reverse_bits(read_num(stream, numDirectBits), numDirectBits)
        else:
            pos += read_num(stream, numDirectBits -
                            kNumAlignBits) << kNumAlignBits
            pos += reverse_bits(read_num(stream, kNumAlignBits), kNumAlignBits)
    return pos


def jzlzma_decompress(data):
    stream = bit_stream(data)
    reps = [0, 0, 0, 0]
    decompressed = []
    try:
        while True:
            if next(stream) == 0:           # LIT
                byte = read_num(stream, 8)
                decompressed.append(byte)
            else:
                size = 0
                if next(stream) == 0:       # MATCH
                    size = decode_length(stream)
                    reps.insert(0, decode_dist(stream))
                    reps.pop()
                elif next(stream) == 0:
                    if next(stream) == 0:   # SHORTREP
                        size = 1
                    else:                   # LONGREP[0]
                        pass
                elif next(stream) == 0:     # LONGREP[1]
                    reps.insert(0, reps.pop(1))
                elif next(stream) == 0:     # LONGREP[2]
                    reps.insert(0, reps.pop(2))
                else:                       # LONGREP[3]
                    reps.insert(0, reps.pop(3))

                if size == 0:
                    size = decode_length(stream)

                curLen = len(decompressed)
                start = curLen - reps[0] - 1
                while size > 0:
                    end = min(start + size, curLen)
                    decompressed.extend(decompressed[start:end])
                    size -= end - start
    except StopIteration:
        return bytes(decompressed)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f'Usage: {sys.argv[0]} in-file.jzlzma out-file', file=sys.stderr)
        sys.exit(1)

    with open(sys.argv[1], 'rb') as input:
        data = input.read()
    data = jzlzma_decompress(data[8:])
    with open(sys.argv[2], 'wb') as output:
        output.write(data)
```

The uncompressed root partition can be fed into the regular `cpio` tool to get the individual files.

### Exotic Ingenic update

There was one update using a completely different format despite also being meant for the Ingenic hardware. This one started with the bytes `a5 ef fe 5a` and had a SquashFS image at offset `0x3000`. The unpacked contents (binwalk will do) don’t look like any of the other updates either: this definitely isn’t a camera, and it doesn’t have a PPPP implementation. Given the HDMI code I can only guess that this is a Network Video Recorder (NVR).

## But what about these security issues?

As to those security issues I am glad to report that VStarcam solved the telnet issue:

```sh
export PATH=/system/system/bin:$PATH
#telnetd
export LD_LIBRARY_PATH=/system/system/lib:/mnt/lib:$LD_LIBRARY_PATH
mount -t tmpfs none /tmp -o size=3m

/system/system/bin/brushFlash
/system/system/bin/updata
/system/system/bin/wifidaemon &
/system/system/bin/upgrade &
```

Yes, their startup script really has `telnetd` call commented out. At least that’s *usually* the case. There are updates from 2018 that are no longer opening the telnet port. There are other updates from 2025 that still do. Don’t ask me why. From what I can tell the hardcoded administrator credentials are still universally present but these are only problematic with the latter group.

It’s a similar story with the `system.ini` file that was accessible without authentication. Some firmware versions had this file moved to a different directory, others still have it in the web root. There is no real system behind it, and I even doubt that this was a security-induced change rather than an adjustment to a different hardware platform.
