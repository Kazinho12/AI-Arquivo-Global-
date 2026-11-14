/** Enable only after the additive migration and its grants/RPCs are verified. */
export const coverStylePersistenceEnabled =
  import.meta.env?.VITE_ENABLE_COVER_STYLE === "true";
export interface CoverStyleOptions {
  customCoversEnabled?: boolean;
  coverStyleEnabled?: boolean;
  coverStudioV2Enabled?: boolean;
}

/** Separate opt-in: requires 20261111050000_cover_studio_v2.sql first. */
export const coverStudioV2Enabled =
  coverStylePersistenceEnabled &&
  import.meta.env?.VITE_ENABLE_COVER_STUDIO_V2 === "true";
