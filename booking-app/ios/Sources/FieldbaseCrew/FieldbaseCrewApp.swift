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
      } else if state.roleLoading || state.role == nil {
        loadingScreen
      } else {
        switch state.role! {
        case .manager:
          ManagerRootView()
        case .worker:
          // Worker mode — той самий simple TodayView
          NavigationStack {
            TodayView()
          }
        case .notLinked:
          NotLinkedView()
        }
      }
    }
    .animation(.easeInOut(duration: 0.2), value: state.user?.id)
  }

  private var loadingScreen: some View {
    ZStack {
      Theme.ink50.ignoresSafeArea()
      ProgressView().tint(Theme.amber)
    }
  }
}

/// Показуємо коли юзер залогінений, але не пов'язаний ні з business ні з worker.
struct NotLinkedView: View {
  @Environment(AppState.self) private var state

  var body: some View {
    ZStack {
      Theme.ink50.ignoresSafeArea()
      VStack(spacing: 16) {
        Image(systemName: "person.crop.circle.badge.questionmark")
          .font(.system(size: 64))
          .foregroundStyle(Theme.ink400)
        Text("Account not linked").font(.displayMedium).foregroundStyle(Theme.ink800)
        Text("Sign in on the web at fieldbase.app to set up your business, or ask your manager to add you as a crew member.")
          .multilineTextAlignment(.center)
          .foregroundStyle(Theme.ink400)
          .padding(.horizontal, 32)
        Button("Sign out") { state.signOut() }
          .padding(.top, 8)
          .foregroundStyle(Theme.ink600)
      }
    }
  }
}
