import SwiftUI

@main
struct FieldbaseCrewApp: App {
  @State private var appState = AppState()

  var body: some Scene {
    WindowGroup {
      RootView()
        .environment(appState)
        .preferredColorScheme(.light)
        .tint(Theme.amber)
    }
  }
}

struct RootView: View {
  @Environment(AppState.self) private var state

  var body: some View {
    Group {
      if state.user == nil {
        LoginView()
      } else {
        TodayView()
      }
    }
    .animation(.easeInOut(duration: 0.2), value: state.user?.id)
  }
}
