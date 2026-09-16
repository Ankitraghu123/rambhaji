const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to enable Android Lock-Screen Alarm behavior:
 * 1. Adds android:showWhenLocked="true", android:turnScreenOn="true", and android:launchMode="singleTask" to MainActivity in AndroidManifest.xml
 * 2. Ensures all Android permissions required for waking the screen, exact alarms, full-screen intents, and foreground alarm audio
 * 3. Injects programmatic window flags and setShowWhenLocked/setTurnScreenOn into MainActivity (Kotlin/Java) so modern Android (API 27+)
 *    wakes the screen and presents the full-screen alarm view when locked.
 */
const withLockScreenAlarm = (config) => {
  // 1. Android Manifest modifications
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application?.[0];

    if (!mainApplication) {
      return config;
    }

    // Configure MainActivity with lock-screen flags
    const mainActivity = mainApplication.activity?.find(
      (activity) =>
        activity.$?.['android:name']?.endsWith('MainActivity') ||
        activity.$?.['android:name'] === '.MainActivity' ||
        activity.$?.['android:name'] === 'com.rambhaji.timerapp.MainActivity'
    );

    if (mainActivity) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
      mainActivity.$['android:showForAllUsers'] = 'true';
      mainActivity.$['android:inheritShowWhenLocked'] = 'true';
      mainActivity.$['android:launchMode'] = 'singleTask';
    }

    // Ensure all required permissions for exact alarms, full screen intents, and wake lock
    const requiredPermissions = [
      'android.permission.USE_FULL_SCREEN_INTENT',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.WAKE_LOCK',
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.REORDER_TASKS',
    ];

    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const existingPermissions = androidManifest.manifest['uses-permission'].map(
      (p) => p.$?.['android:name']
    );

    for (const perm of requiredPermissions) {
      if (!existingPermissions.includes(perm)) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    }

    return config;
  });

  // 2. MainActivity code injection for Kotlin / Java
  config = withMainActivity(config, async (config) => {
    const { language, contents } = config.modResults;

    if (language === 'kt') {
      let updatedContents = contents;

      // Ensure required imports
      const requiredImports = [
        'import android.app.KeyguardManager',
        'import android.content.Context',
        'import android.os.Build',
        'import android.os.Bundle',
        'import android.view.WindowManager',
      ];

      for (const imp of requiredImports) {
        if (!updatedContents.includes(imp)) {
          updatedContents = updatedContents.replace(
            /package\s+[^\n]+/,
            `$&\n\n${imp}`
          );
        }
      }

      // Inject wake screen and lockscreen presentation into onCreate
      const lockScreenCode = `
    // Lock-screen wake and alarm presentation flags
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      keyguardManager?.requestDismissKeyguard(this, null)
    }
    @Suppress("DEPRECATION")
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )
`;

      if (!updatedContents.includes('setShowWhenLocked(true)')) {
        if (updatedContents.includes('super.onCreate')) {
          updatedContents = updatedContents.replace(
            /super\.onCreate\([^\)]*\)/,
            `$&\n${lockScreenCode}`
          );
        } else {
          // If onCreate does not exist in template, inject the complete method
          const fullOnCreate = `
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
${lockScreenCode}
  }
`;
          updatedContents = updatedContents.replace(
            /(class\s+MainActivity\s*:[^{]*\{)/,
            `$1\n${fullOnCreate}`
          );
        }
      }

      // Inject onAttachedToWindow
      if (!updatedContents.includes('override fun onAttachedToWindow()')) {
        const attachMethod = `
  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    @Suppress("DEPRECATION")
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )
  }
`;
        updatedContents = updatedContents.replace(
          /(class\s+MainActivity\s*:[^{]*\{)/,
          `$1\n${attachMethod}`
        );
      }

      // Inject onNewIntent
      if (!updatedContents.includes('override fun onNewIntent(')) {
        const newIntentMethod = `
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
  }
`;
        updatedContents = updatedContents.replace(
          /(class\s+MainActivity\s*:[^{]*\{)/,
          `$1\n${newIntentMethod}`
        );
      }

      // Inject onResume
      if (!updatedContents.includes('override fun onResume()')) {
        const resumeMethod = `
  override fun onResume() {
    super.onResume()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
  }
`;
        updatedContents = updatedContents.replace(
          /(class\s+MainActivity\s*:[^{]*\{)/,
          `$1\n${resumeMethod}`
        );
      }

      config.modResults.contents = updatedContents;
    } else if (language === 'java') {
      let updatedContents = contents;
      const requiredImports = [
        'import android.app.KeyguardManager;',
        'import android.content.Context;',
        'import android.os.Build;',
        'import android.os.Bundle;',
        'import android.view.WindowManager;',
      ];

      for (const imp of requiredImports) {
        if (!updatedContents.includes(imp)) {
          updatedContents = updatedContents.replace(
            /package\s+[^;]+;/,
            `$&\n\n${imp}`
          );
        }
      }

      const lockScreenCode = `
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
      KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
      if (km != null) km.requestDismissKeyguard(this, null);
    }
    getWindow().addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON |
      WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
      WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    );
`;

      if (!updatedContents.includes('setShowWhenLocked(true)')) {
        if (updatedContents.includes('super.onCreate')) {
          updatedContents = updatedContents.replace(
            /super\.onCreate\([^\)]*\);/,
            `$&\n${lockScreenCode}`
          );
        } else {
          const fullOnCreate = `
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
${lockScreenCode}
  }
`;
          updatedContents = updatedContents.replace(
            /(public\s+class\s+MainActivity\s+[^{]*\{)/,
            `$1\n${fullOnCreate}`
          );
        }
      }

      config.modResults.contents = updatedContents;
    }

    return config;
  });

  return config;
};

module.exports = withLockScreenAlarm;
