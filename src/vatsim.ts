import type { OAuthProvider } from "@lucia-auth/oauth";
import {
  OAuthRequestError,
  generateState,
  providerUserAuth,
} from "@lucia-auth/oauth";
import type { Auth } from "lucia";

const PROVIDER_ID = "vatsim";

type Config = {
  clientId: string;
  clientSecret: string;
  scope?: string[];
  redirectUri: string;
};

const VATSIM_URL =
  process.env.NODE_ENV === "development"
    ? "https://auth-dev.vatsim.net"
    : "https://auth.vatsim.net";

export const vatsim = <_Auth extends Auth>(
  auth: _Auth,
  config: Config
): any => {
  const getVatsimTokens = async (code: string) => {
    const request = new Request(VATSIM_URL + "/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
      }),
    });
    const tokens = await handleRequest<{
      scopes: string[];
      token_type: string;
      access_token: string;
      expires_in: number;
      refresh_token: string;
    }>(request);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresIn: tokens.expires_in,
    };
  };

  const getVatsimUser = async (accessToken: string) => {
    const request = new Request(VATSIM_URL + "/api/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const vatsimUser = await handleRequest<VatsimUser>(request);
    return vatsimUser;
  };

  return {
    getAuthorizationUrl: async () => {
      const state = generateState();
      const url = createUrl(VATSIM_URL + "/oauth/authorize", {
        response_type: "code",
        client_id: config.clientId,
        scope: scope([], config.scope),
        redirect_uri: config.redirectUri,
        state,
      });
      return [url, state];
    },
    validateCallback: async (code: string) => {
      const vatsimTokens = await getVatsimTokens(code);
      const vatsimUser = await getVatsimUser(vatsimTokens.accessToken);
      const providerUserId = vatsimUser.data.cid;
      const vatsimUserAuth = await providerUserAuth(
        auth,
        PROVIDER_ID,
        providerUserId
      );
      return {
        ...vatsimUserAuth,
        vatsimUser,
        vatsimTokens,
      };
    },
  } as const satisfies OAuthProvider;
};

export const handleRequest = async <T extends {}>(request: Request) => {
  request.headers.set("Accept", "application/json");
  const response = await fetch(request);
  if (!response.ok) {
    throw new OAuthRequestError(request, response);
  }
  return (await response.json()) as T;
};

export const createUrl = (
  base: string,
  urlSearchParams: Record<string, string> = {}
) => {
  const url = new URL(base);
  for (const [key, value] of Object.entries(urlSearchParams)) {
    url.searchParams.set(key, value);
  }
  return url;
};

export const scope = (base: string[], config: string[] = []) => {
  return [...base, ...(config ?? [])].join(" ");
};

export interface VatsimUser {
  data: {
    cid: string;
    personal: {
      name_first: String;
      name_last: String;
      name_full: String;
      email: String;
    };
    vatsim: {
      region: {
        id: String;
        name: String;
      };
      division: {
        id: String;
        name: String;
      };
      subdivision: {
        id: String;
        name: String;
      };
      rating: {
        id: String;
        long: String;
        short: String;
      };
      pilotRating: {
        id: String;
        short: String;
        long: String;
      };
    };
  };
}
