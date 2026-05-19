import Foundation
import FirebaseFirestoreSwift

struct Worker: Identifiable, Codable, Hashable {
  @DocumentID var documentId: String?
  var id: String { documentId ?? UUID().uuidString }

  let userId: String
  let name: String
  let role: String?
  let email: String?
  let phone: String?
}
