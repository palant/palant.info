---
title: "Reverse engineering a Unity-based Android game"
date: 2021-02-18T13:53:18+0100
description:
categories:
- unity
- android
- reverse-engineering
---

My child is playing an Android game that asks for microphone access. And while it doesn’t insist on it and the privacy policy says that no recordings are being kept, I thought that I would take a closer look. The process turned out rather complicated thanks to the fact that the game was built with the Unity framework. Since I have little experience with games in general and Android applications in particular, I thought that I would document the analysis steps here. And maybe this turns out useful for other people as well.

{{< toc >}}

## Getting started

First you need the package of the application. Google Play won’t let you download it, but it’s still useful to locate the application there first. The application ID will be in the page address, for example `com.example.funnygame`. You can search for this ID along with the keyword “APK”, it will give you one of the websites providing Android application packages for download.

So now you have `game.apk`. It’s a regular ZIP file but its contents aren’t very useful still. So the first step is running [apktool](https://ibotpeaches.github.io/Apktool/) on it:

    apktool d -o game-apktool game.apk

This will unpack the package into a directory named `game-apktool`. It will also decode various XML files such as `AndroidManifest.xml`. And it will translate the code into Smali which is a kind of assembler language.

Smali is fairly readable but I still prefer “proper” Java code. I can get it by turning the code into a regular Java JAR file using [dex2jar](https://github.com/pxb1988/dex2jar) first:

    d2j-dex2jar.sh -f game.apk

Now I have `game-dex2jar.jar` containing Java classes, without any of the non-code files. Next step is using a Java decompiler. My tool of choice so far is [Procyon Decompiler](https://github.com/mstrobel/procyon):

    java -jar procyon-decompiler.jar -o game-procyon game-dex2jar.jar

This took a while and hanged up for a particular class for me. Procyon Decompiler doesn’t have the option to exclude a single class, so I removed it from the JAR file. This allowed decompilation to complete.

Now I have a `game-procyon` directory with the easy to read but not always entirely correct Java code of the game. The `game-apktool` directory is more complete, and its Smali code is more reliable because closer to the source.

## Obvious potential vulnerabilities

While I don’t have much experience with Android vulnerabilities, I know that one typical vulnerability are exposed application components. These can be triggered by other applications in order to abuse application’s privileged access.

Many of the potentially affected components are visible in the `AndroidManifest.xml` file. The rules for tags like `<receiver>`, `<service>` or `<provider>` are: these aren’t accessible to other applications by default. In order to be exposed, they either need an `android:exported="true"` attribute or an `<intent-filter>` child. The game in question had an unintentionally exposed service:

{{< highlight xml >}}
<service android:name=".MyFirebaseMessagingService">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT"/>
    </intent-filter>
</service>
{{< /highlight >}}

As stated in [the documentation](https://firebase.google.com/docs/reference/android/com/google/firebase/messaging/FirebaseMessagingService), this should have an explicit `android:exported="false"` attribute. Without it, this service can be triggered by any application due to the intent filter. The developers clearly didn’t expect this in their code.

Components not listed in the manifest can be exposed as well. For example, [Content.registerReceiver()](https://developer.android.com/reference/android/content/Context#registerReceiver(android.content.BroadcastReceiver,%20android.content.IntentFilter)) will add a receiver dynamically. In this game I also found a dynamic receiver which would accept data without proper validation.

Now it’s one thing that these components receive data they didn’t expect. Actually proving that these are exploitable is much more complicated and outside the scope of this article.

## What is using the microphone?

The `AndroidManifest.xml` file requests permission to access the microphone:

{{< highlight xml >}}
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
{{< /highlight >}}

The code needs to request this permission explicitly, so looking for `android.permission.RECORD_AUDIO` in the decompiled Java code is a good start. This quickly brings up the class implementing microphone access. The only problem: it doesn’t appear to be used anywhere.

So this class is being called via the Java reflection API which complicates affairs. A search for the class name in the `game-apktool` directory finds it in the `global-metadata.dat` file. The conclusion is: this is being called from inside the Unity engine. So there is no way around understanding its code as well. This is relevant for the impact of the vulnerabilities above as well.

## Locating code run by the Unity engine

Looking around the decompiled Java code, it’s pretty obvious that almost all of it is related to “analytics” and advertising. There is a bit of code related to the Unity engine but all of the game logic is elsewhere.

I found articles explaining that Unity is based on .NET and there is supposed to be a file `assets/bin/Data/Managed/Assembly-CSharp.dll` in the package. Unity then uses Mono to run .NET code. Sounds good as .NET code is compiled to an intermediate language which can be decompiled fairly well, similarly to compiled Java.

Trouble is: there is no such file in this game. In fact, there are no DLL files at all here. The names of the DLL files appear in some asset files, which led me to the crazy suspicion that the DLL files are stored as assets and unpacked at runtime. A detour through the [assets file format](https://wiki.xentax.com/index.php/Unity_Assets) allowed me to extract the files contained here and confirmed that the DLLs are merely being referenced.

Finally I realized that the game developers used [il2cpp](https://docs.unity3d.com/Manual/IL2CPP-HowItWorks.html) here which provides an alternative to executing via Mono. This approach compiles code from the intermediate language further into native code. Here, the result was a library called `libil2cpp.so`. Most strings used here were stored separately in a `global-metadata.dat` file.

## Decompiling managed code

The tool of choice to make sense of `libil2cpp.so` appears to be [Il2CppInspector](https://github.com/djkaty/Il2CppInspector). While it cannot revert the compilation, it will recover the entire class structure of the managed code. So it will provide the correct name and parameters for each function in the library.

Next step is using reverse engineering software. Il2CppInspector can output data for IDA Pro which is likely a nice tool (it certainly was a decade ago). Maybe once I reverse engineer binaries every day I’ll spend several thousands on a license. In the meantime, [Ghidra](https://ghidra-sre.org/) is available for free and supported by Il2CppInspector as well.

So the command to generate the necessary data (assuming that `libil2cpp.so` and `global-metadata.dat` are in the current directory) is:

    Il2CppInspector-cli.exe -p il2cpp.py -t Ghidra

This will give you among other things a `types.cs` file which isn’t required by Ghidra but is a nice reference for you. The process of importing data into Ghidra [isn’t entirely trivial](https://github.com/djkaty/Il2CppInspector#adding-metadata-to-your-ghidra-workflow): one has to add `cpp/appdata/il2cpp-types.h` to the list of C sources to be parsed, after which `il2cpp.py` can be run via Script Manager. I also had to correct the path to `metadata.json` in this Python script as it was specific to Windows and invalid on Linux.

While it took a while, I got decompiled C++ code for all functions here. This is great as I don’t actually know ARM assembler and attempting to read it would have been rather slow.

## Typical code patterns

The resulting code is fairly readable out of the box but less intelligible than decompiled C# code of course. Functions have two “additional” parameters: in non-static methods `this` pointer becomes the first parameter, and all functions get a `MethodInfo` instance as last parameter. Some .NET concepts result in rather verbose patterns however. It helps looking at the `il2cpp-codegen.h` file to see what functions have been called or inlined here. For example, each method starts with something like:

{{< highlight cpp >}}
if ((DAT_12344321 & 1) == 0) {
  FUN_87654321(0x1234);
  DAT_12344321 = 1;
}
{{< /highlight >}}

`FUN_87654321` can be renamed into `il2cpp_codegen_initialize_method` and the code block safely ignored. Its purpose is one-time generation of method metadata.

Another pattern:

{{< highlight cpp >}}
method_01 = (MethodInfo *)0x0;
this_02 = (SomeClass *)thunk_FUN_12345678(SomeClass__TypeInfo);
SomeClass__ctor(this_02, param, method_01);
{{< /highlight >}}

This is a class instantiation, the equivalent of `new SomeClass(param)` in C#. `thunk_FUN_12345678` can be renamed into `il2cpp_codegen_object_new`, it allocates a new object before the constructor is executed.

Calls to static or non-virtual methods are rather straightforward. Typical calls to virtual methods are more convoluted:

{{< highlight cpp >}}
velocity = (*(pTVar2->klass->vtable).get_Velocity.methodPtr)
                       (pTVar2,(pTVar2->klass->vtable).get_Velocity.method);
{{< /highlight >}}

This looks up the getter of the `Velocity` property in the object’s vtable and calls the function pointer.

And here is a more complicated specimen:

{{< highlight cpp >}}
if (obj == (Object *)0x0) {
                           /* WARNING: Subroutine does not return */
  FUN_11223344(0);
}
pOVar8 = obj->klass;
bVar1 = (SomeClass__TypeInfo->_1).typeHierarchyDepth;
if (((pOVar8->_1).typeHierarchyDepth < bVar1) ||
   ((pOVar8->_1).typeHierarchy[(ulong)bVar1 - 1] != (Il2CppClass *)SomeClass__TypeInfo)) {
  FUN_44332211((pOVar8->_0).element_class);
  uVar4 = FUN_14412332(local_38);
                           /* WARNING: Subroutine does not return */
  FUN_23321441(uVar4,0,0);
}
{{< /highlight >}}

Turns out, this is merely one line of C# code, namely a type cast: `(SomeClass)obj`. This is pretty much the `Unbox` function from `il2cpp-codegen.h` inlined. First there is a null check, so `FUN_11223344` can be renamed into `il2cpp::vm::Exception::RaiseNullReferenceException`. Then there is a check for a type mismatch, resulting in a type cast exception. So `FUN_44332211` can be renamed into `il2cpp::vm::Exception::FormatInvalidCastException`, `FUN_14412332` into `il2cpp::vm::Exception::GetInvalidCastException` and `FUN_23321441` into `il2cpp::vm::Exception::Raise`.

One more typical block of code:

{{< highlight cpp >}}
if (((*(byte *)&(SomeType__TypeInfo->_1).field_0x5f >> 1 & 1) != 0) &&
     ((SomeType__TypeInfo->_1).cctor_finished == 0)) {
   FUN_ABCDEFAB((Il2CppClass *)SomeType__TypeInfo);
}
{{< /highlight >}}

A look into `il2cpp-codegen.h` reveals that this is the `IL2CPP_RUNTIME_CLASS_INIT` macro and the function called here is named `il2cpp::vm::Runtime::ClassInit`. Another one-time initialization block that can be ignored.

Finally, this construct had me thoroughly confused:

{{< highlight cpp >}}
plVar7 = (long *)(**(code **)method->klass->rgctx_data[8])(this);
{{< /highlight >}}

The only usable information on `rgctx_data` I could find is that it holds extension methods. However, the class in question didn’t have any extension methods. I rather guessed that this is some kind of dynamic type cast, and I also guessed the type this is casting to. Setting the right type for `plVar7` made the following code readable. I’d still like to know how to progress here without guessing.
