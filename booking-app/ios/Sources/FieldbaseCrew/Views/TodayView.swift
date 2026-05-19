import SwiftUI

struct TodayView: View {
  @Environment(AppState.self) private var state

  var body: some View {
    NavigationStack {
      ZStack {
        Theme.ink50.ignoresSafeArea()
        ScrollView {
          VStack(alignment: .leading, spacing: 20) {
            header
            if state.bookings.isEmpty {
              empty
            } else {
              ForEach(state.bookings) { item in
                NavigationLink(value: item) {
                  JobRow(item: item, client: clientFor(item))
                }
                .buttonStyle(.plain)
              }
            }
          }
          .padding(20)
        }
        .refreshable { await state.refresh() }
      }
      .navigationDestination(for: BookingWithService.self) { item in
        JobDetailView(item: item)
      }
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          Menu {
            Button("Refresh") { Task { await state.refresh() } }
            Button("Sign out", role: .destructive) { state.signOut() }
          } label: {
            Image(systemName: "ellipsis.circle").foregroundStyle(Theme.ink600)
          }
        }
      }
    }
    .task { await state.refresh() }
  }

  private func clientFor(_ item: BookingWithService) -> Client? {
    guard let cid = item.booking.clientId else { return nil }
    return state.clientsById[cid]
  }

  private var header: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(todayLabel.uppercased()).font(.caption).tracking(1).foregroundStyle(Theme.ink400)
      Text("Today").font(.displayLarge).foregroundStyle(Theme.ink800)
      if let worker = state.worker {
        Text("Hey \(worker.name.components(separatedBy: " ").first ?? worker.name) — \(state.bookings.count) job\(state.bookings.count == 1 ? "" : "s") on you.")
          .foregroundStyle(Theme.ink400)
      }
    }
  }

  private var empty: some View {
    VStack(spacing: 8) {
      Image(systemName: "checkmark.circle").font(.system(size: 48)).foregroundStyle(Theme.moss)
      Text("Clear day.").font(.displayMedium).foregroundStyle(Theme.ink800)
      Text("Nothing scheduled.").foregroundStyle(Theme.ink400)
    }
    .frame(maxWidth: .infinity).padding(.vertical, 60)
    .background(.white).clipShape(RoundedRectangle(cornerRadius: 20))
  }

  private var todayLabel: String {
    let f = DateFormatter(); f.dateFormat = "EEEE, MMM d"
    return f.string(from: Date())
  }
}
