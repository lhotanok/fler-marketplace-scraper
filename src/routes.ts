import { Actor } from 'apify';
import {
    createCheerioRouter,
    log,
    RequestProvider,
} from 'crawlee';
import { decode } from 'html-entities';

import {
    API_REQUEST_HEADERS,
    DUMMY_PAYLOAD_PARAM,
    LABELS,
    PAGINATION_ATTR,
    PAGINATION_SELECTOR,
    PRODUCT_DATA_SELECTOR,
    RESULTS_PER_PAGE,
    SELLER_ID_ATTR,
    SELLER_ID_SELECTOR,
} from './constants.js';
import { parseProductDetails } from './detail.js';

import {
    PagesState,
    ProductInfo,
    ProductSimpleInfo,
    ResponseProductSimpleInfo,
    ResponseSellerInfo,
    SellerInfo
} from './types.js';

import {
    buildUrl,
    parseNumber,
    shuffleChars
} from './utils.js';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ $, request: { url }, response, crawler }) => {
    log.info(`Extracting total number of pages`, { url });

    const sellerId = $(SELLER_ID_SELECTOR).attr(SELLER_ID_ATTR);
    if (!sellerId) {
        if (response.statusCode === 404) {
            log.error(`Seller not found, skipping it. Check the seller URL.`, { url });
            return;
        }
        // Other pages without a seller ID are usually block or error pages, so retry them.
        throw new Error(`Seller ID not found on ${url}`);
    }

    const state = await crawler.useState<PagesState>();

    const paginationElements = $(PAGINATION_SELECTOR);

    const lastPageText = $(paginationElements[paginationElements.length - 1]).attr(PAGINATION_ATTR);
    const lastPage = lastPageText ? Number(lastPageText) : 1;

    log.info(`Found ${lastPage} pages with products`);

    const requestQueue = await crawler.getRequestQueue();

    await enqueueApiListRequests(lastPage, sellerId, requestQueue, state.remainingPages);
});

router.addHandler(LABELS.API_LIST, async ({ json, crawler, request: { userData: { page } } }) => {
    log.info(`Extracting simple products info from page ${page}`);

    const productList = json.response.data.data_list.product_list;
    log.info(`Found ${productList.length} products on page ${page}`);

    const requestQueue = await crawler.getRequestQueue();
    const state = await crawler.useState<PagesState>();

    for (const product of productList) {
        if (state.remainingPages <= 0) {
            break;
        }

        // Take the slot before awaiting, or pages handled in parallel can both take the last one.
        state.remainingPages--;

        const sellerInfo = buildSellerInfo(product);
        const productInfo = buildProductInfo(product);

        await requestQueue.addRequest({
            url: productInfo.url,
            userData: {
                simpleInfo: { sellerInfo, ...productInfo },
                label: LABELS.DETAIL,
            },
        });
    }
});

router.addHandler(LABELS.DETAIL, async ({ $, request: { url, userData: { simpleInfo } } }) => {
    log.info(`Extracting product info`, { url });

    const fixtureJson = $(PRODUCT_DATA_SELECTOR).text();
    if (!fixtureJson) {
        // Throwing lets the crawler retry. A page without the blob is usually a block or error page.
        throw new Error(`Product data not found on ${url}`);
    }

    const productInfo : ProductInfo = {
        ...simpleInfo,
        ...parseProductDetails(fixtureJson),
    };

    await Actor.pushData(productInfo);
});

const enqueueApiListRequests = async (
    lastPage: number,
    sellerId: string,
    requestQueue: RequestProvider,
    maxItems?: number
) => {
    // 0 means the limit is used up by other sellers, not unlimited.
    let allowedItemsCount = maxItems ?? Number.MAX_SAFE_INTEGER;

    for (let offset = 0; offset < lastPage * RESULTS_PER_PAGE; offset += RESULTS_PER_PAGE) {
        if (allowedItemsCount <= 0) {
            break;
        }

        const payload = `seller_shop=${sellerId}&offset=${offset}&conf=&_dummy=${shuffleChars(DUMMY_PAYLOAD_PARAM)}`;

        const url = 'https://www.fler.cz/component/default/product_listing/load_shop';
        const page = (offset / RESULTS_PER_PAGE) + 1;

        log.info(`Enqueuing request with offset ${offset} (page ${page})`);

        await requestQueue.addRequest({
            url,
            // The URL is the same for every seller, so the key needs the seller ID.
            uniqueKey: `${url}-${sellerId}-${offset}`,
            method: 'post',
            payload,
            headers: API_REQUEST_HEADERS,
            userData: {
                page,
                label: LABELS.API_LIST,
            },
        });

        allowedItemsCount -= RESULTS_PER_PAGE;
    }
};

const buildSellerInfo = (response: ResponseSellerInfo) : SellerInfo => {
    const {
        seller_id: id,
        seller_name: name,
        seller_url: relUrl,
        seller_avatar: avatar,
        seller_num_items: totalItems,
        seller_num_sold: soldItems,
    } = response;

    return {
        id,
        name: decode(name),
        url: buildUrl(relUrl),
        avatar,
        totalItems,
        soldItems,
    };
};

const buildProductInfo = (response: ResponseProductSimpleInfo) : ProductSimpleInfo => {
    const {
        url: relUrl,
        title,
        description,
        thumb: thumbnail,
        price_czk: priceCzk,
        price_eur: priceEur,
        flagcorners,
    } = response;

    return {
        url: buildUrl(relUrl),
        title: decode(title),
        description: decode(description),
        thumbnail,
        priceCzk: parseNumber(priceCzk),
        priceEur: parseNumber(priceEur),
        flagcorners,
    };
};
