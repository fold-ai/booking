import SwiftUI

enum Theme {
  static let ink50  = Color(red: 0.97, green: 0.97, blue: 0.96)
  static let ink100 = Color(red: 0.93, green: 0.93, blue: 0.90)
  static let ink400 = Color(red: 0.42, green: 0.42, blue: 0.37)
  static let ink600 = Color(red: 0.16, green: 0.16, blue: 0.14)
  static let ink700 = Color(red: 0.11, green: 0.11, blue: 0.09)
  static let ink800 = Color(red: 0.07, green: 0.07, blue: 0.06)

  static let amber     = Color(red: 0.96, green: 0.66, blue: 0.24)
  static let amberSoft = Color(red: 0.98, green: 0.89, blue: 0.71)
  static let amberDeep = Color(red: 0.73, green: 0.48, blue: 0.11)

  static let moss     = Color(red: 0.25, green: 0.42, blue: 0.29)
  static let mossSoft = Color(red: 0.85, green: 0.90, blue: 0.86)
}

extension Font {
  static let displayLarge   = Font.system(.largeTitle, design: .serif).weight(.regular)
  static let displayMedium  = Font.system(.title, design: .serif).weight(.regular)
  static let displaySmall   = Font.system(.title2, design: .serif).weight(.regular)
}
