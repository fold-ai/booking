import Foundation

struct Worker: Identifiable, Codable, Hashable {
  let id: UUID
  let userId: UUID?
  let businessId: UUID
  let name: String
  let role: String?
  let email: String?
  let phone: String?
  let isManager: Bool

  enum CodingKeys: String, CodingKey {
    case id
    case userId     = "user_id"
    case businessId = "business_id"
    case name
    case role
    case email
    case phone
    case isManager  = "is_manager"
  }

  init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    id         = try c.decode(UUID.self, forKey: .id)
    userId     = try c.decodeIfPresent(UUID.self, forKey: .userId)
    businessId = try c.decode(UUID.self, forKey: .businessId)
    name       = try c.decode(String.self, forKey: .name)
    role       = try c.decodeIfPresent(String.self, forKey: .role)
    email      = try c.decodeIfPresent(String.self, forKey: .email)
    phone      = try c.decodeIfPresent(String.self, forKey: .phone)
    isManager  = (try? c.decode(Bool.self, forKey: .isManager)) ?? false
  }
}

/// Окремий рядок для джойну сервіса в booking row (services.name)
struct BookingServiceJoin: Codable {
  let name: String?
}

/// Business модель — потрібна manager mode щоб знати business_id
struct Business: Identifiable, Codable, Hashable {
  let id: UUID
  let ownerId: UUID
  let name: String
  let slug: String

  enum CodingKeys: String, CodingKey {
    case id
    case ownerId = "owner_id"
    case name
    case slug
  }
}

/// Роль користувача в застосунку
enum UserRole: Equatable {
  case manager(business: Business, worker: Worker?)
  case worker(business: Business, worker: Worker)
  case notLinked  // юзер залогінений, але немає ні business ні worker запису

  var isManager: Bool {
    if case .manager = self { return true }
    return false
  }

  var business: Business? {
    switch self {
    case .manager(let b, _): return b
    case .worker(let b, _):  return b
    case .notLinked:         return nil
    }
  }

  var worker: Worker? {
    switch self {
    case .manager(_, let w): return w
    case .worker(_, let w):  return w
    case .notLinked:         return nil
    }
  }
}
