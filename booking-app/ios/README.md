# Fieldbase Crew — iOS companion app

A SwiftUI app for the **field crew** — your workers in the truck. They sign in, see today's jobs assigned to them, tap a job for directions and details, mark it in-progress / done, and leave notes.

This is intentionally focused. The admin still happens on the web (Fieldbase). This app is for the people doing the work.

## Architecture

- **SwiftUI** for views, **`@Observable`** + `@State` for state
- **Firebase iOS SDK** for auth + Firestore (same backend as the web app)
- **MapKit** for "Open in Maps" from a job address
- iOS 17+ target

The same Firestore collections power both apps:
- `businesses/{businessId}`
- `workers/{workerId}` (with `userId` linking to Firebase Auth)
- `bookings/{bookingId}` (with `workerIds` array)

## Files in this folder

```
ios/
├─ README.md                       (this file)
├─ Package.swift                   (Swift Package — drag into Xcode or open as-is)
└─ Sources/FieldbaseCrew/
   ├─ FieldbaseCrewApp.swift       (@main entry)
   ├─ AppState.swift               (auth + firestore observer)
   ├─ Models/
   │  ├─ Booking.swift
   │  ├─ Client.swift
   │  └─ Worker.swift
   ├─ Services/
   │  ├─ AuthService.swift
   │  └─ FirestoreService.swift
   ├─ Views/
   │  ├─ LoginView.swift
   │  ├─ TodayView.swift           (list of today's jobs)
   │  ├─ JobDetailView.swift
   │  └─ Components/
   │     ├─ JobRow.swift
   │     └─ StatusBadge.swift
   └─ Theme.swift
```

## Setup (you'll do this once)

You need a Mac with Xcode 15+.

### 1. Create the Xcode project

The cleanest path is to start a fresh Xcode project and pull in these Swift files:

```bash
# In Terminal
cd ~/Projects/booking-app/ios
open -a Xcode .
```

Or, in Xcode:
1. **File → New → Project → iOS → App**
2. Name: `FieldbaseCrew`, Interface: **SwiftUI**, Language: **Swift**, Storage: **None**
3. Replace the default `ContentView.swift` and `FieldbaseCrewApp.swift` with the files from `Sources/FieldbaseCrew/`
4. Drag all subfolders (`Models`, `Services`, `Views`) into the Xcode project navigator (choose **Copy items if needed** + **Create groups**)

### 2. Add Firebase

In Xcode:
1. **File → Add Package Dependencies…**
2. URL: `https://github.com/firebase/firebase-ios-sdk`
3. Add products: **FirebaseAuth**, **FirebaseFirestore**, **FirebaseFirestoreSwift**

Then, in the Firebase console, register an **iOS app**, download `GoogleService-Info.plist`, and drag it into the Xcode project root. Add it to the `FieldbaseCrew` target.

### 3. Run on simulator

Hit ▶️ in Xcode with an iPhone simulator selected.

### 4. Run on your iPhone

1. Connect your iPhone via USB
2. In Xcode → **Signing & Capabilities** → set Team to your Apple ID (free tier works)
3. Select your iPhone as the build target → ▶️

Free Apple ID signing works for personal use but the build expires after 7 days. To deploy to other people, you need a paid Apple Developer account.

## Deploying to the App Store

1. **Apple Developer Program** — $99/yr at https://developer.apple.com/programs
2. **Create App Store Connect listing** at https://appstoreconnect.apple.com
3. In Xcode: **Product → Archive** → upload to App Store Connect
4. Submit for review (typically 1–3 days)

App Store requires:
- App icon (1024×1024 PNG)
- Screenshots for at least one device size
- Privacy policy URL
- Description + keywords
- A demo account for the reviewer if your app requires sign-in (it does)

## What the app does (today's scope)

- Sign in with the same email/password as the web app
- See today's jobs assigned to the signed-in worker
- Tap a job: client info, address, time, service, notes
- Tap "Open in Maps" to launch turn-by-turn
- Mark a job as **In progress** or **Completed**
- Add a free-text note that syncs back to the office

## What it intentionally doesn't do (yet)

- Admin actions (create bookings, edit clients) — keep those on the web
- Offline mode — Firestore SDK has caching but no explicit conflict resolution here
- Photo capture on job completion — easy add later via `PhotosPicker`
- Push notifications — needs APNs cert + a server-side trigger
