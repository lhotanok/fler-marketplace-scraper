export const PAGINATION_ATTR = 'data-pagenum';
export const SELLER_ID_ATTR = 'data-id_seller';

// List page selectors
export const PAGINATION_SELECTOR = `.num[${PAGINATION_ATTR}]`;
export const SELLER_ID_SELECTOR = `[${SELLER_ID_ATTR}]`;

// Detail page: product data JSON embedded for the Svelte frontend
export const PRODUCT_DATA_SELECTOR = 'script#product-data-fixture';

export const RESULTS_PER_PAGE = 36;

// Arbitrary 13-digit number
export const DUMMY_PAYLOAD_PARAM = '1659623079243';

export const DOMAIN = 'www.fler.cz';

export const API_REQUEST_HEADERS = {
    Host: DOMAIN,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
};

export const LABELS = {
    API_LIST: 'API_LIST',
    DETAIL: 'DETAIL',
};
