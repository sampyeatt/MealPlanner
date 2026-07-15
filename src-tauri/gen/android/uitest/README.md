# MealPlanner instrumented UI test

`uitest` is a standalone, self-instrumenting Android module that holds the instrumented
smoke test for the Meal Planner app. It launches the app on a device/emulator and asserts
that its window (the Tauri/wry WebView) actually comes up.

## Why a separate module?

A Tauri (wry) app calls `std::process::exit` when its window is destroyed. If the test
lived in the app module's `androidTest`, AGP would force the instrumentation's
`targetPackage` to `com.sam.mealplanner` and run the test **inside the app's own process** —
so the app's normal self-termination at teardown would kill the test runner and the run
would be reported as **"Process crashed"** even though every assertion passed.

This module is its own tiny app (`applicationId com.sam.mealplanner.uitest`). Its
instrumentation targets itself, so the runner gets its **own process** and drives the real
app externally via **UiAutomator**. The app terminating no longer affects the runner.

## Prerequisites

1. The app under test must be installed on the device. It is after any:
   - `npm run tauri android dev`, or
   - `npm run tauri android build --debug --apk` followed by
     `adb install -r -t src-tauri/gen/android/app/build/outputs/apk/<abi>/debug/app-<abi>-debug.apk`
2. Env for building: `ANDROID_HOME`, `NDK_HOME`, and a JDK 17–21 (Android Studio's bundled
   JBR works; JDK 26 is too new for Gradle 8.14).

## Run it

**Android Studio:** open `src-tauri/gen/android` as the project, then right-click
`uitest/src/androidTest/.../MealPlannerLaunchTest` ▸ *Run*. (The app module still needs the
Tauri gradle files, which exist once you've run `tauri android build`/`dev` at least once.)

**Command line** (from `src-tauri/gen/android`):

```sh
./gradlew :uitest:connectedDebugAndroidTest
```

No NDK/Rust build is triggered — this module has no native code; it only drives the
already-installed app.
