import Foundation
import FirebaseAuth

struct AuthService {
  func signIn(email: String, password: String) async throws {
    try await Auth.auth().signIn(withEmail: email, password: password)
  }

  func signOut() throws {
    try Auth.auth().signOut()
  }
}
