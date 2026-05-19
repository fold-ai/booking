import Foundation
import FirebaseFirestoreSwift

struct Client: Identifiable, Codable, Hashable {
  @DocumentID var documentId: String?
  var id: String { documentId ?? UUID().uuidString }

  let name: String
  let phone: String?
  let email: String?
  let address: String?
  let notes: String?
}
