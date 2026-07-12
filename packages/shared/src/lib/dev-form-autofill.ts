import { ROBOT_LISTING_CERTIFIED_STOCK_TYPE_KEY, ROBOT_LISTING_USED_TYPE_KEY } from '../robot-listings';

const FIRST_NAMES = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery'] as const;
const LAST_NAMES = ['Rivera', 'Chen', 'Patel', 'Brooks', 'Nguyen', 'Khan', 'Silva', 'Murphy'] as const;

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randomAlphanumeric(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = randomInt(chars.length);
    result += chars[index] ?? 'a';
  }
  return result;
}

export function createRandomDevEmail(domain = 'yopmail.com'): string {
  return `constellation-test-${randomAlphanumeric(8)}@${domain}`;
}

export function createRandomDevPassword(length = 10): string {
  return `Test-${randomAlphanumeric(length)}!1`;
}

export type JoinBasicInfoAutofillValues = Readonly<{
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
}>;

export function createRandomJoinBasicInfoAutofill(): JoinBasicInfoAutofillValues {
  const firstName = FIRST_NAMES[randomInt(FIRST_NAMES.length)] ?? 'Alex';
  const lastName = LAST_NAMES[randomInt(LAST_NAMES.length)] ?? 'Rivera';
  const password = createRandomDevPassword();

  return {
    name: `${firstName} ${lastName}`,
    email: createRandomDevEmail(),
    password,
    confirmPassword: password,
    companyName: `Constellation Test ${randomAlphanumeric(4).toUpperCase()}`,
  };
}

export function createDevAutofillFile(fileName: string, mimeType = 'application/pdf'): File {
  const content = `Constellation dev autofill — ${new Date().toISOString()}`;
  return new File([content], fileName, { type: mimeType });
}

export function createRandomJoinDocumentsAutofill(
  documents: readonly Readonly<{ id: string; key: string }>[],
): Record<string, File> {
  const values: Record<string, File> = {};
  for (const doc of documents) {
    values[doc.id] = createDevAutofillFile(`${doc.key}-dev.pdf`);
  }
  return values;
}

/** Minimal valid JPEG bytes for dev listing photo uploads. */
export function createDevAutofillImageFile(fileName: string): File {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
  return new File([bytes], fileName, { type: 'image/jpeg' });
}

export type SellerListingCatalogOption = Readonly<{
  key: string;
  manufacturerKey?: string | null;
}>;

export type SellerListingAutofillValues = Readonly<{
  title: string;
  manufacturerKey: string;
  modelKey: string;
  year: string;
  countryKey: string;
  cityKey: string;
  price: string;
  description: string;
  usedConditionKey: string;
  logisticsProviderKeys: readonly string[];
  serialNumber: string;
  securePaymentDisclosure: boolean;
  photos: readonly Readonly<{ type: 'pending'; file: File; previewUrl: string }>[];
  ownershipProofFile: File | null;
  ownershipProofExisting: null;
}>;

export type PartnerListingAutofillValues = Readonly<{
  title: string;
  manufacturerKey: string;
  modelKey: string;
  year: string;
  countryKey: string;
  cityKey: string;
  listingTypeKey: string;
  usedConditionKey: string;
  price: string;
  description: string;
  logisticsProviderKeys: readonly string[];
  shippingMethodKey: string;
  trackingOptionKey: string;
  cargoInsuranceOptionKey: string;
  customsDocumentOptionKey: string;
  deliveryCountryKeys: readonly string[];
  estimatedShippingTime: string;
  shippingCostEstimate: string;
  offersDeliveredDutyPaid: boolean;
  securePaymentDisclosure: boolean;
  photos: readonly Readonly<{ type: 'pending'; file: File; previewUrl: string }>[];
}>;

export function createRandomPartnerListingAutofill(catalogs: {
  models: readonly SellerListingCatalogOption[];
  manufacturers: readonly SellerListingCatalogOption[];
  listingTypes: readonly SellerListingCatalogOption[];
  usedConditions: readonly SellerListingCatalogOption[];
  logisticsProviders: readonly SellerListingCatalogOption[];
  shippingMethods: readonly SellerListingCatalogOption[];
  trackingOptions: readonly SellerListingCatalogOption[];
  cargoInsuranceOptions: readonly SellerListingCatalogOption[];
  customsDocumentOptions: readonly SellerListingCatalogOption[];
  countries: readonly SellerListingCatalogOption[];
}): PartnerListingAutofillValues {
  const pick = <T extends SellerListingCatalogOption>(items: readonly T[]): T | undefined =>
    items[randomInt(items.length)];

  const model = pick(catalogs.models);
  const manufacturer =
    (model?.manufacturerKey
      ? catalogs.manufacturers.find((entry) => entry.key === model.manufacturerKey)
      : undefined) ?? pick(catalogs.manufacturers);
  const listingType = pick(catalogs.listingTypes.filter((type) => type.key !== ROBOT_LISTING_CERTIFIED_STOCK_TYPE_KEY));
  const condition = pick(catalogs.usedConditions);
  const logistics = pick(catalogs.logisticsProviders);
  const shippingMethod = pick(catalogs.shippingMethods);
  const trackingOption = pick(catalogs.trackingOptions);
  const cargoInsurance = pick(catalogs.cargoInsuranceOptions);
  const customsDocument = pick(catalogs.customsDocumentOptions);
  const country = pick(catalogs.countries);
  const secondCountry = catalogs.countries.find((entry) => entry.key !== country?.key);
  const secondLogistics = catalogs.logisticsProviders.find((entry) => entry.key !== logistics?.key);

  const photoFile = createDevAutofillImageFile(`listing-dev-${randomAlphanumeric(4)}.jpg`);
  const photoPreviewUrl = URL.createObjectURL(photoFile);

  return {
    title: `Dev Partner Listing ${randomAlphanumeric(4).toUpperCase()}`,
    manufacturerKey: manufacturer?.key ?? '',
    modelKey: model?.key ?? '',
    year: String(2018 + randomInt(6)),
    countryKey: country?.key ?? '',
    cityKey: '',
    listingTypeKey: listingType?.key ?? ROBOT_LISTING_USED_TYPE_KEY,
    usedConditionKey: condition?.key ?? '',
    price: String(35000 + randomInt(75000)),
    description: `Constellation dev autofill partner listing — ${new Date().toISOString()}`,
    logisticsProviderKeys: [logistics?.key, secondLogistics?.key].filter((key): key is string => Boolean(key)),
    shippingMethodKey: shippingMethod?.key ?? '',
    trackingOptionKey: trackingOption?.key ?? '',
    cargoInsuranceOptionKey: cargoInsurance?.key ?? '',
    customsDocumentOptionKey: customsDocument?.key ?? '',
    deliveryCountryKeys: [country?.key, secondCountry?.key].filter((key): key is string => Boolean(key)),
    estimatedShippingTime: '5–10 business days',
    shippingCostEstimate: String(800 + randomInt(1200)),
    offersDeliveredDutyPaid: true,
    securePaymentDisclosure: true,
    photos: [{ type: 'pending', file: photoFile, previewUrl: photoPreviewUrl }],
  };
}

export function createRandomSellerListingAutofill(catalogs: {
  models: readonly SellerListingCatalogOption[];
  manufacturers: readonly SellerListingCatalogOption[];
  usedConditions: readonly SellerListingCatalogOption[];
  logisticsProviders: readonly SellerListingCatalogOption[];
  countries: readonly SellerListingCatalogOption[];
}): SellerListingAutofillValues {
  const pick = <T extends SellerListingCatalogOption>(items: readonly T[]): T | undefined =>
    items[randomInt(items.length)];

  const model = pick(catalogs.models);
  const manufacturer =
    (model?.manufacturerKey
      ? catalogs.manufacturers.find((entry) => entry.key === model.manufacturerKey)
      : undefined) ?? pick(catalogs.manufacturers);
  const condition = pick(catalogs.usedConditions);
  const logistics = pick(catalogs.logisticsProviders);
  const country = pick(catalogs.countries);
  const secondLogistics = catalogs.logisticsProviders.find((entry) => entry.key !== logistics?.key);

  const photoFile = createDevAutofillImageFile(`listing-dev-${randomAlphanumeric(4)}.jpg`);
  const photoPreviewUrl = URL.createObjectURL(photoFile);

  return {
    title: `Dev Listing ${randomAlphanumeric(4).toUpperCase()}`,
    manufacturerKey: manufacturer?.key ?? '',
    modelKey: model?.key ?? '',
    year: String(2018 + randomInt(6)),
    countryKey: country?.key ?? '',
    cityKey: '',
    price: String(25000 + randomInt(50000)),
    description: `Constellation dev autofill listing — ${new Date().toISOString()}`,
    usedConditionKey: condition?.key ?? '',
    logisticsProviderKeys: [logistics?.key, secondLogistics?.key].filter((key): key is string => Boolean(key)),
    serialNumber: `SN-DEV-${randomAlphanumeric(8).toUpperCase()}`,
    securePaymentDisclosure: true,
    photos: [{ type: 'pending', file: photoFile, previewUrl: photoPreviewUrl }],
    ownershipProofFile: createDevAutofillFile('ownership-proof-dev.pdf'),
    ownershipProofExisting: null,
  };
}
