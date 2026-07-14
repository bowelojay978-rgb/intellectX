import { requireClerkJwtIssuerDomain } from "./lib/authConfigPolicy";

export default {
  providers: [
    {
      domain: requireClerkJwtIssuerDomain(),
      applicationID: "convex",
    },
  ],
};
