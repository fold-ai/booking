import Foundation
import Observation
import FirebaseAuth

@Observable
final class AppState {
  var user: User?
  var worker: Worker?
  var bookings: [Booking] = []
  var clientsById: [String: Client] = [:]
  var errorMessage: String?
  var isLoading = false

  private var authHandle: AuthStateDidChangeListenerHandle?
  private let auth = AuthService()
  private let firestore = FirestoreService()

  init() {
    authHandle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
      guard let self else { return }
      self.user = user
      Task { await self.refresh() }
    }
  }

  deinit {
    if let h = authHandle { Auth.auth().removeStateDidChangeListener(h) }
  }

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
    try? auth.signOut()
    worker = nil
    bookings = []
    clientsById = [:]
  }

  func refresh() async {
    guard let uid = user?.uid else { return }
    do {
      let worker = try await firestore.workerForUser(uid: uid)
      self.worker = worker
      guard let workerId = worker?.id else { return }
      self.bookings = try await firestore.todayBookings(workerId: workerId)
      let clientIds = Array(Set(bookings.compactMap { $0.clientId }))
      self.clientsById = try await firestore.clients(ids: clientIds)
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  func setStatus(_ booking: Booking, status: BookingStatus, notes: String?) async {
    do {
      try await firestore.updateBooking(id: booking.id, status: status, notes: notes)
      await refresh()
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}
