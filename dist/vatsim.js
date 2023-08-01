import { OAuthRequestError, generateState, providerUserAuth, } from "@lucia-auth/oauth";
const PROVIDER_ID = "vatsim";
const VATSIM_URL = process.env.NODE_ENV === "development"
    ? "https://auth-dev.vatsim.net"
    : "https://auth.vatsim.net";
export const vatsim = (auth, config) => {
    const getVatsimTokens = async (code) => {
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
        const tokens = await handleRequest(request);
        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpiresIn: tokens.expires_in,
        };
    };
    const getVatsimUser = async (accessToken) => {
        const request = new Request(VATSIM_URL + "/api/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const vatsimUser = await handleRequest(request);
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
        validateCallback: async (code) => {
            const vatsimTokens = await getVatsimTokens(code);
            const vatsimUser = await getVatsimUser(vatsimTokens.accessToken);
            const providerUserId = vatsimUser.data.cid;
            const vatsimUserAuth = await providerUserAuth(auth, PROVIDER_ID, providerUserId);
            return {
                ...vatsimUserAuth,
                vatsimUser,
                vatsimTokens,
            };
        },
    };
};
export const handleRequest = async (request) => {
    request.headers.set("Accept", "application/json");
    const response = await fetch(request);
    if (!response.ok) {
        throw new OAuthRequestError(request, response);
    }
    return (await response.json());
};
export const createUrl = (base, urlSearchParams = {}) => {
    const url = new URL(base);
    for (const [key, value] of Object.entries(urlSearchParams)) {
        url.searchParams.set(key, value);
    }
    return url;
};
export const scope = (base, config = []) => {
    return [...base, ...(config ?? [])].join(" ");
};
