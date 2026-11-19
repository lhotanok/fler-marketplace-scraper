export type InputSchema = {
    sellerUrls: string[];
    maxItems?: number;
    proxyConfiguration: ProxyConfigurationInput;
};

export interface ProxyConfigurationInput {
    useApifyProxy?: boolean;
    apifyProxyGroups?: string[]
    apifyProxyCountry?: string
    proxyUrls?: string[]
};

export type SellerInfo = {
    id: string;
    name: string;
    url: string;
    avatar: string;
    totalItems: number;
    soldItems: number;
};

export interface PagesState {
    remainingPages: number;
};

export type ProductSimpleInfo = {
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    priceCzk: number;
    priceEur: number;
    flagcorners: string[];
};

export type Category = {
    name: string;
    url: string;
};

// The redesigned page has no links on attribute values anymore.
export type AttributeValue = {
    name: string;
};

export type Attribute = {
    name: string;
    values: AttributeValue[];
};

export interface ProductInfo extends ProductSimpleInfo {
    images: string[];
    importantInfo: string;
    styledDescription: string;
    categories: Category[];
    flerCategories: Category[];
    sizes: string[];
    keywords: Category[];
    attributes: Attribute[];
};

export type ProductDetails = Pick<
    ProductInfo,
    'images' | 'importantInfo' | 'styledDescription' | 'categories' | 'flerCategories' | 'keywords' | 'attributes'
>;

type FixturePhotoSize = {
    url: string;
};

export type FixtureProduct = {
    description?: string;
    description_full?: { html?: string };
    // Sizes: s (70px), b (500px), h (1000px), f (full)
    photos?: Partial<Record<'s' | 'b' | 'h' | 'f', FixturePhotoSize>>[];
    sellcategory_extended?: { title: string; url_www: string }[];
    fler_section?: { header: string; url: string }[];
    keywords_extended?: { tag: string; url_web: string }[];
    attr2_grouped?: { title: string; attr2: { title: string }[] }[];
};

// Only the parts of `script#product-data-fixture` the Actor reads.
export type ProductDataFixture = {
    initialData: {
        data: {
            data: FixtureProduct;
            profile?: { data?: { seller_data?: { customers_important_info?: string } } };
        };
    };
};

export type ResponseSellerInfo = {
    seller_id: string;
    seller_name: string;
    seller_url: string;
    seller_avatar: string;
    seller_num_items: number;
    seller_num_sold: number;
};

export type ResponseProductSimpleInfo = {
    id: string;
    url: string;
    title: string;
    description: string;
    thumb: string;
    price_czk: string;
    price_eur: string;
    flagcorners: string[];
};

