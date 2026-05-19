// swift-tools-version: 5.9
// Swift Package describing the Fieldbase Crew companion app.
// Used for code-only sharing. The real Xcode project is created on the dev's
// machine — see ios/README.md for setup.

import PackageDescription

let package = Package(
  name: "FieldbaseCrew",
  platforms: [.iOS(.v17)],
  products: [
    .library(name: "FieldbaseCrew", targets: ["FieldbaseCrew"])
  ],
  dependencies: [
    .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "10.25.0"),
  ],
  targets: [
    .target(
      name: "FieldbaseCrew",
      dependencies: [
        .product(name: "FirebaseAuth",          package: "firebase-ios-sdk"),
        .product(name: "FirebaseFirestore",     package: "firebase-ios-sdk"),
        .product(name: "FirebaseFirestoreSwift", package: "firebase-ios-sdk"),
      ],
      path: "Sources/FieldbaseCrew"
    )
  ]
)
