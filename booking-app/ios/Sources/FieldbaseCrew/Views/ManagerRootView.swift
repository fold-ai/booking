import SwiftUI

/// Tab bar для manager mode. 4 вкладки в Etap 1:
///   - Today: сьогоднішні bookings (всі бізнесу)
///   - Bookings: список всіх з фільтрами + + кнопка створення (CRUD)
///   - Crew: список workers + керування ролями
///   - More: Settings, Sign out, placeholder для майбутнього
struct ManagerRootView: View {
  @Environment(AppState.self) private var state
  @State private var selectedTab: Tab = .today

  enum Tab: Hashable { case today, bookings, crew, more }

  var body: some View {
    TabView(selection: $selectedTab) {
      NavigationStack {
        TodayView()
      }
      .tabItem {
        Label("Today", systemImage: "sun.max")
      }
      .tag(Tab.today)

      NavigationStack {
        BookingsListView()
      }
      .tabItem {
        Label("Bookings", systemImage: "calendar")
      }
      .tag(Tab.bookings)

      NavigationStack {
        CrewView()
      }
      .tabItem {
        Label("Crew", systemImage: "person.2")
      }
      .tag(Tab.crew)

      NavigationStack {
        MoreView()
      }
      .tabItem {
        Label("More", systemImage: "ellipsis.circle")
      }
      .tag(Tab.more)
    }
    .tint(Theme.amber)
  }
}
