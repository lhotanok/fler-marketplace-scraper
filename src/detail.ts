import { htmlToText } from 'crawlee';
import { decode } from 'html-entities';

import { DOMAIN } from './constants.js';
import {
    Attribute,
    Category,
    FixtureProduct,
    ProductDataFixture,
    ProductDetails,
} from './types.js';
import { buildUrl } from './utils.js';

// Parses the product JSON the Svelte detail page embeds in `script#product-data-fixture`.
export const parseProductDetails = (fixtureJson: string): ProductDetails => {
    const { data: product, profile } = (JSON.parse(fixtureJson) as ProductDataFixture).initialData.data;

    return {
        images: parseImages(product),
        importantInfo: htmlToText(profile?.data?.seller_data?.customers_important_info ?? '').trim(),
        styledDescription: parseStyledDescription(product.description_full?.html ?? product.description),
        categories: (product.sellcategory_extended ?? []).map(({ title, url_www }) => toCategory(title, url_www)),
        flerCategories: (product.fler_section ?? []).map(({ header, url }) => toCategory(header, url)),
        keywords: (product.keywords_extended ?? []).map(({ tag, url_web }) => toCategory(tag, url_web)),
        attributes: parseAttributes(product),
    };
};

const toCategory = (name: string, relUrl: string): Category => ({
    name: name.trim(),
    url: buildUrl(relUrl),
});

// Full-size photo first, smaller sizes as fallback.
const parseImages = ({ photos = [] }: FixtureProduct): string[] => {
    const urls = photos
        .map((photo) => (photo.f ?? photo.h ?? photo.b)?.url)
        .filter((url): url is string => !!url);

    return Array.from(new Set(urls));
};

const parseStyledDescription = (html = ''): string => {
    return decode(html.trim())
        .replace(/[\r\n]/g, '')
        .replace(/ /gi, ' ')
        .replace(/<a href="\//gi, `<a href="https://${DOMAIN}/`);
};

// Groups without any value (e.g. no secondary colors) are not shown on the page either.
const parseAttributes = ({ attr2_grouped: groups = [] }: FixtureProduct): Attribute[] => {
    return groups
        .filter(({ attr2 }) => attr2.length > 0)
        .map(({ title, attr2 }) => ({
            name: title.trim(),
            values: attr2.map((value) => ({ name: value.title.trim() })),
        }));
};
