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
            pending: string;
            confirmed: string;
            shipping: string;
            delivered: string;
            completed: string;
            cancelled: string;
        };
        emptyOrders: string;
        emptyWishlist: string;
        addresses?: string;
        referral?: string;
        addToCart?: string;
        emailVerifyTitle?: string;
        emailVerifyDesc?: string;
        emailVerifyResend?: string;
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
        signUp: string;
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
        edit: string;
    };

    // Admin
    admin: {
        nav: {
            dashboard: string;
            products: string;
            reviews: string;
            reviewProducts: string;
            newProduct: string;
            categories: string;
            orders: string;
            inventory: string;
            customers: string;
            customerList: string;
            roles: string;
            suppliers: string;
            settings: string;
            landingSettings: string;
            changePassword: string;
            viewStore: string;
        };
        products: {
            title: string;
            totalCount: string;
            newProduct: string;
            searchPlaceholder: string;
            table: {
                image: string;
                name: string;
                category: string;
                priceStock: string;
                margin: string;
                status: string;
                isNew: string;
                manage: string;
            };
            status: {
                active: string;
                inactive: string;
                soldout: string;
            };
            actions: {
                edit: string;
                clone: string;
                delete: string;
                moveCategory: string;
                cancel: string;
                confirmMove: string;
            };
        };
        new: {
            title: string;
            subtitle: string;
            images: { title: string; desc: string; uploadHint: string; uploadTypes: string; cover: string; };
            options: { title: string; desc: string; minQty: string; maxQty: string; discount: string; freeShipping: string; optionLabel: string; addOption: string; optionLabelPlaceholder: string; unlimitedPlaceholder: string; };
            basic: { title: string; selectCategory: string; isNewLabel: string; isNewDesc: string; };
            specs: { title: string; desc: string; };
            content: { title: string; desc: string; productName: string; shortDesc: string; ingredients: string; howToUse: string; benefits: string; detailDesc: string; seoKeywords: string; };
            translate: { label: string; desc: string; };
            buttons: { save: string; saveWithTranslate: string; saving: string; savingTranslate: string; cancel: string; };
            success: { withTranslate: string; withoutTranslate: string; };
        };
        edit: {
            title: string;
            sku: string;
            sections: {
                images: string;
                basic: string;
                options: string;
                specs: string;
                content: string;
                preview: string;
            };
            fields: {
                sku: string;
                category: string;
                supplier: string;
                status: string;
                price: string;
                cost: string;
                stock: string;
                alert: string;
                approval: string;
                isNew: string;
                isHot: string;
                hotPrice: string;
                brand: string;
                volume: string;
                origin: string;
                skinType: string;
                expiry: string;
                certs: string;
                name: string;
                shortDesc: string;
                ingredients: string;
                howToUse: string;
                benefits: string;
                detailDesc: string;
                seo: string;
            };
            retranslate: {
                label: string;
                desc: string;
            };
            buttons: {
                save: string;
                saving: string;
                cancel: string;
                addOption: string;
            };
        };
    };
}
