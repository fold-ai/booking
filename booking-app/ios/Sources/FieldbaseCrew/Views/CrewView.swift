import SwiftUI

/// Менеджмент команди (тільки для Manager mode).
/// Показує всіх workers бізнесу. Manager може promote/demote інших до manager,
/// але не може зняти manager роль з owner бізнесу (це власник).
struct CrewView: View {
  @Environment(AppState.self) private var state

  var body: some View {
    ZStack {
      Theme.ink50.ignoresSafeArea()
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          Text("Crew").font(.displayLarge).foregroundStyle(Theme.ink800)
          Text("Your team. Toggle manager rights below.")
            .foregroundStyle(Theme.ink400)

          if state.workers.isEmpty {
            empty
          } else {
            ForEach(state.workers) { w in
              WorkerCard(worker: w)
            }
          }
        }
        .padding(20)
      }
      .refreshable { await state.refresh() }
    }
    .task { await state.refresh() }
  }

  private var empty: some View {
    VStack(spacing: 8) {
      Image(systemName: "person.2").font(.system(size: 48)).foregroundStyle(Theme.ink400)
      Text("No crew yet").font(.displayMedium).foregroundStyle(Theme.ink800)
      Text("Add workers on the web. They'll appear here once added.")
        .multilineTextAlignment(.center)
        .foregroundStyle(Theme.ink400)
        .padding(.horizontal, 16)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 60)
    .background(.white)
    .clipShape(RoundedRectangle(cornerRadius: 20))
  }
}

private struct WorkerCard: View {
  let worker: Worker
  @Environment(AppState.self) private var state
  @State private var updating = false

  // Чи є цей worker власником бізнесу? Owner ми не можемо demote.
  private var isOwner: Bool {
    guard let business = state.role?.business else { return false }
    return worker.userId == business.ownerId
  }

  // Чи може поточний користувач змінити роль цього worker?
  private var canToggle: Bool {
    state.role?.isManager == true && !isOwner
  }

  var body: some View {
    HStack(spacing: 14) {
      // Avatar
      ZStack {
        Circle().fill(Theme.ink800)
        Text(initials).foregroundStyle(Theme.amber).font(.callout).fontWeight(.semibold)
      }
      .frame(width: 44, height: 44)

      VStack(alignment: .leading, spacing: 2) {
        HStack(spacing: 6) {
          Text(worker.name).font(.callout).fontWeight(.semibold).foregroundStyle(Theme.ink800)
          if worker.isManager {
            Text(isOwner ? "OWNER" : "MANAGER")
              .font(.caption2).fontWeight(.bold)
              .padding(.horizontal, 6).padding(.vertical, 2)
              .background(Theme.amber.opacity(0.2))
              .foregroundStyle(Theme.ink700)
              .clipShape(Capsule())
          }
        }
        if let role = worker.role, !role.isEmpty {
          Text(role).font(.caption).foregroundStyle(Theme.ink400)
        }
        if let email = worker.email {
          Text(email).font(.caption2).foregroundStyle(Theme.ink400)
        }
      }
      Spacer()

      // Toggle manager
      if canToggle {
        if updating {
          ProgressView().scaleEffect(0.8)
        } else {
          Toggle("", isOn: Binding(
            get: { worker.isManager },
            set: { newValue in
              Task {
                updating = true
                await state.setWorkerIsManager(worker, isManager: newValue)
                updating = false
              }
            }
          ))
          .labelsHidden()
          .tint(Theme.amber)
        }
      }
    }
    .padding(14)
    .background(.white)
    .clipShape(RoundedRectangle(cornerRadius: 16))
    .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Theme.ink100))
  }

  private var initials: String {
    let parts = worker.name.split(separator: " ")
    let first = parts.first?.first.map(String.init) ?? ""
    let last  = parts.dropFirst().first?.first.map(String.init) ?? ""
    return (first + last).uppercased()
  }
}
