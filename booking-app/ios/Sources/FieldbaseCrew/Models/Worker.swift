import Foundation

struct Worker: Identifiable, Codable, Hashable {
  let id: UUID
  let userId: UUID?
  let businessId: UUID
  let name: String
  let role: String?
  let email: String?
  let phone: String?

  enum CodingKeys: String, CodingKey {
    case id
    case userId     = "user_id"
    case businessId = "business_id"
    case name
    case role
    case email
    case phone
  }
}

/// Окремий рядок для джойну сервіса в booking row (services.name)
struct BookingServiceJoin: Codable {
  let name: String?
}
