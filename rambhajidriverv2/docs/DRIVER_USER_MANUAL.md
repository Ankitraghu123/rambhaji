# DRIVER USER MANUAL
## GharTak — Driver Delivery Mobile Application
### Complete Step-by-Step Operations Guide

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Audience:** Delivery Executives (Drivers)  
**Classification:** Operational — Field Guide  

---

## Welcome to GharTak Driver App

The GharTak Driver App is your daily companion for managing fresh box deliveries. This guide walks you through every screen, button, and workflow you'll use during your shift.

---

## Table of Contents
1. [Getting Started & Login](#1-getting-started--login)
2. [Understanding Your Dashboard](#2-understanding-your-dashboard)
3. [Starting Your Delivery Route](#3-starting-your-delivery-route)
4. [Navigating to a Customer](#4-navigating-to-a-customer)
5. [Completing a Delivery](#5-completing-a-delivery)
6. [Handling a Return](#6-handling-a-return)
7. [Working Without Internet (Offline Mode)](#7-working-without-internet-offline-mode)
8. [Receiving Notifications](#8-receiving-notifications)
9. [End of Shift](#9-end-of-shift)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Getting Started & Login

### Step 1: Open the App
Tap the **GharTak** icon on your phone's home screen. The app will show the logo briefly while it loads.

### Step 2: Enter Your Mobile Number
- Type your registered 10-digit mobile number.
- Tap **"Send OTP"**.

> ⚠️ **Important:** Only your registered number will work. If you see "Number not found", contact your supervisor.

### Step 3: Enter the OTP
- You will receive a 6-digit code via SMS within 30 seconds.
- Enter the code on the OTP screen. The app submits automatically when all 6 digits are filled.
- The OTP is valid for **5 minutes** only.

### Step 4: You Are Logged In!
After successful verification, you will land on your **Dashboard**.

> 💡 **Tip:** If you don't receive the OTP, tap **"Resend OTP"** after 30 seconds. If it still doesn't arrive, check your signal and try again.

---

## 2. Understanding Your Dashboard

Your Dashboard is the home screen. Here is what each section means:

```
┌─────────────────────────────────────────┐
│  Good Morning, Rajan! 🌅                │
├──────────┬────────────┬─────────────────┤
│ PENDING  │ COMPLETED  │    RETURNED     │
│   18     │     4      │       1         │
├──────────┴────────────┴─────────────────┤
│  📍 Route: Sector 62, Noida             │
│  24 stops · ~18.5 km                    │
│              [▶ START ROUTE]            │
├─────────────────────────────────────────┤
│  TODAY'S EARNINGS                        │
│  ₹420 projected  |  ₹120 confirmed      │
└─────────────────────────────────────────┘
```

| Card | What It Means |
|------|--------------|
| **Pending** | Deliveries still to be done |
| **Completed** | Deliveries you successfully finished |
| **Returned** | Deliveries where items were returned |
| **Route Info** | Your assigned area and distance today |
| **Earnings** | Estimated vs. already confirmed earnings |

---

## 3. Starting Your Delivery Route

1. From the Dashboard, tap **"▶ Start Route"**.
2. The app will show your delivery list in the recommended order.
3. Tap any delivery to see the full order details.
4. You can also tap the **🗺️ Map tab** to see all deliveries on a map.

> 💡 **Tip:** Deliveries are ordered to minimize your travel distance. Try to follow the suggested order.

---

## 4. Navigating to a Customer

### From the Delivery List:
1. Tap on a customer's name to open the **Order Details** screen.
2. You will see the customer's address, phone number, and products.
3. Tap **"Navigate"** to start turn-by-turn directions.

### From the Map:
1. Tap a customer pin (orange circle) on the map.
2. An info card pops up from the bottom.
3. Tap **"Navigate"** or **"Open in Maps"**.

> 💡 **Tip:** You can call the customer directly from the Order Details screen by tapping the **📞 phone icon** next to their number.

---

## 5. Completing a Delivery

> ⚠️ **You must be physically close to the customer's address to complete a delivery.** The app checks your GPS location automatically.

### Step 1: Arrive at the Address
When you are near the delivery location, open the **Order Details** screen.

### Step 2: Tap "DELIVER"
The green **DELIVER** button is at the bottom of the screen.

### Step 3: Take a Photo
- The camera will open automatically.
- Take a clear photo of the delivered package at the customer's door.
- Tap the **capture button** (circle) to take the photo.

### Step 4: Add Remarks (Optional)
You can type a short note (e.g., "Left with security", "Placed at door").

### Step 5: Submit
Tap **"SUBMIT DELIVERY"**. You'll see a green ✅ confirmation.

### ❌ Why Can't I Complete the Delivery?

| Reason Shown | What to Do |
|-------------|-----------|
| "You are too far from delivery address" | Move closer (within ~100 meters) and try again |
| "Please enable GPS / Location" | Go to phone Settings → Location → Turn ON |
| "Location not verified" | Disable Mock Location in Developer Options |
| "Photo required" | Take a photo before submitting |

---

## 6. Handling a Return

If the customer is not available, refuses the delivery, or the product is damaged:

### Step 1: Tap "RETURN"
The orange **RETURN** button is next to the DELIVER button on the Order Details screen.

### Step 2: Select a Reason
Choose the reason for return:
- Customer Not Available
- Customer Rejected
- Product Damaged
- Wrong Address
- Other

### Step 3: Adjust Quantity (if partial)
If only some items are being returned, reduce the quantity using the **+/-** controls.

### Step 4: Take a Photo
Take a photo of the returned items. This is **mandatory**.

### Step 5: Submit
Tap **"SUBMIT RETURN"**. The return is logged and your operations team is notified.

---

## 7. Working Without Internet (Offline Mode)

If you lose internet connection, the app shows a **red banner** at the top:
```
🔴  You are offline. Your work is being saved.
```

**You can still:**
- ✅ View all your deliveries for the day
- ✅ Complete deliveries (they save locally)
- ✅ Submit return requests (they save locally)
- ✅ Take photos (they save on your phone)

**When your internet comes back:**
- The banner changes to: `🔄 Syncing your offline data...`
- All saved deliveries and returns are automatically sent to the server.
- You will see: `✅ 3 deliveries synced!`

> 💡 **You don't need to do anything.** The app handles syncing automatically.

---

## 8. Receiving Notifications

The app sends you alerts for important events. You will receive push notifications for:

| Notification | What It Means |
|-------------|--------------|
| 🚚 **New Delivery Assigned** | A new stop has been added to your route |
| 🗺️ **Route Updated** | Your route sequence has changed |
| ✅ **Return Approved** | Your return request was approved by ops |
| ❌ **Return Rejected** | Your return was not approved (reason given) |
| 🚨 **Emergency Alert** | Urgent operational message from HQ |

Tap any notification to go directly to the relevant screen.

You can view all past notifications by tapping the **🔔 bell icon** on the Dashboard.

---

## 9. End of Shift

When all deliveries are done:

1. Go back to your **Dashboard**.
2. Check that Pending count shows **0**.
3. Review your **Completed** and **Returned** counts.
4. Tap your **Profile tab** (👤 icon at bottom).
5. Tap **"End Shift"** to submit your daily summary.
6. Tap **"Logout"** to securely log out.

> ⚠️ **Always log out at the end of your shift.** This protects your account and earnings data.

---

## 10. Troubleshooting & FAQ

### Q: The app says "OTP not received"
**A:** Check your mobile signal. Tap "Resend OTP" after 30 seconds. If still not received, contact your supervisor.

### Q: I completed a delivery but it still shows as Pending
**A:** If you were offline, the delivery is queued. Wait for the app to sync (you'll see ✅ confirmation). Do NOT re-deliver the same order.

### Q: The DELIVER button is greyed out
**A:** Make sure:
1. GPS / Location is turned ON in your phone settings
2. You are physically near the customer's address
3. Your camera permission is granted

### Q: App shows "Security Warning"
**A:** This is a serious alert. Stop using the app and immediately contact your supervisor. Do not attempt to bypass the warning.

### Q: My photos are taking a long time to upload
**A:** This happens with slow internet. The photos will upload when your connection improves. Do not close the app during sync.

### Q: I submitted a wrong return by mistake
**A:** Contact your Operations Supervisor immediately. Returns can be reviewed and corrected in the backend system.

---

**Support Contact:** `support@ghartak.com` | `1800-XXX-XXXX` (Mon–Sat, 6 AM–10 PM)

---

*Document End — DRIVER_USER_MANUAL.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
