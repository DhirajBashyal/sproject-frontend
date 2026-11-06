export interface FacebookLoginResponse {
  status?: string;
  authResponse?: { code?: string } | null;
}

export interface FacebookSdk {
  init(options: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }): void;
  login(callback: (response: FacebookLoginResponse) => void, options: object): void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

let loading: Promise<FacebookSdk> | null = null;

/** Loads Facebook's JavaScript SDK once. Load it before the click, so FB.login can open its popup. */
export function loadFacebookSdk(appId: string, version: string) {
  loading ??= new Promise<FacebookSdk>((resolve, reject) => {
    const init = (sdk: FacebookSdk) => {
      sdk.init({ appId, autoLogAppEvents: true, xfbml: false, version });
      resolve(sdk);
    };
    if (window.FB) return init(window.FB);

    window.fbAsyncInit = () => {
      if (window.FB) init(window.FB);
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Facebook. Check your connection, or turn off ad blockers for this site."));
    };
    document.body.append(script);
  });
  return loading;
}
