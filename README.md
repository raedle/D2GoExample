# D2Go Example

The repository contains code for a [PlayTorch](https://playtorch.dev/) object detection prototype. The prototype uses a quantized [D2Go model](https://github.com/facebookresearch/d2go) for the object detection task and runs on-device. It runs on Android and iOS.

**NOTE: This example uses an unreleased version of PlayTorch including a complete PyTorch Mobile Module API.**

## How was this project bootstrapped?

The project was bootstrapped with the following command:

```
npx torchlive-cli init D2GoExample
```

Unused packages were removed.

# Run project in emulator or on a device

## Prerequisites

Install React Native development depencencies. Follow the instructions for [Setting up the development environment](https://reactnative.dev/docs/environment-setup) as provided on the React Native website.

## Install project dependencies

Run `yarn install` to install the project dependencies.

## Start Metro server

Start the Metro server, which is needed to build the app bundle (containing the transpiled TypeScript code in the `<PROJECT>/src` directory).

```
yarn start
```

## Android

Build the `apk` for Android and install and run on the emulator (or on a physical device if connected via USB).

```
yarn android
```

See instructions on the React Native website for how to build the app in release variant.

## iOS

Install CocoaPod dependencies

```shell
(cd ios && pod install)
```

Build the prototype app for iOS and run it in the simulator.

```shell
yarn ios
```

or use the following command to open the Xcode workspace in Xcode to build and run it.

```shell
xed ios/D2GoExample.xcworkspace
```

See instructions on the React Native website for how to build the app in release scheme.
