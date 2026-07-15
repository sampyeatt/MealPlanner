package com.sam.mealplanner.uitest

import android.content.Intent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented smoke test for the Meal Planner Tauri app.
 *
 * Launches the app on a connected device / emulator and verifies that its window — the
 * wry WebView surface — actually comes up on screen. It runs out-of-process (this module
 * is self-instrumenting) and drives the app via UiAutomator, so the app's normal
 * self-termination (a Tauri app calls std::process::exit when its window closes) cannot
 * crash the test runner.
 *
 * Prerequisite: the app must already be installed on the device (it is after any
 * `tauri android build` / `tauri android dev`, or `adb install app-<abi>-debug.apk`).
 *
 * Run from Android Studio (right-click ▸ Run) or:
 *   ./gradlew :uitest:connectedDebugAndroidTest
 */
@RunWith(AndroidJUnit4::class)
class MealPlannerLaunchTest {

    private val appPackage = "com.sam.mealplanner"
    private val launchTimeoutMs = 45_000L

    private lateinit var device: UiDevice

    @Before
    fun goHome() {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        device.pressHome()
        val launcher = device.launcherPackageName
        assertNotNull("Device has no launcher package.", launcher)
        device.wait(Until.hasObject(By.pkg(launcher).depth(0)), launchTimeoutMs)
    }

    @Test
    fun appLaunches_andWindowIsShown() {
        val context = InstrumentationRegistry.getInstrumentation().context
        val intent = context.packageManager.getLaunchIntentForPackage(appPackage)
            ?: throw AssertionError(
                "No launch intent for $appPackage — install the app first " +
                    "(e.g. `tauri android build` then adb install, or `tauri android dev`).",
            )
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        context.startActivity(intent)

        // The app's window (wry Activity + WebView surface) is on screen once UiAutomator
        // can see a node belonging to our package.
        val appeared = device.wait(Until.hasObject(By.pkg(appPackage).depth(0)), launchTimeoutMs)

        assertTrue(
            "The $appPackage window did not appear within ${launchTimeoutMs}ms — " +
                "the Tauri app failed to launch.",
            appeared,
        )
        assertTrue(
            "Expected $appPackage to be the foreground app after launch.",
            device.hasObject(By.pkg(appPackage)),
        )
    }
}
