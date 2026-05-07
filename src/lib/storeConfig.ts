/**
 * HUMAN NATURE — Global Store Configuration
 * 
 * This file provides global settings that apply across all products in the store.
 * Individual components can override these values via props.
 */

export const storeConfig = {
  /**
   * Default banner text displayed on all ProductCards.
   * Set to `null` to hide the banner globally.
   * Individual products can override this via the `customBannerText` prop.
   */
  defaultBannerText: "SADECE ONLINE" as string | null,

  /**
   * Store currency settings
   */
  currency: {
    code: "TRY",
    locale: "tr-TR",
    symbol: "TL",
  },
};
