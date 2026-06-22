/** GET /developer-portal — index of available resources. */
export interface PortalIndex {
  name: string;
  resources: {
    interactiveDocs: string; // '/docs'
    openApiSpec: string; // '/docs-json'
    postmanCollection: string; // '/api/developer-portal/postman'
    sdks: string; // '/api/developer-portal/sdks'
  };
}

/** GET /developer-portal/sdks — how to generate client SDKs. */
export interface SdkInfo {
  message: string;
  openApiUrl: string;
  examples: { language: string; command: string }[];
}
