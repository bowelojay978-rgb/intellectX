import { queryGeneric } from "convex/server";

export const getAuthRuntimeDiagnostic = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    return {
      authenticated: Boolean(identity),
      hasTokenIdentifier: Boolean(identity?.tokenIdentifier),
      hasSubject: Boolean(identity?.subject),
      hasIssuer: Boolean(identity?.issuer),
    };
  },
});
