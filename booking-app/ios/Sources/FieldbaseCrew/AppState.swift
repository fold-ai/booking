import Foundation
import Observation
import Supabase

/// Простий wrapper для зовнішнього API — Views перевіряють `state.user != nil`
struct CurrentUser: Equatable {
  let id: UUID
  let email: String?
}

@Observable
final class AppState {
  var user: CurrentUser?
  var worker: Worker?
  var bookings: [BookingWithService] = []
  var clientsById: [UUID: Client] = [:]
  var errorMessage: String?
  var isLoading = false

  private let auth = AuthService()
  private let data = SupabaseService()
  private var authTask: Task<Void, Never>?

  init() {
    // Слухаємо зміни auth state (login, logout, refresh)
    authTask = Task { [weak self] in
      for await change in SupabaseClientProvider.shared.auth.authStateChanges {
        guard let self else { return }
        let session = change.session
        if let s = session {
          await MainActor.run {
            self.user = CurrentUser(id: s.user.id, email: s.user.email)
          }
          await self.refresh()
        } else {
          await MainActor.run {
            self.user = nil
            self.worker = nil
            self.bookings = []
            self.clientsById = [:]
          }
        }
      }
    }
  }

  deinit { authTask?.cancel() }

  func signIn(email: String, password: String) async {
    isLoading = true; defer { isLoading = false }
    do {
      try await auth.signIn(email: email, password: password)
      errorMessage = nil
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func signOut() {
    Task {
      try? await auth.signOut()
      await MainActor.run {
        worker = nil
        bookings = []
        clientsById = [:]
      }
    }
  }

  func refresh() async {
    guard let uid = user?.id else { return }
    do {
      let worker = try await data.workerForUser(userId: uid)
      await MainActor.run { self.worker = worker }
      guard let workerId = worker?.id else { return }

      let bookings = try await data.todayBookings(workerId: workerId)
      let clientIds = Array(Set(bookings.compactMap { $0.booking.clientId }))
      let clientsById = try await data.clients(ids: clientIds)

      await MainActor.run {
        self.bookings = bookings
        self.clientsById = clientsById
      }
    } catch {
      await MainActor.run { self.errorMessage = error.localizedDescription }
    }
  }

  func setStatus(_ bws: BookingWithService, status: BookingStatus, notes: String?) async {
    do {
      try await data.updateBooking(id: bws.booking.id, status: status, notes: notes)
      await refresh()
    } catch {
      await MainActor.run { self.errorMessage = error.localizedDescription }
    }
  }
}
