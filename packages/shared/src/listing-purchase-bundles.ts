/**
 * Listing-sourced purchase bundles — §5.7 consultant-matching-platform.md.
 * Colour band does not drive these; seller/partner flags on `robot_listings` do.
 */

export const LISTING_PURCHASE_BUNDLE = {
  BUY_ONLY: 'buy_only',
  BUY_WITH_INSTALLATION: 'buy_with_installation',
  BUY_WITH_INSTALLATION_TRAINING: 'buy_with_installation_training',
} as const;

export type ListingPurchaseBundle = (typeof LISTING_PURCHASE_BUNDLE)[keyof typeof LISTING_PURCHASE_BUNDLE];

const BUNDLE_ORDER: readonly ListingPurchaseBundle[] = [
  LISTING_PURCHASE_BUNDLE.BUY_ONLY,
  LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION,
  LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION_TRAINING,
];

export type ListingDeploymentFlags = Readonly<{
  installationRequired: boolean;
  trainingRequired: boolean;
}>;

export type ListingPurchaseBundleResolution = Readonly<{
  availablePurchaseBundles: readonly ListingPurchaseBundle[];
  recommendedPurchaseBundle: ListingPurchaseBundle;
}>;

export function isListingPurchaseBundle(value: string): value is ListingPurchaseBundle {
  return (Object.values(LISTING_PURCHASE_BUNDLE) as string[]).includes(value);
}

/** Derive commerce CTAs from listing deployment flags (installation/training decoupled). */
export function resolveListingPurchaseBundles(flags: ListingDeploymentFlags): ListingPurchaseBundleResolution {
  const available = new Set<ListingPurchaseBundle>([LISTING_PURCHASE_BUNDLE.BUY_ONLY]);

  if (flags.installationRequired) {
    available.add(LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION);
  }
  if (flags.trainingRequired) {
    available.add(LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION_TRAINING);
  }

  let recommended: ListingPurchaseBundle = LISTING_PURCHASE_BUNDLE.BUY_ONLY;
  if (flags.installationRequired && flags.trainingRequired) {
    recommended = LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION_TRAINING;
  } else if (flags.trainingRequired) {
    recommended = LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION_TRAINING;
  } else if (flags.installationRequired) {
    recommended = LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION;
  }

  const availablePurchaseBundles = BUNDLE_ORDER.filter((bundle) => available.has(bundle));

  return {
    availablePurchaseBundles,
    recommendedPurchaseBundle: recommended,
  };
}

const BUNDLE_TIER_RANK: Readonly<Record<ListingPurchaseBundle, number>> = {
  [LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION_TRAINING]: 0,
  [LISTING_PURCHASE_BUNDLE.BUY_WITH_INSTALLATION]: 1,
  [LISTING_PURCHASE_BUNDLE.BUY_ONLY]: 2,
};

/** Display order: recommended first, higher tiers next, buy_only always last. */
export function sortPurchaseBundlesForDisplay(
  bundles: readonly ListingPurchaseBundle[],
  recommended: ListingPurchaseBundle,
): ListingPurchaseBundle[] {
  const buyOnly = bundles.filter((bundle) => bundle === LISTING_PURCHASE_BUNDLE.BUY_ONLY);
  const withoutBuyOnly = bundles.filter((bundle) => bundle !== LISTING_PURCHASE_BUNDLE.BUY_ONLY);
  const sorted = [...withoutBuyOnly].sort((a, b) => BUNDLE_TIER_RANK[a] - BUNDLE_TIER_RANK[b]);

  if (recommended !== LISTING_PURCHASE_BUNDLE.BUY_ONLY) {
    const recommendedIndex = sorted.indexOf(recommended);
    if (recommendedIndex > 0) {
      sorted.splice(recommendedIndex, 1);
      sorted.unshift(recommended);
    }
  }

  return [...sorted, ...buyOnly];
}

/** Educational Make It Green Path step keys — display only, not commerce routing. */
export const MAKE_IT_GREEN_STEP = {
  ADD_INSTALLATION_PARTNER: 'add_installation_partner',
  SETUP_AND_TRAINING: 'setup_and_training',
  ROBOT_READY_TO_USE: 'robot_ready_to_use',
} as const;

export type MakeItGreenStep = (typeof MAKE_IT_GREEN_STEP)[keyof typeof MAKE_IT_GREEN_STEP];

const GREEN_PATH_STEP_ORDER: readonly MakeItGreenStep[] = [
  MAKE_IT_GREEN_STEP.ADD_INSTALLATION_PARTNER,
  MAKE_IT_GREEN_STEP.SETUP_AND_TRAINING,
  MAKE_IT_GREEN_STEP.ROBOT_READY_TO_USE,
];

export function resolveMakeItGreenSteps(flags: ListingDeploymentFlags): readonly MakeItGreenStep[] {
  if (!flags.installationRequired && !flags.trainingRequired) {
    return [MAKE_IT_GREEN_STEP.ROBOT_READY_TO_USE];
  }

  const steps: MakeItGreenStep[] = [];
  if (flags.installationRequired) {
    steps.push(MAKE_IT_GREEN_STEP.ADD_INSTALLATION_PARTNER);
  }
  if (flags.trainingRequired) {
    steps.push(MAKE_IT_GREEN_STEP.SETUP_AND_TRAINING);
  }
  steps.push(MAKE_IT_GREEN_STEP.ROBOT_READY_TO_USE);

  return GREEN_PATH_STEP_ORDER.filter((step) => steps.includes(step));
}
