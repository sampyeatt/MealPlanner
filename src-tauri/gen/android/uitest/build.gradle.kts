plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

/**
 * Standalone, self-instrumenting UI-test module for the Meal Planner app.
 *
 * This is a tiny app of its own (applicationId com.sam.mealplanner.uitest) that contains
 * no production code — only an instrumented UiAutomator test. Because its androidTest
 * instrumentation targets THIS module (not com.sam.mealplanner), the test runner executes
 * in its own process and drives the real app as an external application.
 *
 * Why it's a separate module: a Tauri (wry) app calls std::process::exit when its window
 * is destroyed. If the test ran inside the app module's androidTest, AGP would force the
 * instrumentation's targetPackage to com.sam.mealplanner and load the runner into the app's
 * own process — so the app's self-termination at teardown would kill the runner and the run
 * would be reported as "Process crashed" even though assertions passed. Isolating the runner
 * in this module avoids that entirely.
 *
 * The app under test must be installed separately (it is, whenever you run
 * `tauri android build`/`dev` or install app-<abi>-debug.apk). See README.md.
 */
android {
    compileSdk = 36
    namespace = "com.sam.mealplanner.uitest"
    defaultConfig {
        applicationId = "com.sam.mealplanner.uitest"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    buildTypes {
        getByName("debug") {
            isMinifyEnabled = false
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test:core:1.5.0")
    androidTestImplementation("androidx.test:runner:1.5.2")
    androidTestImplementation("androidx.test:rules:1.5.0")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
}
