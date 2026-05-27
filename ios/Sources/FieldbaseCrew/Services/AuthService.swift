import Foundation
import Supabase

struct AuthService {
  private var client: SupabaseClient { SupabaseClientProvider.shared }

  func signIn(email: String, password: String) async throws {
    _ = try await client.auth.signIn(email: email, password: password)
  }

  func signOut() async throws {
    try await client.auth.signOut()
  }

  /// Native Sign in with Apple. The app obtains an identity token + raw nonce
  /// via ASAuthorizationController, then exchanges them with Supabase.
  func signInWithApple(idToken: String, nonce: String) async throws {
    _ = try await client.auth.signInWithIdToken(
      credentials: .init(provider: .apple, idToken: idToken, nonce: nonce)
    )
  }

  /// Native Google Sign-In. The app obtains an ID token + access token via the
  /// GoogleSignIn SDK, then exchanges them with Supabase.
  func signInWithGoogle(idToken: String, accessToken: String) async throws {
    _ = try await client.auth.signInWithIdToken(
      credentials: .init(provider: .google, idToken: idToken, accessToken: accessToken)
    )
  }

  /// Повертає поточну сесію (якщо є збережена). nil якщо неавторизований.
  func currentSession() async -> Session? {
    try? await client.auth.session
  }
}
