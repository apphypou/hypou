import Capacitor
import CryptoKit
import Foundation
import GoogleSignIn
import Security
import UIKit

@objc(NativeGoogleSignInPlugin)
public class NativeGoogleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeGoogleSignInPlugin"
    public let jsName = "NativeGoogleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signOut", returnType: CAPPluginReturnPromise)
    ]

    @objc public func signIn(_ call: CAPPluginCall) {
        guard let serverClientId = call.getString("clientId"), !serverClientId.isEmpty else {
            call.reject("clientId must be provided.")
            return
        }

        guard let iosClientId = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String,
              !iosClientId.isEmpty else {
            call.reject("GIDClientID is missing from Info.plist.")
            return
        }

        guard let viewController = bridge?.viewController else {
            call.reject("viewController is not available.")
            return
        }

        let scopes = call.getArray("scopes", String.self) ?? []
        let nonce = Self.makeNonce()
        guard let nonce else {
            call.reject("Could not generate Google nonce.")
            return
        }

        let hashedNonce = Self.sha256Hex(nonce)
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(
            clientID: iosClientId,
            serverClientID: serverClientId
        )

        let completion: (GIDSignInResult?, Error?) -> Void = { result, error in
            if let error {
                let nsError = error as NSError
                if nsError.code == GIDSignInError.canceled.rawValue {
                    call.reject("The user canceled the sign-in flow.", "SIGN_IN_CANCELED")
                } else {
                    call.reject(error.localizedDescription)
                }
                return
            }

            guard let result else {
                call.reject("Google did not return a sign-in result.")
                return
            }

            let user = result.user
            guard let idToken = user.idToken?.tokenString else {
                call.reject("ID token is missing from the sign-in result.")
                return
            }

            var response: JSObject = [
                "idToken": idToken,
                "nonce": nonce
            ]

            response["userId"] = user.userID ?? NSNull()
            response["email"] = user.profile?.email ?? NSNull()
            response["displayName"] = user.profile?.name ?? NSNull()
            response["givenName"] = user.profile?.givenName ?? NSNull()
            response["familyName"] = user.profile?.familyName ?? NSNull()
            response["imageUrl"] = user.profile?.imageURL(withDimension: 0)?.absoluteString ?? NSNull()
            response["accessToken"] = scopes.isEmpty ? NSNull() : user.accessToken.tokenString
            response["serverAuthCode"] = result.serverAuthCode ?? NSNull()

            call.resolve(response)
        }

        DispatchQueue.main.async {
            GIDSignIn.sharedInstance.signIn(
                withPresenting: viewController,
                hint: nil,
                additionalScopes: scopes,
                nonce: hashedNonce,
                completion: completion
            )
        }
    }

    @objc public func signOut(_ call: CAPPluginCall) {
        GIDSignIn.sharedInstance.signOut()
        call.resolve()
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
