/**
 * Centralized i18n Translation System for Antigravity / KKshop
 *
 * All UI text is managed through translation keys.
 * Product data translations come from the database (ProductTranslation table).
 *
 * Supported languages: ko, en, km, zh
 */

export type Language = 'ko' | 'en' | 'km' | 'zh';

export interface Translations {
    // GNB / Navigation
    nav: {
        cosmetics: string;
        living: string;
        about: string;
        languageLabel: string;
    };

    // Bottom Tab Bar
    tab: {
        home: string;
        category: string;
        search: string;
        cart: string;
        mypage: string;
    };

    // Hero Section
    hero: {
        topText: string;
        badge: string;
        title: string;
        desc: string;
        cta: string;
    };

    // Home Page
    home: {
        mdPick: string;
        mdDesc: string;
        realtimeReview: string;
        reviewSubtitle: string;
        catBeauty: string;
        catLiving: string;
        catPopular: string;
    };

    // Category Shortcuts
    shortcuts: {
        skincare: string;
        makeup: string;
        hairBody: string;
        living: string;
        health: string;
        best: string;
        newArrivals: string;
        sale: string;
        all: string;
    };

    // Curation Sections
    curation: {
        todayPick: string;
        todayPickDesc: string;
        categoryBest: string;
        categoryBestDesc: string;
        alsoViewed: string;
        alsoViewedDesc: string;
        viewAll: string;
    };

    // Product Card
    product: {
        addCart: string;
        bestBadge: string;
        usdPrice: string;
        soldOut: string;
    };

    // PDP
    pdp: {
        tabs: { desc: string; ingredients: string; reviews: string; shipping: string };
        addToCart: string;
        added: string;
        buyNow: string;
        inStock: string;
        outOfStock: string;
        back: string;
        qty: string;
        freeShipping: string;
    };

    // Mini Cart Drawer
    cart: {
        title: string;
        empty: string;
        emptyDesc: string;
        subtotal: string;
        checkout: string;
        continueShopping: string;
        crossSellTitle: string;
        remove: string;
    };

    // Checkout
    checkout: {
        pageTitle: string;
        shippingAddress: string;
        orderSummary: string;
        paymentMethod: string;
        placeOrder: string;
        orderComplete: string;
        orderNumber: string;
        estimatedDelivery: string;
        thankYou: string;
        backToHome: string;
        fullName: string;
        phone: string;
        address: string;
        city: string;
        notes: string;
        shippingFee: string;
        discount: string;
        total: string;
        couponPlaceholder: string;
        applyCoupon: string;
    };

    // My Page
    mypage: {
        title: string;
        orders: string;
        wishlist: string;
        recentlyViewed: string;
        logout: string;
        loginRequired: string;
        loginDesc: string;
        orderStatus: {
            paid: string;
            preparing: string;
            shipping: string;
            delivered: string;
        };
        emptyOrders: string;
        emptyWishlist: string;
    };

    // Auth / Login
    auth: {
        loginTitle: string;
        loginSubtitle: string;
        continueWith: string;
        orEmail: string;
        emailPlaceholder: string;
        passwordPlaceholder: string;
        loginButton: string;
        signupLink: string;
        facebook: string;
        telegram: string;
        tiktok: string;
    };

    // Footer
    footer: {
        tagline: string;
        customerSupport: string;
        information: string;
        aboutUs: string;
        deliveryInfo: string;
        privacyPolicy: string;
        terms: string;
        acceptedPayments: string;
        copyright: string;
        builtWith: string;
    };

    // Common
    common: {
        loading: string;
        error: string;
        retry: string;
        noResults: string;
        seeMore: string;
        close: string;
        confirm: string;
        cancel: string;
        save: string;
        delete: string;
        search: string;
    };
}

// Export a helper to get translations
export function getTranslations(lang: Language): Translations {
    switch (lang) {
        case 'ko': return require('./ko').default;
        case 'km': return require('./km').default;
        case 'zh': return require('./zh').default;
        case 'en':
        default: return require('./en').default;
    }
}
