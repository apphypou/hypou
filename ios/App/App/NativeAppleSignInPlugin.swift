import AuthenticationServices
import Capacitor
import CryptoKit
import Security
import UIKit

@objc(NativeAppleSignInPlugin)
class NativeAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAppleSignInPlugin"
    public let jsName = "NativeAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var activeCall: CAPPluginCall?
    private var activeNonce: String?

    @objc func authorize(_ call: CAPPluginCall) {
        guard activeCall == nil else {
            call.reject("Sign in with Apple is already in progress.")
            return
        }

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = requestedScopes(from: call.getString("scopes") ?? "email name")
        if let nonce = Self.makeNonce() {
            activeNonce = nonce
            request.nonce = Self.sha256Hex(nonce)
        }

        activeCall = call

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    private func requestedScopes(from scopes: String) -> [ASAuthorization.Scope] {
        scopes
            .split(separator: " ")
            .compactMap { scope in
                switch scope {
                case "email":
                    return .email
                case "name":
                    return .fullName
                default:
                    return nil
                }
            }
    }
}

extension NativeAppleSignInPlugin: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            activeCall?.reject("Apple did not return a valid credential.")
            activeCall = nil
            activeNonce = nil
            return
        }

        guard let identityTokenData = credential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            activeCall?.reject("Apple did not return an identity token.")
            activeCall = nil
            activeNonce = nil
            return
        }

        var response: JSObject = [
            "identityToken": identityToken,
            "user": credential.user
        ]

        if let activeNonce {
            response["nonce"] = activeNonce
        }

        if let authorizationCodeData = credential.authorizationCode,
           let authorizationCode = String(data: authorizationCodeData, encoding: .utf8) {
            response["authorizationCode"] = authorizationCode
        }

        if let email = credential.email {
            response["email"] = email
        }
        if let givenName = credential.fullName?.givenName {
            response["givenName"] = givenName
        }
        if let familyName = credential.fullName?.familyName {
            response["familyName"] = familyName
        }

        activeCall?.resolve(response)
        activeCall = nil
        activeNonce = nil
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let nsError = error as NSError
        if nsError.domain == ASAuthorizationError.errorDomain {
            switch ASAuthorizationError.Code(rawValue: nsError.code) {
            case .canceled:
                activeCall?.reject("The user canceled Sign in with Apple.", "APPLE_SIGN_IN_CANCELED")
            default:
                activeCall?.reject("Sign in with Apple is unavailable on this device. Configure an Apple account in Settings or use the browser fallback.", "APPLE_SIGN_IN_UNAVAILABLE")
            }
        } else {
            activeCall?.reject(error.localizedDescription)
        }
        activeCall = nil
        activeNonce = nil
    }

    private static func makeNonce() -> String? {
        var bytes = [UInt8](repeating: 0, count: 32)
        let status = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        guard status == errSecSuccess else { return nil }

        return Data(bytes)
            .base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private static func sha256Hex(_ value: String) -> String {
        let digest = SHA256.hash(data: Data(value.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

extension NativeAppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let window = bridge?.viewController?.view.window {
            return window
        }

        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first
        return scene?.windows.first { $0.isKeyWindow } ?? UIWindow()
    }
}
