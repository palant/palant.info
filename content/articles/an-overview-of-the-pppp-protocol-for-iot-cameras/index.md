---
title: "An overview of the PPPP protocol for IoT cameras"
date: 2025-11-05T16:11:36+0100
lastmod: '2025-12-08T22:15:37+0100'
description:
categories:
- security
- IoT
---

My [previous article on IoT “P2P” cameras](/2025/09/08/a-look-at-a-p2p-camera-lookcam-app/) couldn’t go into much detail on the PPPP protocol. However, there is already lots of security research on and around that protocol, and I have a feeling that there is way more to come. There are pieces of information on the protocol scattered throughout the web, yet every one approaching from a very specific narrow angle. This is my attempt at creating an overview so that other people don’t need to start from scratch.

While the protocol can in principle be used by any kind of device, so far I’ve only seen network-connected cameras. It isn’t really peer-to-peer as advertised but rather relies on central servers, yet the protocol allows to transfer the bulk of data via a direct connection between the client and the device. It’s hard to tell how many users there are but there are *lots* of apps, I’m sure that I haven’t found all of them.

There are other protocols with similar approaches being used for the same goal. One is used by ThroughTek’s Kalay Platform which [has the interesting string “Charlie is the designer of P2P!!” in its codebase](https://www.thirtythreeforty.net/posts/2020/05/hacking-reolink-cameras-for-fun-and-profit/#the-charlie-scrambler) (32 bytes long, seems to be used as “encryption” key for some non-critical functionality). I recognize both the name and the “handwriting,” it looks like PPPP protocol designer found a new home here. Yet PPPP seems to be still more popular than the competition, thanks to it being the protocol of choice for cheap low-end cameras.

*Disclaimer*: Most of the information below has been acquired by analyzing public information as well as reverse engineering applications and firmware, not by observing live systems. Consequently, there can be misinterpretations.

**Update** (2025-11-07): Added App2Cam Plus app to the table, representing a number of apps which all seem to be belong to ABUS Smartvest Wireless Alarm System.

**Update** (2025-11-07): This article originally grouped Xiaomi Home together with Yi apps. This was wrong, Xiaomi uses a completely different protocol to communicate with their PPPP devices. A brief description of this protocol has been added.

**Update** (2025-11-17): Added eWeLink, Owltron, littlelf and ZUMIMALL apps to the table.

**Update** (2025-12-08): Added Aqara Home, OMGuard HD, SmartLife - Smart Living apps to the table.

{{< toc >}}

## The general design

The protocol’s goal is to serve as a drop-in replacement for TCP. Rather than establish a connection to a known IP address (or a name to be resolved via DNS), clients connect to a device identifier. The abstraction is supposed to hide away how the device is located (via a server that keeps track of its IP address), how a direct communication channel is established (via [UDP hole punching](https://en.wikipedia.org/wiki/UDP_hole_punching)) or when one of multiple possible fallback scenarios is being used because direct communication is not possible.

The protocol is meant to be resilient, so there are usually three redundant servers handling each network. When a device or client needs to contact a server, it sends the same message to all of them and doesn’t care which one will reply. *Note*: In this article “network” generally means a PPPP network, i.e. a set of servers and the devices connecting to them. While client applications typically support multiple networks, devices are always associated with a specific one determined by [their device prefix](#the-device-ids).

For what is meant to be a [transport layer protocol](https://en.wikipedia.org/wiki/Transport_layer), PPPP has some serious complexity issues. It encompasses device discovery on the LAN via UDP broadcasts, UDP communication between device/client and the server and a number of (not exactly trivial) fallback solutions. It also features multiple “encryption” algorithms which are more correctly described as obfuscators and network management functionality.

Paul Marrapese’s [Wireshark Dissector](https://github.com/pmarrapese/iot/tree/master/p2p/dissector) provides an overview of the messages used by the protocol. While it isn’t quite complete, a look into the `pppp.fdesc` file shows roughly 70 different message types. It’s hard to tell how all these messages play together as the protocol has not been designed as a state machine. The protocol implementation uses its previous actions as context to interpret incoming messages, but it has little indication as to which messages are expected when. Observing a running system is essential to understanding this protocol.

The complicated message exchange required to establish a connection between a device and a client has been [described by Elastic Security Labs](https://www.elastic.co/security-labs/storm-on-the-horizon#building-a-p2p-client). They also provide the code of their client which implements that secret handshake.

I haven’t seen any descriptions of how the fallback approaches work when a direct connection cannot be established. Neither could I observe these fallbacks in action, presumably because the network I observed didn’t enable them. There are at least three such fallbacks: UDP traffic can be relayed by a network-provided server, it can be relayed by a “supernode” which is a device that agreed to be used as a relay, and it can be wrapped in a TCP connection to the server. The two centralized solutions incur significant costs for the network owners, rendering them unpopular. And I can imagine the “supernode” approach to be less than reliable with low-end devices like these cameras (it’s also a privacy hazard but this clearly isn’t a consideration).

I recommend going though the [CS2 sales presentation](https://prezi.com/5cztk-98izyc/cs2-network-p2p/) to get an idea of how the protocol is *meant* to work. Needless to say that it doesn’t always work as intended.

## The network ports

I could identify the following network ports being used:

* UDP 32108: broadcast to discover local devices
* UDP 32100: device/client communication to the server
* TCP 443: client communication to the server as fallback

Note that while port 443 is normally associated with HTTPS, here it was apparently only chosen to fool firewalls. The traffic is merely obfuscated, not really encrypted.

The direct communication between the client and the device uses a random UDP port. In my understanding the ports are also randomized when this communication is relayed by a server or supernode.

## The device IDs

The canonical representation of a device ID looks like this: `ABC-123456-VWXYZ`. Here `ABC` is a device prefix. While a PPPP network will often handle more than one device prefix, mapping a device prefix to a set of servers is supposed to be unambiguous. This rule isn’t enforced across different [protocol variants](#the-protocol-variants) however, e.g. the device prefix `EEEE` is assigned differently by CS2 and iLnk.

The six digit number following the device prefix allows distinguishing different devices within a prefix. It seems that vendors can choose these numbers freely – some will assign them to devices sequentially, others go by some more complicated rules. [A comment on my previous article](/2025/09/08/a-look-at-a-p2p-camera-lookcam-app/#c000003) even claims that they will sometimes reassign existing device IDs to new devices.

The final part is the verification code, meant to prevent enumeration of devices. It is generated by some secret algorithm and allows distinguishing valid device IDs from invalid ones. At least one such algorithm got leaked in the past.

Depending on the application a device ID will not always be displayed in its canonical form. It’s pretty typical for the dashes to be removed for example, in one case I saw the prefix being shortened to one letter. Finally, there are applications that will hide the device ID from the user altogether, displaying only some vendor-specific ID instead.

## The protocol variants

So far I could identify at least four variants of this protocol – if you count HLP2P which is questionable. These protocol implementations differ significantly and aren’t really compatible. A number of apps can work with different protocol implementations but they generally do it by embedding multiple client libraries.

| Variant       | Typical client library names | Typical functions |
|---------------|----------------------|-------------------|
| CS2 Network   | libPPCS_API.so libobject_jni.so librtapi.so | PPPP_Initialize PPPP_ConnectByServer |
| Yi Technology | PPPP_API.so libmiio_PPPP_API.so | PPPP_Initialize PPPP_ConnectByServer |
| iLnk          | libvdp.so libHiChipP2P.so | XQP2P_Initialize XQP2P_ConnectByServer HI_XQ_P2P_Init |
| HLP2P         | libobject_jni.so libOKSMARTPPCS.so | HLP2P_Initialize HLP2P_ConnectByServer |

### CS2 Network

The Chinese company CS2 Network is the original developer of the protocol. Their implementation can sometimes be recognized without even looking at any code just by their device IDs. The letters A, I, O and Q are never present in the verification code, there are only 22 valid letters here. Same seems to apply to the Yi Technology fork however which is generally very similar.

The other giveaway is the “init string” which encodes network parameters. Typically these init strings are hardcoded in the application (sometimes hundreds of them) and chosen based on device prefix, though some applications retrieve them from their servers. These init strings are obfuscated, with the function `PPPP_DecodeString` doing the decoding. The approach is typical for CS2 Network: a lookup table filled with random values and some random algebraic operations to make things seem more complex. The init strings look like this:

```
DRFTEOBOJWHSFQHQEVGNDQEXFRLZGKLUGSDUAIBXBOIULLKRDNAJDNOZHNKMJO:SECRETKEY
```

The part before the colon decodes into:

```
127.0.0.1,192.168.1.1,10.0.0.1,
```

This is a typical list of three server IPs. No, the trailing comma isn’t a typo but required for correct parsing. Host names are occasionally used in init strings but this is uncommon. With CS2 Network generally distrusting DNS from the looks of it, they probably recommend vendors to sidestep it. The “secret” key behind the colon is optional and activates [encryption of transferred data](/2025/09/08/a-look-at-a-p2p-camera-lookcam-app/#the-encryption) which is better described as obfuscation. Unlike the server addresses, this part isn’t obfuscated.

### Yi Technology

The Xiaomi spinoff Yi Technology appears to have licensed the code of the CS2 Network implementation. They made some moderate changes to it but it is still very similar to the original. For example, they still use the same code to decode init strings, merely with a different lookup table. Consequently, same init string as above would look slightly differently here:

```
LZERHWKWHUEQKOFUOREPNWERHLDLDYFSGUFOJXIXJMASBXANOTHRAFMXNXBSAM:SECRETKEY
```

As can be seen from Paul Marrapese’s [Wireshark Dissector](https://github.com/pmarrapese/iot/tree/master/p2p/dissector), the Yi Technology fork added a bunch of custom protocol messages and extended two messages presumably to provide forward compatibility. The latter is a rather unusual step for the PPPP ecosystem where the dominant approach seems to be “devices and clients connecting to the same network always use the same version of the client library which is frozen for all eternity.”

There is another notable difference: this PPPP implementation doesn’t contain any encryption functionality. There seems to be some AES encryption being performed at the application layer (which is the proper way to do it), I didn’t look too closely however.

### iLnk

The protocol fork developed by Shenzhen Yunni Technology iLnkP2P seems to have been developed from scratch. The device IDs for legacy iLnk networks are easy to recognize because their verification codes only consist of the letters A to F. The algorithm generating these verification codes is public knowledge (CVE-2019-11219) so we know that these are letters taken from an MD5 hex digest. New iLnk networks appear to have verification codes that can contain all Latin letters, some new algorithm replaced the compromised one here. Maybe they use Base64 digests now?

An iLnk init string can be recognized by the presence of a dash:

```
ATBBARASAXAOAQAOAQAOARBBARAZASAOARAWAYAOARAOARBBARAQAOAQAOAQAOAR-$$
```

The part before the dash decodes into:

```
3;127.0.0.1;192.168.1.1;10.0.0.1
```

Yes, the first list entry has to specify how many server IPs there are. The decoding approach (function `HI_DecStr` or `XqStrDec` depending on the implementation) is much simpler here, it’s a kind of Base26 encoding. The part after the dash can encode additional parameters related to validation of device IDs but typically it will be `$$` indicating that it is omitted and network-specific device ID validation can be skipped. As far as I can tell, iLnk networks will always send all data as plain text, there is no encryption functionality of any kind.

Going through the code, the network-level changes in the iLnk fork are extensive, with only the most basic messages shared with the original PPPP protocol. Some message types are clashing like for example `MSG_DEV_MAX` that uses the same type as `MSG_DEV_LGN_CRC` in the CS2 implementation. This fork also introduces new magic numbers: while PPPP messages normally start with `0xF1`, some messages here start with `0xA1` and one for some reason with `0xF2`.

Unfortunately, I haven’t seen any comprehensive analysis of this protocol variant yet, so I’ll just list the message types along with their payload sizes. For messages with 20 bytes payloads it can be assumed that the payload is a device ID. Don’t ask me why two pairs of messages share the same message type.

| Message       | Message type  | Payload size  |
|---------------|---------------|---------------|
| MSG_HELLO     | F1 00         | 0             |
| MSG_RLY_PKT   | F1 03         | 0             |
| MSG_DEV_LGN   | F1 10         | IPv4: 40<br>IPv6: 152 |
| MSG_DEV_MAX   | F1 12         | 20            |
| MSG_P2P_REQ   | F1 20         | IPv4: 36<br>IPv6: 152 |
| MSG_LAN_SEARCH| F1 30         | 0             |
| MSG_LAN_SEARCH_EXT | F1 32    | 0             |
| MSG_LAN_SEARCH_EXT_ACK | F1 33| 52            |
| MSG_DEV_UNREACH | F1 35       | 20            |
| MSG_PUNCH_PKT | F1 41         | 20            |
| MSG_P2P_RDY   | F1 42         | 20            |
| MSG_RS_LGN    | F1 60         | 28            |
| MSG_RS_LGN_EX | F1 62         | 44            |
| MSG_LST_REQ   | F1 67         | 20            |
| MSG_RLY_HELLO | F1 70         | 0             |
| MSG_RLY_HELLO_ACK | F1 71     | 0             |
| MSG_RLY_PORT  | F1 72         | 0             |
| MSG_RLY_PORT_ACK | F1 73      | 8             |
| MSG_RLY_PORT_EX_ACK | F1 76   | 264           |
| MSG_RLY_REQ_EX| F1 77         | 288           |
| MSG_RLY_REQ   | F1 80         | IPv4: 40<br>IPv6: 160 |
| MSG_HELLO_TO_ACK | F1 83      | 28            |
| MSG_RLY_RDY   | F1 84         | 20            |
| MSG_SDEV_LGN  | F1 91         | 20            |
| MSG_MGM_ADMIN | F1 A0         | 160           |
| MSG_MGM_DEVLIST_CTRL | F1 A2  | 20            |
| MSG_MGM_HELLO| F1 A4          | 4             |
| MSG_MGM_MULTI_DEV_CTRL | F1 A6| *variable*    |
| MSG_MGM_DEV_DETAIL | F1 A8    | 24            |
| MSG_MGM_DEV_VIEW | F1 AA      | 4             |
| MSG_MGM_RLY_LIST| F1 AC       | 12            |
| MSG_MGM_DEV_CTRL | F1 AE      | 24            |
| MSG_MGM_MEM_DB| F1 B0         | 264           |
| MSG_MGM_RLY_DETAIL| F1 B2     | 24            |
| MSG_MGM_ADMIN_LGOUT | F1 BA   | 4             |
| MSG_MGM_ADMIN_CHG | F1 BC     | 164           |
| MSG_VGW_LGN   | F1 C0         | 24            |
| MSG_VGW_LGN_EX| F1 C0         | 24            |
| MSG_VGW_REQ   | F1 C3         | 20            |
| MSG_VGW_REQ_ACK | F1 C4       | 4             |
| MSG_VGW_HELLO | F1 C5         | 0             |
| MSG_VGW_LST_REQ | F1 C6       | 20            |
| MSG_DRW       | F1 D0         | *variable*    |
| MSG_DRW_ACK   | F1 D1         | *variable*    |
| MSG_P2P_ALIVE | F1 E0         | 0             |
| MSG_P2P_ALIVE_ACK | F1 E1     | 0             |
| MSG_CLOSE     | F1 F0         | 0             |
| MSG_MGM_DEV_LGN_DETAIL_DUMP | F1 F4 | 12      |
| MSG_MGM_DEV_LGN_DUMP | F1 F4  | 12            |
| MSG_MGM_LOG_CTRL | F1 F7      | 12            |
| MSG_SVR_REQ   | F2 10         | 0             |
| MSG_DEV_LV_HB | A1 00         | 20            |
| MSG_DEV_SLP_HB| A1 01         | 20            |
| MSG_DEV_QUERY | A1 02         | 20            |
| MSG_DEV_WK_UP_REQ | A1 04     | 20            |
| MSG_DEV_WK_UP | A1 06         | 20            |


### HLP2P

While I’ve seen a few of apps with HLP2P code and the corresponding init strings, I am not sure whether these are still used or merely leftovers from some past adventure. All these apps use primarily networks that rely on other protocol implementations.

HLP2P init strings contain a dash which follows merely three letters. These three letters are ignored and I am unsure about their significance as I’ve only seen one variant:

```
DAS-0123456789ABCDEF
```

The decoding function is called from `HLP2P_Initialize` function and uses the most elaborate approach of all. The hex-encoded part after the dash is decrypted using AES-CBC where the key and initialization vector are derived from a zero-filled buffer via some bogus MD5 hashing. The decoded result is a list of comma-separated parameters like:

```
DCDC07FF,das,10000001,a+a+a,127.0.0.1-192.168.1.1-10.0.0.1,ABC-CBA
```

The fifth parameter is a list of server IP addresses and the sixth appears to be the list of supported device prefixes.

On the network level HLP2P is an oddity here. Despite trying hard to provide the same API as other PPPP implementations, including concepts like init strings and device IDs, it appears to be a TCP-based protocol (connecting to server’s port 65527) with little resemblance to PPPP. UDP appears to be used for local broadcasts only (on port 65531). I didn’t spend too much time on the analysis however.

## “Encryption”

The CS2 implementation of the protocol is the only one that bothers with encrypting data, though their approach is better described as obfuscation. When encryption is enabled, the function `P2P_Proprietary_Encrypt` is applied to all outgoing and the function `P2P_Proprietary_Decrypt` to all incoming messages. These functions take the encryption key (which is visible in the application code as an unobfuscated part of the init string) and mash it into four bytes. These four bytes are then used to select values from a static table that the bytes of the message should be XOR’ed with.

There is at least one [public implementation of this “encryption”](https://github.com/datenstau/A9_PPPP/blob/c29d1eaccd11794a4cc022cf4ca90b7352920bc1/crypt.js) though this one chose to skip the “key mashing” part and simply took the resulting four bytes as its key. A number of articles mention having implemented this algorithm however, it’s not really complicated.

The same obfuscation is used unconditionally for TCP traffic (TCP communication on port 443 as fallback). Here each message header contains two random bytes. The hex representation of these bytes is used as key to obfuscate message contents.

All `*_CRC` messages like `MSG_DEV_LGN_CRC` have an additional layer of obfuscation, performed by the functions `PPPP_CRCEnc` and `PPPP_CRCDec`. Unlike `P2P_Proprietary_Encrypt` which is applied to the entire message including the header, `PPPP_CRCEnc` is only applied to the payload. As normally only messages exchanged between the device and the server are obfuscated in this way, the corresponding key tends to be contained only in the device firmware and not in the application. Here as well the key is mashed into four bytes which are then used to generate a byte sequence that the message (extended by four `+` signs) is XOR’ed with. This is effectively an [XOR cipher](https://en.wikipedia.org/wiki/XOR_cipher) with a static key which is easy to crack even without knowing the key.

## “Secret” messages

The CS2 implementation of the protocol contains a curiosity: two messages starting with `338DB900E559` being processed in a special way. No, this isn’t a hexadecimal representation of the bytes – it’s literally the message contents. No magic bytes, no encryption, the messages are expected to be 17 bytes long and are treated as zero-terminated strings.

I tried sending `338DB900E5592B32` (with a trailing zero byte) to a PPPP server and, surprisingly, received a response (non-ASCII bytes are represented as escape sequences):

```
\x0e\x0ay\x07\x08uT_ChArLiE@Cs2-NeTwOrK.CoM!
```

This response was consistent for this server, but another server of the same network responded slightly differently:

```
\x0e\x0ay\x07\x08vT_ChArLiE@Cs2-NeTwOrK.CoM!
```

A server from a different network which normally encrypts all communication also responded:

```
\x17\x06f\x12fDT_ChArLiE@Cs2-NeTwOrK.CoM!
```

It doesn’t take a lot of cryptanalysis knowledge to realize that an [XOR cipher](https://en.wikipedia.org/wiki/XOR_cipher) with a constant key is being applied here. Thanks to my “razor sharp deduction” I could conclude that the servers are replying with their respective names and these names are being XOR’ed with the string `CS2MWDT_ChArLiE@Cs2-NeTwOrK.CoM!`. Yes, likely the very same Charlie already mentioned at the start of this article. Hi, Charlie!

I didn’t risk sending the other message, not wanting to shut down a server accidentally. But maybe Shodan wants to extend their method of detecting PPPP servers: their current approach only works when no encryption is used, yet this message seems to get replies from all CS2 servers regardless of encryption.

## Applications

Once a connection between the client and the device is established, `MSG_DRW` messages are exchanged in both directions. The messages will be delivered in order and retransmitted if lost, giving application developers something resembling a TCP stream if you don’t look too closely. In addition, each message is tagged with a channel ID, a number between 0 and 7. It looks like channel IDs are universally ignored by devices and are only relevant in the other direction. The idea seems to be that a client receiving a video stream should still be able to send commands to the device and receive responses over the same connection.

The PPPP protocol doesn’t make any recommendations about how applications should encode their data within that stream, and so they developed a number of wildly different application-level protocols. As a rule of thumb, all devices and clients on a particular PPPP network will always speak the same application-level protocol, though there might be slight differences in the supported capabilities. Different networks can share the same protocol, allowing them to be supported within the same application. Usually, there will be multiple applications implementing the same application-level protocol and working with the same PPPP networks, but I haven’t yet seen any applications supporting different protocols.

This allows grouping the applications by their application-level protocol. Applications within the same group are largely interchangeable, same devices can be accessed from any application. This doesn’t necessarily mean that everything will work correctly, as there might still be subtle differences. E.g. an application meant for visual doorbells probably accesses somewhat different functionality than one meant for security cameras even if both share the same protocol. Also, devices might be tied to the cloud infrastructure of a specific application, rendering them inaccessible to other applications working with the same PPPP network.

Fun fact: it is often *very* hard to know up front which protocol your device will speak. There is a [huge thread](https://community.home-assistant.io/t/popular-a9-mini-wi-fi-camera-the-ha-challenge/230108) with many spin-offs where people are attempting to reverse engineer A9 Mini cameras so that these can be accessed without an app. This effort is being massively complicated by the fact that all these cameras look basically the same, yet depending on the camera one out of at least four extremely different protocols could be used: HDWifiCamPro variant of SHIX JSON, YsxLite variant of iLnk binary, JXLCAM variant of CGI calls, or some protocol I don’t know because it isn’t based on PPPP.

The following is a list of PPPP-based applications I’ve identified so far, at least the ones with noteworthy user numbers. Mind you, these numbers aren’t necessarily indicative of the number of PPPP devices – some applications listed only use PPPP for some devices, likely using other protocols for most of their supported devices (particularly the ones that aren’t cameras). I try to provide a brief overview of the application-level protocol in the footnotes. *Disclaimer*: These applications tend to support a huge number of device prefixes in theory, so I mostly chose the “typical” ones based on which ones appear in YouTube videos or GitHub discussions.

| Application | Typical device prefixes | Application-level protocol |
|-------------|-------------------------|----------------------------|
| [Xiaomi Home](https://play.google.com/store/apps/details?id=com.xiaomi.smarthome) | XMSYSGB | JSON (MISS) [^0] |
| [Kami Home](https://play.google.com/store/apps/details?id=com.yitechnology.kamihome)<br>[Yi Home](https://play.google.com/store/apps/details?id=com.ants360.yicamera.international)<br>[Yi iot](https://play.google.com/store/apps/details?id=com.yunyi.smartcamera) | TNPCHNA TNPCHNB TNPUSAC TNPUSAM TNPXGAC | binary [^1] |
| [littlelf smart](https://play.google.com/store/apps/details?id=com.littlelf.smarthome)<br>[Owltron](https://play.google.com/store/apps/details?id=com.aytarr.smarthome)<br>[SmartLife - Smart Living](https://play.google.com/store/apps/details?id=com.tuya.smartlife)<br>[Tuya - Smart Life,Smart Living](https://play.google.com/store/apps/details?id=com.tuya.smart) | TUYASA | binary (Thing SDK / Tuya SDK) [^2] |
| [365Cam](https://play.google.com/store/apps/details?id=shix.cam365.camera)<br>[CY365](https://play.google.com/store/apps/details?id=shix.cy.camera)<br>[Goodcam](https://play.google.com/store/apps/details?id=shix.good.cam)<br>[HDWifiCamPro](https://play.google.com/store/apps/details?id=com.shix.qhipc)<br>[PIX-LINK CAM](https://play.google.com/store/apps/details?id=shix.pixlink.camera)<br>[VI365](https://play.google.com/store/apps/details?id=shix.vi.camera)<br>[X-IOT CAM](https://play.google.com/store/apps/details?id=shix.go.zoom) | DBG DGB DGO DGOA DGOC DGOE NMSA PIXA PIZ | JSON (SHIX) [^3] |
| [eWeLink - Smart Home](https://play.google.com/store/apps/details?id=com.coolkit) | EWLK | binary (iCareP2P) [^3.5] |
| [Eye4](https://play.google.com/store/apps/details?id=vstc.vscam.client)<br>[O-KAM Pro](https://play.google.com/store/apps/details?id=com.okampro.oksmart)<br>[Veesky](https://play.google.com/store/apps/details?id=object.pnpcam3.client) | EEEE VSTA VSTB VSTC VSTD VSTF VSTJ | CGI calls [^4] |
| [CamHi](https://play.google.com/store/apps/details?id=com.hichip)<br>[CamHipro](https://play.google.com/store/apps/details?id=com.hichip.campro) | AAFF EEEE MMMM NNNN PPPP SSAA SSAH SSAK SSAT SSSS TTTT | binary [^5] |
| [CloudEdge](https://play.google.com/store/apps/details?id=com.cloudedge.smarteye)<br>[ieGeek Cam](https://play.google.com/store/apps/details?id=com.iegeekCam.cam)<br>[ZUMIMALL](https://play.google.com/store/apps/details?id=com.zumimall.protecthome) | ECIPCM | binary (Meari SDK) [^6] |
| [YsxLite](https://play.google.com/store/apps/details?id=com.ysxlite.cam) | BATC BATE PTZ PTZA PTZB TBAT | binary (iLnk) [^7] |
| [FtyCamPro](https://play.google.com/store/apps/details?id=com.fty.cam) | FTY FTYA FTYC FTZ FTZW | binary (iLnk) [^8] |
| [JXLCAM](https://play.google.com/store/apps/details?id=com.rtp2p.jxlcam) | ACCQ BCCA BCCQ CAMA | CGI calls [^9] |
| [LookCam](https://play.google.com/store/apps/details?id=com.view.ppcs) | BHCC FHBB GHBB | JSON [^10] |
| [HomeEye](https://play.google.com/store/apps/details?id=shix.homeeye.camera)<br>[LookCamPro](https://play.google.com/store/apps/details?id=com.shix.lookcam)<br>[StarEye](https://play.google.com/store/apps/details?id=shix.stareye.camera) | AYS AYSA TUT | JSON (SHIX) [^11] |
| [minicam](https://play.google.com/store/apps/details?id=com.rtp2p.minicam) | CAM888 | CGI calls [^12] |
| [Aqara Home](https://play.google.com/store/apps/details?id=com.lumiunited.aqarahome.play) | *unknown* | JSON [^12.5] |
| [App2Cam Plus](https://play.google.com/store/apps/details?id=com.abus.app2camplus.gcm)<br>[OMGuard HD](https://play.google.com/store/apps/details?id=com.p2pcamera.app02hd) | CGAG CGYU CHXX CMAG CTAI WGAG | binary (Jsw SDK) [^13] |

[^0]: Each message starts with a 4 byte command ID. The initial authorization messages (command ID `0x100` and `0x101`) contain plain JSON data. Other messages contain ChaCha20-encoded data: first 8 bytes nonce, then the ciphertext. The encryption key is negotiated in the authorization phase. The decrypted plaintext again starts with a [4 byte command ID](https://github.com/MiEcosystem/miot-plugin-sdk/blob/e4883f6f58528cdae9ef632a011ab11ad4b4d023/miot-sdk/service/miotcamera.js#L17), followed by JSON data. There is even some [Chinese documentation of this interface](https://iot.mi.com/new/doc/accesses/direct-access/extension-development/extension-functions/p2p) though it is rather underwhelming.
[^1]: The device-side implementation of the protocol is [available on the web](https://github.com/frankzhangshcn/p2p_tnp/blob/191f2e7c4841ab6113ad6fa4b80affbd4cad556c/p2p_tnp.c#L7308). This doesn’t appear to be reverse engineered, it’s rather the source code of the real thing complete with Chinese comments. No idea who or why published this, I found it linked by the people who develop own changes to the stock camera firmware. The extensive `tnp_eventlist_msg_s` structure being sent and received here supports a large number of commands.
[^2]: Each message is preceded by a 16 byte header: `78 56 34 12` magic bytes, request ID, command ID, payload size. This is a very basic interface exposing merely 10 commands, most of which are requesting device information while the rest control video/audio playback. As Tuya SDK also communicates with devices by means other than PPPP, more advanced functionality is probably exposed elsewhere.
[^3]: Messages are preceded by an 8 byte binary header: `06 0A A0 80` magic bytes, four bytes payload size (there is [a JavaScript-based implementation](https://github.com/datenstau/A9_PPPP/blob/c29d1eaccd11794a4cc022cf4ca90b7352920bc1/pppp.js#L234)). The SHIX JSON format is a translation of [this web API interface](https://wiki.instar.com/dl/Developer/INSTAR_CGI_MJPEG_Chipset_English.pdf): `/check_user.cgi?user=admin&pwd=pass` becomes `{"pro": "check_user", "cmd": 100, "user": "admin", "pwd": "pass"}`. The `pro` and `cmd` fields are redundant, representing a command both as a string and as a number.
[^3.5]: Each message is preceded by a 24 byte header starting with the magic bytes `88 88 76 76`, payload size and command ID. The other 12 bytes of the header are unused. More than 60 command IDs are supported, each with its own binary payload format. Some very basic commands have been documented in a [HomeAssistant component](https://github.com/AlexxIT/SonoffLAN/blob/f7700563896b06b932cd670ddbdb342197d41217/custom_components/sonoff/core/ewelink/camera.py#L17).
[^4]: The binary message headers are similar to the ones used by apps like 365Cam: `01 0A 00 00` magic bytes, four bytes payload size. The payload is however a web request loosely based on [this web API interface](https://wiki.instar.com/dl/Developer/INSTAR_CGI_MJPEG_Chipset_English.pdf): `GET /check_user.cgi?loginuse=admin&loginpas=pass&user=admin&pwd=pass`. Yes, user name and password are duplicated, probably because not all devices expect `loginuse`/`loginpas` parameters? You can see in [this article](https://x9security.com/vstarcam-an-investigative-security-journey-part-1-by-redcodefinal/#:~:text=UDP%20GET%20Requests) what the requests looks like.
[^5]: The 24 byte header preceding messages is similar to eWeLink: magic bytes `99 99 99 99`, payload size and command ID. The other 12 bytes of the header are unused. Not trusting PPPP, CamHi encrypts the payload using AES. It looks like the encryption key is an MD5 hash of a string containing the user name and password among other things. Somebody published some [initial insights into the application code](https://github.com/0xedh/hichip-p2p-firmware-rce#CamHI).
[^6]: Each message is preceded by a 52 byte header starting with the magic bytes `56 56 50 99`. Bulk of this header is taken up by an authentication token: a SHA1 hex digest hashing the username (always admin), device password, sequence number, command ID and payload size. The implemented interface provides merely 14 very basic commands, essentially only exposing access to recordings and the live stream. So the payload even where present is something trivial like a date. As Meari SDK also communicates with devices by means other than PPPP, more advanced functionality is probably exposed elsewhere.
[^7]: The commands and their binary representation are contained within `libvdp.so` which is the iLnk implementation of the PPPP protocol. Each message is preceded by a 12 bytes header starting with the `11 0A` magic bytes. The commands are two bytes long with the higher byte indicating the command type: 2 for SD card command, 3 for A/V command, 4 for file command, 5 for password command, 6 for network command, 7 for system command.
[^8]: While FtyCamPro app handles different networks than YsxLite, it relies on the same `libvdp.so` library, meaning that the application-level protocol should be the same. It’s possible that some commands are interpreted differently however.
[^9]: The protocol is very similar to the one used by VStarcam apps like O-KAM Pro. The payload has only one set of credentials however, the parameters `user` and `pwd`. It’s also a far more limited and sometimes different set of commands.
[^10]: Each message is wrapped in binary data: a prefix starting with `A0 AF AF AF` before it, the bytes `F4 F3 F2 F1` after. For some reason the prefix length seems to be different depending on whether the message is sent to the device (26 bytes) or received from it (25 bytes). I don’t know what most of it is yet everything but the payload length at the end of the prefix seems irrelevant. [This Warwick University paper](https://www.dcs.warwick.ac.uk/~fenghao/files/hidden_camera.pdf) has some info on the JSON payload. It’s particularly notable that the password sent along with each command isn’t actually being checked.
[^11]: LookCamPro & Co. share significant amounts of code with the SHIX apps like 365Cam, they implement basically the same application-level protocol. There are differences in the supported commands however. It’s difficult to say how significant these differences are because all apps contain significant amounts of dead code, defining commands that are never used and probably not even supported.
[^12]: The minicam app seems to use almost the same protocol as VStarcam apps like O-KAM Pro. It handles other networks however. Also, a few of the commands seem different from the ones used by O-KAM Pro, though it is hard to tell how significant these incompatibilities really are.
[^12.5]: The JSON data containing command parameters is preceded by a 16 bytes header containing command ID, payload length and two other values that are ignored other than being quoted verbatim in the response. Commands sent to the device always have even IDs, for the reponse the device increases the command ID by 1. The 14 exposed commands seem to be all dealing with audio/video streams and playback controls. Camera configuration must be done by other means.
[^13]: Each message is preceded by a 4 bytes header: 3 bytes payload size, 1 byte I/O type (1 for AUTH, 2 for VIDEO, 3 for AUDIO, 4 for IOCTRL, 5 for FILE). The payload starts with a type-specific header. If I read the code correctly, the first 16 bytes of the payload are encrypted with AES-ECB (unpadded) while the rest is sent unchanged. There is an “xor byte” in the payload header which is changed with every request seemingly to avoid generating identical ciphertexts. Payloads smaller than 16 bytes are not encrypted. I cannot see any initialization of the encryption key beyond filling it with 32 zero bytes, which would mean that this entire mechanism is merely obfuscation.
