/**
 * Privacy Policy, Terms of Service, and Open-Source Licenses Data
 * Accurately reflective of TimerApp / Ayush14 Timer implementation and dependencies.
 */

export const PRIVACY_POLICY_SECTIONS = [
    {
        title: '1. Application Purpose & Scope',
        content: `Ayush14 Timer is a specialized, enterprise-grade kitchen production and workstation timing system designed for food preparation facilities. It provides precision countdown timers, stage tracking (cleaning, cutting, soaking, machine drying, bucket arrangement), and lock-screen alarms to ensure commercial culinary accuracy and timely batch execution.`
    },
    {
        title: '2. Information We Collect & Store',
        content: `We believe in radical data minimization. The application stores only the minimum data required to facilitate shift operations:
• Authentication Credentials: An encrypted worker token and assigned Worker ID stored securely via device hardware storage (SecureStore).
• Shift Attendance Record: A local timestamp verifying today's shift clock-in date.
• Local Timer History: Completed and cancelled timer logs (task title, start time, finish time, and duration) stored exclusively on your device.
• User Preferences: Selected alarm ringtone choice and sound configuration.`
    },
    {
        title: '3. Timer & History Data Handling',
        content: `All timer countdowns and history logs generated during your shift are stored locally on your device storage. We do not transmit your local timer history to advertising brokers or analytics brokers. Data is processed solely on-device for review on your History tab.`
    },
    {
        title: '4. Notifications & Alarm Permissions',
        content: `To ensure that food batches are never over-processed or burnt, the app requires specialized Android alarm capabilities:
• SCHEDULE_EXACT_ALARM & USE_EXACT_ALARM: Allows the Android AlarmManager to trigger alarms at the precise second (00:00) without battery-optimization delays.
• USE_FULL_SCREEN_INTENT: Displays the urgent alarm screen over your phone lock screen so workers can acknowledge alarms with greasy or gloved hands without unlocking the device.
• POST_NOTIFICATIONS: Enables Android 13+ heads-up notification banners for ongoing and completed stages.`
    },
    {
        title: '5. Device Hardware Permissions',
        content: `• WAKE_LOCK: Briefly wakes the device display and processor when a countdown reaches zero so you are immediately alerted.
• VIBRATE: Provides rhythmic haptic vibration patterns alongside audio alerts in noisy kitchen environments.
• FOREGROUND_SERVICE & MEDIA_PLAYBACK: Ensures audio alarm ringtones loop insistently until explicitly dismissed by kitchen staff.`
    },
    {
        title: '6. Data Sharing & Third-Party Disclosure',
        content: `We do not sell, rent, monetize, or trade any personal or operational data to third parties. We do not integrate third-party advertising SDKs, behavioral tracking trackers, or marketing pixels.`
    },
    {
        title: '7. Network & Backend Services',
        content: `The app communicates via encrypted HTTPS solely with your authorized production gateway server to:
• Authenticate worker login credentials.
• Retrieve assigned vegetable batches and demand weights.
• Synchronize active task stage transitions and server time offsets.`
    },
    {
        title: '8. Data Security & Storage Architecture',
        content: `Sensitive tokens and worker IDs are stored using Android KeyStore and iOS Keychain encryption standards via SecureStore. Memory cache is purged upon session termination.`
    },
    {
        title: '9. Data Deletion & Session Reset',
        content: `Workers can delete active session tokens at any time by tapping "Logout from Shift" in the Settings tab. Logging out cancels all scheduled notifications, clears cached active tasks, and removes the authentication token from device storage. Uninstalling the app permanently removes all local history records.`
    },
    {
        title: '10. Children’s Privacy',
        content: `Ayush14 Timer is strictly an internal industrial food preparation workflow application intended for authorized commercial staff and is not directed to children under the age of 13.`
    },
    {
        title: '11. Policy Updates',
        content: `As operating system requirements and app capabilities evolve, this policy may be updated. The latest effective date will always be visible at the top of this document.`
    },
    {
        title: '12. Contact Information',
        content: `For privacy inquiries, technical support, or audit requests regarding Ayush14 Timer, please contact:
Developer: Ayush14
Application: Ayush14 Timer
Support: support@ayush14.com`
    }
];

export const TERMS_OF_SERVICE_SECTIONS = [
    {
        title: '1. Acceptance of Terms',
        content: `By downloading, installing, or operating Ayush14 Timer, you agree to comply with and be bound by these Terms of Service. If you do not agree with these terms, please discontinue use of the software immediately.`
    },
    {
        title: '2. Permitted Commercial Use',
        content: `Ayush14 Timer is provided for commercial kitchen workstation management, food batch tracking, and task timing. You agree to use the software in compliance with all relevant workplace hygiene, food safety, and facility operational rules.`
    },
    {
        title: '3. Worker & Operator Responsibilities',
        content: `• Device Volume & Sound: Operators are responsible for keeping device media/alarm volumes at an audible level and ensuring Do Not Disturb or aggressive manufacturer task-killers do not mute alarms.
• Timely Acknowledgment: Workers must verify batch quantities and manually acknowledge stage completions in accordance with recipe guidelines.
• Physical Inspection: Automated timers do not replace human sensory inspection of food products (e.g., verifying dryness, cleanliness, or moisture levels).`
    },
    {
        title: '4. Technical & Alarm Limitations',
        content: `While Ayush14 Timer employs native AlarmManager clock triggers and insistent audio loops:
• Extreme battery saving modes (e.g. Samsung Ultra Power Saving, Xiaomi MIUI battery restrictions) can occasionally suppress lock-screen wake-ups if not exempted by the user in Android OS settings.
• The application is an advisory timing tool and should not be relied upon as a certified medical, life-critical, or fire-safety device.`
    },
    {
        title: '5. Service Availability & Connectivity',
        content: `The application is designed to continue local countdown timing even during temporary network interruptions. However, initial task assignments and batch demand updates require connectivity with the central production gateway.`
    },
    {
        title: '6. Disclaimer of Warranties',
        content: `Ayush14 Timer is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.`
    },
    {
        title: '7. Limitation of Liability',
        content: `In no event shall the developer (Ayush14) or associated production entities be liable for any indirect, incidental, special, consequential, or punitive damages, including food wastage, loss of operational time, or equipment malfunction resulting from the use or inability to use the application.`
    },
    {
        title: '8. Modifications to Terms',
        content: `We reserve the right to revise or replace these Terms of Service at our discretion. Continued use of the application following updates constitutes acceptance of the modified terms.`
    },
    {
        title: '9. Contact & Inquiries',
        content: `If you have questions regarding these Terms of Service, please reach out to:
Ayush14 Engineering & Product
Email: support@ayush14.com`
    }
];

export const OPEN_SOURCE_LICENSES = [
    {
        name: 'react',
        version: '19.1.0',
        license: 'MIT',
        author: 'Meta Platforms, Inc.',
        description: 'The library for web and native user interfaces.',
        licenseText: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.`
    },
    {
        name: 'react-native',
        version: '0.81.5',
        license: 'MIT',
        author: 'Meta Platforms, Inc.',
        description: 'A framework for building native apps using React.',
        licenseText: `MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.`
    },
    {
        name: 'expo',
        version: '~54.0.36',
        license: 'MIT',
        author: '650 Industries, Inc.',
        description: 'The Expo platform for making universal native apps with React.',
        licenseText: `MIT License

Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.`
    },
    {
        name: 'expo-router',
        version: '~6.0.24',
        license: 'MIT',
        author: '650 Industries, Inc.',
        description: 'File-based routing for React Native and web applications.',
        licenseText: `MIT License

Copyright (c) 2022-present 650 Industries, Inc. (aka Expo)`
    },
    {
        name: 'expo-av',
        version: '^16.0.8',
        license: 'MIT',
        author: '650 Industries, Inc.',
        description: 'Universal audio and video playback module.',
        licenseText: `MIT License

Copyright (c) 2015-present 650 Industries, Inc.`
    },
    {
        name: 'expo-notifications',
        version: '~0.32.17',
        license: 'MIT',
        author: '650 Industries, Inc.',
        description: 'Push and local notifications management module.',
        licenseText: `MIT License

Copyright (c) 2020-present 650 Industries, Inc.`
    },
    {
        name: 'expo-secure-store',
        version: '~15.0.8',
        license: 'MIT',
        author: '650 Industries, Inc.',
        description: 'Encrypted hardware key-value storage for iOS Keychain and Android KeyStore.',
        licenseText: `MIT License

Copyright (c) 2018-present 650 Industries, Inc.`
    },
    {
        name: 'react-native-notify-kit',
        version: '^10.7.1',
        license: 'Apache-2.0',
        author: 'Invertase',
        description: 'Android AlarmManager exact alarm clock and lock-screen notification engine.',
        licenseText: `Apache License, Version 2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0`
    },
    {
        name: 'axios',
        version: '^1.20.0',
        license: 'MIT',
        author: 'Matt Zabriskie',
        description: 'Promise based HTTP client for the browser and node.js.',
        licenseText: `MIT License

Copyright (c) 2014-present Matt Zabriskie`
    },
    {
        name: '@expo/vector-icons',
        version: '^15.0.3',
        license: 'MIT',
        author: '650 Industries, Inc.',
        description: 'Custom icons directory for Expo with Ionicons and FontAwesome support.',
        licenseText: `MIT License

Copyright (c) 2015-present 650 Industries, Inc.`
    },
    {
        name: 'react-native-safe-area-context',
        version: '~5.6.0',
        license: 'MIT',
        author: 'Janic Duplessis',
        description: 'Cross-platform handling of safe area insets for notches and gesture navigation.',
        licenseText: `MIT License

Copyright (c) 2019 Janic Duplessis`
    },
    {
        name: 'react-native-screens',
        version: '~4.16.0',
        license: 'MIT',
        author: 'Software Mansion',
        description: 'Native navigation primitives and screen optimization.',
        licenseText: `MIT License

Copyright (c) 2018 Software Mansion`
    }
];
