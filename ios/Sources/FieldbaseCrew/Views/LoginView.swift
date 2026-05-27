import SwiftUI
import UIKit
import AuthenticationServices
import CryptoKit
import GoogleSignIn

struct LoginView: View {
  @Environment(AppState.self) private var state
  @State private var email = ""
  @State private var password = ""
  @State private var currentNonce: String?

  var body: some View {
    ZStack {
      Theme.ink50.ignoresSafeArea()
      VStack(alignment: .leading, spacing: 24) {
        HStack(spacing: 10) {
          RoundedRectangle(cornerRadius: 8).fill(Theme.ink800).frame(width: 36, height: 36)
            .overlay(Text("D").foregroundStyle(Theme.amber).font(.headline).bold())
          Text("Drevito").font(.displaySmall).foregroundStyle(Theme.ink800)
          Spacer()
        }

        VStack(alignment: .leading, spacing: 6) {
          Text("Welcome back.").font(.displayLarge).foregroundStyle(Theme.ink800)
          Text("Sign in to see today's route.").foregroundStyle(Theme.ink400)
        }

        VStack(spacing: 12) {
          Field(label: "Email", text: $email, keyboard: .emailAddress, contentType: .emailAddress)
          Field(label: "Password", text: $password, secure: true, contentType: .password)
        }

        if let err = state.errorMessage {
          Text(err).font(.footnote).foregroundStyle(.red)
        }

        Button {
          Task { await state.signIn(email: email, password: password) }
        } label: {
          HStack {
            if state.isLoading { ProgressView().tint(Theme.ink800) }
            Text("Sign in").bold()
          }
          .frame(maxWidth: .infinity).padding(.vertical, 14)
          .background(Theme.amber).foregroundStyle(Theme.ink800).clipShape(Capsule())
        }
        .disabled(state.isLoading || email.isEmpty || password.isEmpty)

        // Divider
        HStack(spacing: 12) {
          Rectangle().fill(Theme.ink100).frame(height: 1)
          Text("or").font(.caption).foregroundStyle(Theme.ink400)
          Rectangle().fill(Theme.ink100).frame(height: 1)
        }

        // Continue with Google (native, via GoogleSignIn SDK)
        Button {
          Task { await signInWithGoogle() }
        } label: {
          HStack(spacing: 10) {
            GoogleGLogo().frame(width: 18, height: 18)
            Text("Continue with Google").bold().foregroundStyle(Theme.ink800)
          }
          .frame(maxWidth: .infinity).padding(.vertical, 14)
          .background(.white)
          .clipShape(Capsule())
          .overlay(Capsule().strokeBorder(Theme.ink200))
        }
        .disabled(state.isLoading)

        // Sign in with Apple (native)
        SignInWithAppleButton(.continue) { request in
          let nonce = randomNonceString()
          currentNonce = nonce
          request.requestedScopes = [.fullName, .email]
          request.nonce = sha256(nonce)
        } onCompletion: { result in
          switch result {
          case .success(let authResults):
            guard
              let credential = authResults.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8),
              let nonce = currentNonce
            else { return }
            // credential.user is Apple's stable userID (sub). email/fullName are
            // only present on FIRST authorization — Supabase keeps them after that,
            // so a null email on a returning login is expected and fine.
            let appleUserID = credential.user
            Task { await state.signInWithApple(idToken: idToken, nonce: nonce, appleUserID: appleUserID) }
          case .failure:
            break  // user cancelled or error — leave the form as-is
          }
        }
        .signInWithAppleButtonStyle(.black)
        .frame(height: 50)
        .clipShape(Capsule())

        Spacer()
      }
      .padding(24)
    }
  }

  /// Runs the GoogleSignIn flow, then hands the resulting tokens to Supabase.
  /// The presenting controller and SDK calls must run on the main actor.
  @MainActor
  private func signInWithGoogle() async {
    guard
      let clientID = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String,
      !clientID.isEmpty
    else {
      state.errorMessage = "Google Sign-In isn't configured (missing GIDClientID)."
      return
    }
    guard let presenter = UIApplication.shared.firstKeyWindowRootViewController else {
      state.errorMessage = "Could not present Google Sign-In."
      return
    }

    GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
    do {
      let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
      guard let idToken = result.user.idToken?.tokenString else {
        state.errorMessage = "Google Sign-In failed: no ID token returned."
        return
      }
      let accessToken = result.user.accessToken.tokenString
      await state.signInWithGoogle(idToken: idToken, accessToken: accessToken)
    } catch GIDSignInError.canceled {
      // User dismissed the sheet — leave the form as-is.
    } catch {
      state.errorMessage = error.localizedDescription
    }
  }
}

// MARK: - Google logo

/// Lightweight Google "G" mark for the sign-in button. Swap in the official
/// asset (Assets.xcassets) if exact brand colors are required.
private struct GoogleGLogo: View {
  var body: some View {
    Text("G")
      .font(.system(size: 16, weight: .bold, design: .default))
      .foregroundStyle(Color(red: 0.259, green: 0.522, blue: 0.957)) // Google blue #4285F4
  }
}

private extension UIApplication {
  var firstKeyWindowRootViewController: UIViewController? {
    connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }?
      .rootViewController
  }
}

// MARK: - Apple Sign In nonce helpers

/// Cryptographically-random nonce; the raw value goes to Supabase and its
/// SHA256 hash goes to Apple, so the token can be verified end-to-end.
func randomNonceString(length: Int = 32) -> String {
  let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
  var result = ""
  var remaining = length
  while remaining > 0 {
    let randoms: [UInt8] = (0..<16).map { _ in UInt8.random(in: 0...255) }
    for random in randoms where remaining > 0 {
      if random < charset.count {
        result.append(charset[Int(random)])
        remaining -= 1
      }
    }
  }
  return result
}

func sha256(_ input: String) -> String {
  SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
}

private struct Field: View {
  let label: String
  @Binding var text: String
  var secure: Bool = false
  var keyboard: UIKeyboardType = .default
  var contentType: UITextContentType? = nil

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(label.uppercased()).font(.caption).tracking(1).foregroundStyle(Theme.ink400)
      Group {
        if secure {
          SecureField("", text: $text)
        } else {
          TextField("", text: $text)
            .keyboardType(keyboard)
            .autocapitalization(.none)
            .autocorrectionDisabled()
        }
      }
      .textContentType(contentType)
      .padding(.horizontal, 14).padding(.vertical, 12)
      .background(.white).clipShape(RoundedRectangle(cornerRadius: 14))
      .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(Theme.ink100))
    }
  }
}
