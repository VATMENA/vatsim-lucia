import type { Auth } from "lucia";
type Config = {
    clientId: string;
    clientSecret: string;
    scope?: string[];
    redirectUri: string;
};
export declare const vatsim: <_Auth extends Auth<any>>(auth: _Auth, config: Config) => any;
export declare const handleRequest: <T extends {}>(request: Request) => Promise<T>;
export declare const createUrl: (base: string, urlSearchParams?: Record<string, string>) => URL;
export declare const scope: (base: string[], config?: string[]) => string;
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
export {};
