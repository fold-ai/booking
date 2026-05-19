import Foundation

struct Client: Identifiable, Codable, Hashable {
  let id: UUID
  let name: String
  let phone: String?
  let email: String?
  let address: String?
  let notes: String?
}
