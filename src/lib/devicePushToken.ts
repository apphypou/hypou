const DEVICE_PUSH_TOKEN_KEY = "hypou:device-push-token";

export function rememberDevicePushToken(token: string) {
  localStorage.setItem(DEVICE_PUSH_TOKEN_KEY, token);
}

export function getRememberedDevicePushToken() {
  return localStorage.getItem(DEVICE_PUSH_TOKEN_KEY);
}

export function forgetDevicePushToken() {
  localStorage.removeItem(DEVICE_PUSH_TOKEN_KEY);
}
