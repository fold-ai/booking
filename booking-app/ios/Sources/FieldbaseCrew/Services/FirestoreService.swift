import Foundation
import FirebaseFirestore
import FirebaseFirestoreSwift

struct FirestoreService {
  private let db = Firestore.firestore()

  func workerForUser(uid: String) async throws -> Worker? {
    let snap = try await db.collection("workers").whereField("userId", isEqualTo: uid).limit(to: 1).getDocuments()
    return try snap.documents.first?.data(as: Worker.self)
  }

  func todayBookings(workerId: String) async throws -> [Booking] {
    let cal = Calendar.current
    let start = cal.startOfDay(for: Date())
    let end = cal.date(byAdding: .day, value: 1, to: start) ?? start
    let snap = try await db.collection("bookings")
      .whereField("workerIds", arrayContains: workerId)
      .whereField("start", isGreaterThanOrEqualTo: start)
      .whereField("start", isLessThan: end)
      .order(by: "start")
      .getDocuments()
    return try snap.documents.compactMap { try $0.data(as: Booking.self) }
  }

  func clients(ids: [String]) async throws -> [String: Client] {
    guard !ids.isEmpty else { return [:] }
    var out: [String: Client] = [:]
    // Firestore IN queries cap at 30 elements.
    for chunk in ids.chunked(into: 30) {
      let snap = try await db.collection("clients").whereField(FieldPath.documentID(), in: chunk).getDocuments()
      for doc in snap.documents {
        if let c = try? doc.data(as: Client.self), let id = c.documentId {
          out[id] = c
        }
      }
    }
    return out
  }

  func updateBooking(id: String, status: BookingStatus, notes: String?) async throws {
    var payload: [String: Any] = ["status": status.rawValue]
    if let notes { payload["notes"] = notes }
    try await db.collection("bookings").document(id).updateData(payload)
  }
}

private extension Array {
  func chunked(into size: Int) -> [[Element]] {
    stride(from: 0, to: count, by: size).map { Array(self[$0..<Swift.min($0 + size, count)]) }
  }
}
