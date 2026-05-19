import Foundation
import FirebaseFirestoreSwift

enum BookingStatus: String, Codable, CaseIterable {
  case scheduled
  case inProgress = "in_progress"
  case completed
  case cancelled

  var label: String {
    switch self {
    case .scheduled:  return "Scheduled"
    case .inProgress: return "In progress"
    case .completed:  return "Done"
    case .cancelled:  return "Cancelled"
    }
  }
}

struct Booking: Identifiable, Codable, Hashable {
  @DocumentID var documentId: String?
  var id: String { documentId ?? UUID().uuidString }

  let clientId: String
  let serviceId: String
  let workerIds: [String]
  let start: Date
  let end: Date
  let address: String
  let price: Double
  let notes: String?
  let status: BookingStatus
  let serviceName: String?
}
