'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShoppingBag, Truck, CreditCard, RefreshCw, UserCircle, Gift, ShieldCheck } from 'lucide-react';
import { useSafeAppStore } from '@/store/useAppStore';
import Footer from '@/components/Footer';

/* ──────────────────── i18n ──────────────────── */
interface FaqItem { q: string; a: string }
interface FaqCategory { icon: React.ElementType; title: string; items: FaqItem[] }

const faqData: Record<string, FaqCategory[]> = {
    en: [
        {
            icon: ShoppingBag, title: 'Shopping & Orders',
            items: [
                { q: 'What products does KKShop sell?', a: 'KKShop specializes in authentic Korean beauty (K-Beauty) products — skincare, makeup, masks, serums, and more. We also offer quality Korean lifestyle products selected for great value. Every product is 100% genuine and sourced directly from Korea.' },
                { q: 'How do I place an order?', a: 'Browse products, add items to your cart, then proceed to checkout. Fill in your delivery address (you can save multiple addresses), apply any coupon or points, and confirm your order. You\'ll receive an email confirmation with your order details.' },
                { q: 'Can I modify or cancel my order?', a: 'You can cancel your order while it is in "Pending" status from your My Page → Orders. Once the order moves to "Confirmed" or "Shipping" status, cancellation is no longer available. Contact our support team for assistance.' },
                { q: 'How can I track my order?', a: 'Go to My Page → Orders and click on any order to see the full status timeline. Once shipped, you\'ll see the carrier name, tracking number, and a link to track your package in real-time.' },
                { q: 'What if a product is sold out?', a: 'Sold-out products are clearly marked. You can add them to your Wishlist and we\'ll update the product page when stock is replenished. Check back regularly as we restock popular items frequently.' },
            ],
        },
        {
            icon: Truck, title: 'Shipping & Delivery',
            items: [
                { q: 'Where do you deliver?', a: 'We deliver across all provinces of Cambodia. Delivery fees vary by province and are shown at checkout. Phnom Penh typically enjoys the fastest delivery times.' },
                { q: 'How long does delivery take?', a: 'Phnom Penh: 1–3 business days. Other provinces: 3–7 business days. Delivery times may vary during holidays or peak seasons.' },
                { q: 'Is there free shipping?', a: 'Yes! Orders over $30 qualify for free shipping to Phnom Penh. We also run free shipping promotions regularly — check our homepage banners for current deals. Some bulk purchase options also include free shipping.' },
                { q: 'Can I change my delivery address after ordering?', a: 'Address changes are only possible while the order is in "Pending" status. Please contact our support team immediately if you need to change your address.' },
            ],
        },
        {
            icon: CreditCard, title: 'Payment',
            items: [
                { q: 'What payment methods are accepted?', a: 'We currently support Cash on Delivery (COD). Bank QR payment via KHQR (supporting ABA, ACLEDA, Wing, TrueMoney, Pi Pay) is coming soon. You\'ll be notified when online payment becomes available.' },
                { q: 'Is it safe to shop on KKShop?', a: 'Absolutely. We use HTTPS encryption, secure authentication, and never store sensitive payment data. Your personal information is protected under our Privacy Policy.' },
                { q: 'Can I pay in currencies other than USD?', a: 'All prices are displayed in USD, which is widely accepted in Cambodia. We plan to add Khmer Riel (KHR) display in a future update.' },
            ],
        },
        {
            icon: RefreshCw, title: 'Returns & Exchanges',
            items: [
                { q: 'What is your return policy?', a: 'If you receive a damaged, defective, or incorrect product, please contact us within 7 days of delivery. We will arrange a replacement or full refund. Please note that cosmetics and skincare products cannot be returned once opened due to hygiene regulations.' },
                { q: 'How do I request a return?', a: 'Go to My Page → Orders → click the delivered order → "Request Return/Refund" button. Describe the issue and our team will review your request within 1–2 business days.' },
                { q: 'How long does a refund take?', a: 'Refunds are processed within 3–5 business days after approval. Points used in the order will be restored to your account immediately.' },
            ],
        },
        {
            icon: UserCircle, title: 'Account & Profile',
            items: [
                { q: 'How do I create an account?', a: 'Click "Sign Up" and enter your name, email, and password. You can also sign up quickly using your Google account. After registration, verify your email to activate your account.' },
                { q: 'I forgot my password. What should I do?', a: 'Click "Forgot Password" on the login page and enter your registered email. You\'ll receive a password reset link within minutes. The link is valid for 1 hour.' },
                { q: 'Can I save multiple delivery addresses?', a: 'Yes! Go to My Page → Addresses to manage multiple delivery addresses. You can set a default address and quickly switch between them during checkout.' },
                { q: 'How do I change my language?', a: 'Use the language selector in the top navigation bar. We support English, Korean (한국어), Khmer (ខ្មែរ), and Chinese (中文). Your preference is saved automatically.' },
            ],
        },
        {
            icon: Gift, title: 'Points & Rewards',
            items: [
                { q: 'How does the points system work?', a: 'Earn points on every purchase — $100 spent earns you 1,000 points ($1 value). Points can be used as a discount on future orders. 1,000 points = $1 USD discount.' },
                { q: 'How else can I earn points?', a: 'Besides purchases, you earn points by: writing product reviews (500 P), referring friends (1,000 P per signup), and through special promotions. Check your My Page for your current balance.' },
                { q: 'Do points expire?', a: 'Points expire 365 days after they are earned. Use them before they expire to maximize your savings.' },
                { q: 'Is there a limit on how many points I can use?', a: 'You can use points to cover up to 50% of your order total. This ensures a balanced checkout experience.' },
            ],
        },
        {
            icon: ShieldCheck, title: 'Authenticity & Quality',
            items: [
                { q: 'Are all cosmetics 100% genuine Korean products?', a: 'Yes, without exception. Every cosmetic and K-Beauty product on KKShop is 100% authentic, sourced directly from Korea. We do not tolerate counterfeits of any kind. If you ever discover a fake or replica product, please report it to us immediately — we will provide significant compensation.' },
                { q: 'What about household and lifestyle products?', a: 'For lifestyle products, the country of manufacture is not what matters — quality does. We exclusively carry products that have been chosen and trusted by Korean consumers, who are internationally renowned for their exceptionally high and discerning standards. Every lifestyle product on KKShop has passed that test.' },
                { q: 'How are products stored and handled?', a: 'All products are stored in temperature-controlled environments and shipped with care. Skincare products are packaged with protective materials to prevent damage during transit.' },
                { q: 'Can I become a seller on KKShop?', a: 'Yes! We welcome quality sellers. Go to the Seller Registration page to apply. Our team reviews applications and approved sellers can start listing products immediately.' },
            ],
        },
    ],
    ko: [
        {
            icon: ShoppingBag, title: '쇼핑 및 주문',
            items: [
                { q: 'KKShop은 어떤 상품을 판매하나요?', a: 'KKShop은 정품 한국 뷰티(K-Beauty) 제품을 전문으로 합니다 — 스킨케어, 메이크업, 마스크, 세럼 등. 가성비 좋은 한국 생활용품도 함께 제공합니다. 모든 제품은 100% 정품이며 한국에서 직접 소싱합니다.' },
                { q: '어떻게 주문하나요?', a: '상품을 둘러보고 장바구니에 담은 후 결제로 진행하세요. 배송지를 입력하고 쿠폰이나 포인트를 적용한 후 주문을 확인하세요. 주문 상세가 포함된 이메일 확인서를 받게 됩니다.' },
                { q: '주문을 수정하거나 취소할 수 있나요?', a: '"대기중" 상태에서는 마이페이지 → 주문에서 취소할 수 있습니다. "확인됨" 또는 "배송중" 상태로 변경되면 취소가 불가합니다. 고객지원팀에 문의해 주세요.' },
                { q: '주문을 어떻게 추적하나요?', a: '마이페이지 → 주문에서 주문을 클릭하면 전체 상태 타임라인을 확인할 수 있습니다. 배송이 시작되면 택배사, 운송장 번호, 실시간 추적 링크가 표시됩니다.' },
                { q: '품절된 상품은 어떻게 하나요?', a: '품절 상품은 명확히 표시됩니다. 찜 목록에 추가해두시면 재입고 시 확인하실 수 있습니다. 인기 상품은 자주 재입고되니 수시로 확인해 주세요.' },
            ],
        },
        {
            icon: Truck, title: '배송',
            items: [
                { q: '어디로 배송하나요?', a: '캄보디아 전 지역으로 배송합니다. 배송비는 지역별로 다르며 결제 시 표시됩니다. 프놈펜이 가장 빠른 배송을 제공합니다.' },
                { q: '배송 기간은 얼마나 걸리나요?', a: '프놈펜: 1~3 영업일. 기타 지역: 3~7 영업일. 공휴일이나 성수기에는 다소 지연될 수 있습니다.' },
                { q: '무료 배송이 있나요?', a: '네! $30 이상 프놈펜 주문은 무료 배송입니다. 정기적으로 무료 배송 프로모션을 진행합니다. 홈페이지 배너에서 현재 이벤트를 확인하세요.' },
                { q: '주문 후 배송지를 변경할 수 있나요?', a: '"대기중" 상태에서만 주소 변경이 가능합니다. 변경이 필요하시면 즉시 고객지원팀에 연락해 주세요.' },
            ],
        },
        {
            icon: CreditCard, title: '결제',
            items: [
                { q: '어떤 결제 수단을 지원하나요?', a: '현재 착불(COD)을 지원합니다. KHQR 은행 QR 결제(ABA, ACLEDA, Wing, TrueMoney, Pi Pay 지원)가 곧 출시될 예정입니다.' },
                { q: 'KKShop에서 쇼핑하는 것이 안전한가요?', a: '물론입니다. HTTPS 암호화, 보안 인증을 사용하며 민감한 결제 데이터를 저장하지 않습니다.' },
                { q: 'USD 외 다른 통화로 결제할 수 있나요?', a: '모든 가격은 캄보디아에서 널리 사용되는 USD로 표시됩니다. 향후 크메르 리엘(KHR) 표시를 추가할 예정입니다.' },
            ],
        },
        {
            icon: RefreshCw, title: '반품 및 교환',
            items: [
                { q: '반품 정책은 어떻게 되나요?', a: '파손, 불량, 또는 잘못된 상품을 받으신 경우 배송 후 7일 이내에 연락해 주세요. 교환 또는 전액 환불을 처리해 드립니다. 화장품 및 스킨케어 제품은 위생상 개봉 후 반품이 불가합니다.' },
                { q: '반품을 어떻게 요청하나요?', a: '마이페이지 → 주문 → 배송 완료된 주문 클릭 → "반품/환불 요청" 버튼을 누르세요. 사유를 작성하면 1~2 영업일 내에 검토됩니다.' },
                { q: '환불은 얼마나 걸리나요?', a: '승인 후 3~5 영업일 내에 처리됩니다. 주문 시 사용한 포인트는 즉시 복원됩니다.' },
            ],
        },
        {
            icon: UserCircle, title: '계정 및 프로필',
            items: [
                { q: '어떻게 회원가입하나요?', a: '"회원가입"을 클릭하고 이름, 이메일, 비밀번호를 입력하세요. Google 계정으로도 빠르게 가입할 수 있습니다. 가입 후 이메일 인증을 완료해야 계정이 활성화됩니다.' },
                { q: '비밀번호를 잊었어요.', a: '로그인 페이지에서 "비밀번호 찾기"를 클릭하고 등록된 이메일을 입력하세요. 몇 분 이내에 비밀번호 재설정 링크를 받게 됩니다. 링크는 1시간 동안 유효합니다.' },
                { q: '여러 배송지를 저장할 수 있나요?', a: '네! 마이페이지 → 주소에서 여러 배송지를 관리할 수 있습니다. 기본 배송지를 설정하고 결제 시 빠르게 전환할 수 있습니다.' },
                { q: '언어를 어떻게 변경하나요?', a: '상단 네비게이션 바의 언어 선택기를 사용하세요. 영어, 한국어, 크메르어, 중국어를 지원합니다. 설정은 자동으로 저장됩니다.' },
            ],
        },
        {
            icon: Gift, title: '포인트 및 리워드',
            items: [
                { q: '포인트 시스템은 어떻게 작동하나요?', a: '구매할 때마다 포인트를 적립합니다 — $100 구매 시 1,000포인트($1 가치)를 적립합니다. 포인트는 다음 주문 시 할인으로 사용할 수 있습니다. 1,000포인트 = $1 할인.' },
                { q: '포인트를 어떻게 더 모을 수 있나요?', a: '구매 외에도 상품 리뷰 작성(500P), 친구 추천(가입 시 1,000P), 특별 프로모션으로 적립할 수 있습니다. 마이페이지에서 현재 잔액을 확인하세요.' },
                { q: '포인트는 만료되나요?', a: '포인트는 적립 후 365일 후에 만료됩니다. 만료 전에 사용하여 최대한 활용하세요.' },
                { q: '사용할 수 있는 포인트에 제한이 있나요?', a: '주문 총액의 최대 50%까지 포인트를 사용할 수 있습니다.' },
            ],
        },
        {
            icon: ShieldCheck, title: '정품 보증 및 품질',
            items: [
                { q: '화장품은 모두 한국 정품 100%인가요?', a: '네, 예외 없이 100%입니다. KKShop의 모든 화장품·뷰티 제품은 한국에서 직접 소싱한 정품입니다. 가짜나 복제품은 절대 허용하지 않습니다. 만약 가짜 또는 복제품을 발견하셨다면 즉시 신고해 주세요 — 크게 보상해 드립니다.' },
                { q: '생활용품은 어느 나라 제품인가요?', a: '생활용품은 제조 국가가 기준이 아닙니다 — 품질이 기준입니다. 까다롭기로 세계적으로 유명한 한국 소비자들이 직접 선택하고 검증한 제품만 제공합니다. KKShop의 모든 생활용품은 그 높은 기준을 통과한 제품입니다.' },
                { q: '상품은 어떻게 보관되나요?', a: '모든 상품은 온도가 관리되는 환경에서 보관되며 주의를 기울여 배송됩니다. 스킨케어 제품은 운송 중 파손을 방지하기 위해 보호재로 포장됩니다.' },
                { q: 'KKShop에서 판매자가 될 수 있나요?', a: '네! 우수한 판매자를 환영합니다. 셀러 등록 페이지에서 신청하세요. 검토 후 승인된 판매자는 즉시 상품 등록을 시작할 수 있습니다.' },
            ],
        },
    ],
    km: [
        {
            icon: ShoppingBag, title: 'ការទិញទំនិញ និងការបញ្ជាទិញ',
            items: [
                { q: 'តើ KKShop លក់ផលិតផលអ្វីខ្លះ?', a: 'KKShop ឯកទេសក្នុងផលិតផលសម្រស់កូរ៉េពិត (K-Beauty) — ថែរក្សាស្បែក មេកអាប់ ម៉ាស់ សេរ៉ូម និងផ្សេងៗ។ យើងក៏ផ្តល់ផលិតផលជីវិតរស់នៅកូរ៉េដែលមានគុណភាពខ្ពស់។ រាល់ផលិតផលគឺពិតប្រាកដ ១០០% ពីកូរ៉េ។' },
                { q: 'តើខ្ញុំបញ្ជាទិញដោយរបៀបណា?', a: 'រកមើលផលិតផល បន្ថែមទៅកន្រ្តក ហើយបន្តទៅការទូទាត់។ បំពេញអាសយដ្ឋានដឹកជញ្ជូន អនុវត្តប័ណ្ណ ឬពិន្ទុ ហើយបញ្ជាក់ការបញ្ជាទិញ។' },
                { q: 'តើខ្ញុំអាចលុបចោលការបញ្ជាទិញបានទេ?', a: 'អ្នកអាចលុបចោលការបញ្ជាទិញខណៈពេលស្ថិតក្នុងស្ថានភាព "កំពុងរង់ចាំ" ពីទំព័រ ការបញ្ជាទិញរបស់ខ្ញុំ។' },
                { q: 'តើខ្ញុំតាមដានការបញ្ជាទិញដោយរបៀបណា?', a: 'ចូលទៅ ទំព័ររបស់ខ្ញុំ → ការបញ្ជាទិញ ហើយចុចលើការបញ្ជាទិញណាមួយដើម្បីមើលពេលវេលា។ ពេលបានដឹកជញ្ជូន អ្នកនឹងឃើញលេខតាមដាន។' },
            ],
        },
        {
            icon: Truck, title: 'ការដឹកជញ្ជូន',
            items: [
                { q: 'តើអ្នកដឹកជញ្ជូនទៅកន្លែងណា?', a: 'យើងដឹកជញ្ជូនទៅគ្រប់ខេត្តនៃប្រទេសកម្ពុជា។ ថ្លៃដឹកជញ្ជូនខុសគ្នាតាមខេត្ត។ រាជធានីភ្នំពេញមានការដឹកជញ្ជូនលឿនបំផុត។' },
                { q: 'ការដឹកជញ្ជូនចំណាយពេលប៉ុន្មាន?', a: 'រាជធានីភ្នំពេញ: ១-៣ ថ្ងៃធ្វើការ។ ខេត្តផ្សេង: ៣-៧ ថ្ងៃធ្វើការ។' },
                { q: 'តើមានដឹកជញ្ជូនឥតគិតថ្លៃទេ?', a: 'បាទ! ការបញ្ជាទិញលើស $30 ទៅភ្នំពេញមានដឹកជញ្ជូនឥតគិតថ្លៃ។' },
            ],
        },
        {
            icon: CreditCard, title: 'ការទូទាត់',
            items: [
                { q: 'តើវិធីទូទាត់អ្វីខ្លះដែលទទួលយក?', a: 'បច្ចុប្បន្នយើងគាំទ្រការទូទាត់នៅពេលដឹកជញ្ជូន (COD)។ ការទូទាត់តាម KHQR (ABA, ACLEDA, Wing, TrueMoney, Pi Pay) នឹងមកដល់ឆាប់ៗ។' },
                { q: 'តើវាមានសុវត្ថិភាពក្នុងការទិញទំនិញនៅ KKShop ទេ?', a: 'ពិតជាមានសុវត្ថិភាព។ យើងប្រើការអ៊ិនគ្រីប HTTPS និងមិនរក្សាទុកទិន្នន័យទូទាត់រសើប។' },
            ],
        },
        {
            icon: RefreshCw, title: 'ការត្រឡប់មកវិញ',
            items: [
                { q: 'តើគោលការណ៍ត្រឡប់មកវិញរបស់អ្នកជាអ្វី?', a: 'ប្រសិនបើអ្នកទទួលបានផលិតផលខូចខាត មានកំហុស ឬមិនត្រឹមត្រូវ សូមទាក់ទងយើងក្នុងរយៈពេល ៧ ថ្ងៃ។ ផលិតផលគ្រឿងសម្អាងមិនអាចត្រឡប់បានបន្ទាប់ពីបើកប្រើ។' },
                { q: 'តើខ្ញុំស្នើសុំការត្រឡប់មកវិញដោយរបៀបណា?', a: 'ចូលទៅ ទំព័ររបស់ខ្ញុំ → ការបញ្ជាទិញ → ចុចលើការបញ្ជាទិញ → ប៊ូតុង "ស្នើសុំត្រឡប់/សងប្រាក់វិញ"។' },
            ],
        },
        {
            icon: UserCircle, title: 'គណនី',
            items: [
                { q: 'តើខ្ញុំបង្កើតគណនីដោយរបៀបណា?', a: 'ចុច "ចុះឈ្មោះ" ហើយបំពេញព័ត៌មាន។ អ្នកអាចចុះឈ្មោះដោយប្រើគណនី Google។ បន្ទាប់ពីចុះឈ្មោះ សូមផ្ទៀងផ្ទាត់អ៊ីមែល។' },
                { q: 'ខ្ញុំភ្លេចពាក្យសម្ងាត់។', a: 'ចុច "ភ្លេចពាក្យសម្ងាត់" នៅទំព័រចូល ហើយបញ្ចូលអ៊ីមែល។ អ្នកនឹងទទួលបានតំណភ្ជាប់កំណត់ឡើងវិញ។' },
                { q: 'តើខ្ញុំអាចផ្លាស់ប្តូរភាសាដោយរបៀបណា?', a: 'ប្រើឧបករណ៍ជ្រើសរើសភាសានៅរបារកំពូល។ យើងគាំទ្រ English, 한국어, ខ្មែរ, 中文។' },
            ],
        },
        {
            icon: Gift, title: 'ពិន្ទុ និងរង្វាន់',
            items: [
                { q: 'តើប្រព័ន្ធពិន្ទុដំណើរការយ៉ាងដូចម្តេច?', a: 'រកពិន្ទុរាល់ការទិញ — $100 ទទួលបាន 1,000 ពិន្ទុ ($1)។ ពិន្ទុអាចប្រើជាការបញ្ចុះតម្លៃ។ 1,000 ពិន្ទុ = $1។' },
                { q: 'តើពិន្ទុផុតកំណត់ទេ?', a: 'ពិន្ទុផុតកំណត់ក្នុង ៣៦៥ ថ្ងៃបន្ទាប់ពីទទួលបាន។' },
            ],
        },
        {
            icon: ShieldCheck, title: 'ភាពពិតប្រាកដ និងគុណភាព',
            items: [
                { q: 'តើផលិតផលគ្រឿងសម្អាងទាំងអស់ជាផលិតផលកូរ៉េពិតប្រាកដ ១០០% ទេ?', a: 'បាទ ១០០% គ្មានករណីលើកលែង។ ផលិតផលសម្រស់ និង K-Beauty ទាំងអស់នៅ KKShop មកត្រង់ពីប្រទេសកូរ៉េ។ យើងមិនអត់ឱនចំពោះផលិតផលក្លែងក្លាយឡើយ។ ប្រសិនបើអ្នករកឃើញផលិតផលក្លែងក្លាយ ឬចម្លង សូមរាយការណ៍ដល់យើងភ្លាមៗ — យើងនឹងផ្តល់សំណងយ៉ាងច្រើន។' },
                { q: 'ចុះផលិតផលប្រើប្រាស់ប្រចាំថ្ងៃវិញ?', a: 'សម្រាប់ផលិតផលប្រើប្រាស់ប្រចាំថ្ងៃ ប្រទេសផលិតមិនមែនជាកត្តាកំណត់ទេ — គុណភាពទើបជាគោលការណ៍។ យើងផ្តល់តែផលិតផលដែលត្រូវបានជ្រើសរើស និងទុកចិត្តដោយអ្នកប្រើប្រាស់កូរ៉េ ដែលល្បីថាមានស្ដង់ដារខ្ពស់ណាស់ក្នុងការជ្រើសរើសផលិតផល។' },
                { q: 'តើខ្ញុំអាចក្លាយជាអ្នកលក់នៅ KKShop បានទេ?', a: 'បាទ! ចូលទៅទំព័រចុះឈ្មោះអ្នកលក់ដើម្បីដាក់ពាក្យ។ ក្រោយពីត្រូវបានអនុម័ត អ្នកលក់អាចចាប់ផ្តើមបញ្ចូលផលិតផលបានភ្លាម។' },
            ],
        },
    ],
    zh: [
        {
            icon: ShoppingBag, title: '购物与订单',
            items: [
                { q: 'KKShop卖什么产品？', a: 'KKShop专注于正品韩国美妆(K-Beauty)产品——护肤品、化妆品、面膜、精华液等。我们还提供精选的高性价比韩国生活用品。所有产品100%正品，直接从韩国采购。' },
                { q: '如何下单？', a: '浏览产品，加入购物车，然后结账。填写收货地址（可保存多个地址），使用优惠券或积分，确认订单。您将收到包含订单详情的确认邮件。' },
                { q: '可以取消订单吗？', a: '在"待处理"状态下可以从我的页面→订单中取消。一旦变为"已确认"或"配送中"状态，则无法取消。' },
                { q: '如何追踪订单？', a: '进入我的页面→订单，点击任何订单查看完整状态。发货后将显示快递公司、运单号和实时追踪链接。' },
            ],
        },
        {
            icon: Truck, title: '配送',
            items: [
                { q: '配送范围是哪里？', a: '我们配送至柬埔寨全国各省。运费因省份而异，在结账时显示。金边通常配送最快。' },
                { q: '配送需要多长时间？', a: '金边：1-3个工作日。其他省份：3-7个工作日。' },
                { q: '有免运费吗？', a: '是的！金边订单满$30免运费。我们还定期推出免运费活动。' },
            ],
        },
        {
            icon: CreditCard, title: '支付',
            items: [
                { q: '接受哪些付款方式？', a: '目前支持货到付款(COD)。KHQR银行二维码支付（支持ABA、ACLEDA、Wing、TrueMoney、Pi Pay）即将上线。' },
                { q: '在KKShop购物安全吗？', a: '绝对安全。我们使用HTTPS加密、安全认证，不存储敏感支付数据。' },
            ],
        },
        {
            icon: RefreshCw, title: '退换货',
            items: [
                { q: '退货政策是什么？', a: '如收到损坏、有缺陷或错误的产品，请在收货后7天内联系我们。我们将安排换货或全额退款。化妆品和护肤品开封后因卫生原因不能退货。' },
                { q: '如何申请退货？', a: '进入我的页面→订单→点击已送达的订单→"申请退货/退款"按钮。描述问题后，我们将在1-2个工作日内审核。' },
                { q: '退款需要多长时间？', a: '审批后3-5个工作日内处理。订单中使用的积分将立即恢复。' },
            ],
        },
        {
            icon: UserCircle, title: '账户',
            items: [
                { q: '如何创建账户？', a: '点击"注册"并输入姓名、邮箱和密码。也可以用Google账户快速注册。注册后需验证邮箱以激活账户。' },
                { q: '忘记密码怎么办？', a: '在登录页点击"忘记密码"并输入注册邮箱。几分钟内会收到密码重置链接，链接有效期1小时。' },
                { q: '如何更改语言？', a: '使用顶部导航栏的语言选择器。支持English、한국어、ខ្មែរ、中文。' },
            ],
        },
        {
            icon: Gift, title: '积分与奖励',
            items: [
                { q: '积分系统如何运作？', a: '每次购物都能赚取积分——消费$100可获得1,000积分（价值$1）。积分可用于抵扣未来订单。1,000积分 = $1折扣。' },
                { q: '还有哪些方式赚取积分？', a: '除购物外：写产品评价（500P）、推荐朋友（每人注册1,000P）、特别活动。在我的页面查看余额。' },
                { q: '积分会过期吗？', a: '积分在获得后365天过期。' },
                { q: '使用积分有限制吗？', a: '积分最多可抵扣订单总额的50%。' },
            ],
        },
        {
            icon: ShieldCheck, title: '正品保证与品质',
            items: [
                { q: '所有化妆品都是100%正品韩国产品吗？', a: '是的，毫无例外，100%正品。KKShop上的所有化妆品及K-Beauty产品均直接从韩国采购，绝对保证正品。我们对假冒或仿制品零容忍。如果您发现任何假冒或仿制产品，请立即向我们举报——我们将给予丰厚赔偿。' },
                { q: '生活用品呢？产地重要吗？', a: '生活用品的评判标准不是产地，而是品质。我们只提供经过以严苛著称的韩国消费者亲选并信赖的产品。韩国消费者的高标准举世公认，KKShop上的每一款生活用品都经过了这一严格检验。' },
                { q: '产品如何存储和处理？', a: '所有产品在温控环境中存储，精心包装发货。护肤品采用防护材料包装，防止运输途中损坏。' },
                { q: '可以在KKShop成为卖家吗？', a: '可以！我们欢迎优质卖家。前往卖家注册页面申请。审核通过后即可立即开始上架商品。' },
            ],
        },
    ],
};

/* ──────────────────── Component ──────────────────── */
function AccordionItem({ item, isOpen, toggle }: { item: FaqItem; isOpen: boolean; toggle: () => void }) {
    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button onClick={toggle} className="w-full flex items-center justify-between py-4 px-1 text-left group">
                <span className={`text-sm font-semibold pr-4 transition-colors ${isOpen ? 'text-brand-primary' : 'text-gray-800 group-hover:text-brand-primary'}`}>{item.q}</span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-primary' : ''}`} />
            </button>
            {isOpen && (
                <div className="pb-4 px-1">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
            )}
        </div>
    );
}

const pageTitle: Record<string, { title: string; subtitle: string }> = {
    en: { title: 'Frequently Asked Questions', subtitle: 'Find answers to common questions about KKShop' },
    ko: { title: '자주 묻는 질문', subtitle: 'KKShop에 대해 자주 묻는 질문들' },
    km: { title: 'សំណួរដែលសួរញឹកញាប់', subtitle: 'ស្វែងរកចម្លើយចំពោះសំណួរទូទៅ' },
    zh: { title: '常见问题', subtitle: '查找关于KKShop的常见问题解答' },
};

const contactCta: Record<string, { text: string; btn: string }> = {
    en: { text: "Can't find what you're looking for?", btn: 'Contact Us' },
    ko: { text: '찾으시는 답변이 없으신가요?', btn: '문의하기' },
    km: { text: 'រកមិនឃើញអ្វីដែលអ្នកកំពុងស្វែងរកទេ?', btn: 'ទាក់ទងយើង' },
    zh: { text: '没找到您需要的答案？', btn: '联系我们' },
};

export default function FaqPage() {
    const store = useSafeAppStore();
    const lang = store?.language || 'en';
    const categories = faqData[lang] || faqData.en;
    const title = pageTitle[lang] || pageTitle.en;
    const cta = contactCta[lang] || contactCta.en;
    const [openKey, setOpenKey] = useState<string | null>(null);

    const toggle = (key: string) => setOpenKey(prev => (prev === key ? null : key));

    return (
        <main className="min-h-screen bg-gray-50 pb-24 pt-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <HelpCircle className="w-12 h-12 text-brand-primary mx-auto mb-3" />
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{title.title}</h1>
                    <p className="text-sm text-gray-500">{title.subtitle}</p>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                    {categories.map((cat, ci) => {
                        const Icon = cat.icon;
                        return (
                            <div key={ci} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                                    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">{cat.title}</h2>
                                </div>
                                <div className="px-5">
                                    {cat.items.map((item, qi) => {
                                        const key = `${ci}-${qi}`;
                                        return <AccordionItem key={key} item={item} isOpen={openKey === key} toggle={() => toggle(key)} />;
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Contact CTA */}
                <div className="mt-10 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <p className="text-gray-600 font-medium mb-4">{cta.text}</p>
                    <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-colors">
                        {cta.btn}
                    </a>
                </div>
            </div>
            <Footer />
        </main>
    );
}
