'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

type Lang = 'ko' | 'en' | 'km' | 'zh';

const content: Record<Lang, { title: string; lastUpdated: string; sections: Array<{ heading: string; body: string[] }> }> = {
  ko: {
    title: '배송 정보 안내',
    lastUpdated: '최종 업데이트: 2026년 3월 19일',
    sections: [
      {
        heading: '',
        body: [
          'KKShop(kkshop.cc) 서비스를 이용해 주셔서 감사합니다. 고객님의 소중한 상품이 안전하게 도착할 수 있도록 캄보디아 현지 환경에 최적화된 배송 서비스를 제공하고 있습니다. 아래 내용을 반드시 확인해 주시기 바랍니다.',
        ],
      },
      {
        heading: '1. 실시간 배송 상황 이메일 안내',
        body: [
          '주문 완료: 결제가 승인되면 시스템에서 즉시 주문 확인 메일을 발송합니다.',
          '배송 추적 정보: 상품이 출고되는 즉시 고객님의 등록된 이메일로 상세 배송 정보와 운송장 번호를 보내드립니다. 이메일을 통해 실시간으로 배송 현황을 확인하실 수 있습니다.',
        ],
      },
      {
        heading: '2. 배송 옵션 및 소요 시간',
        body: [
          '일반 배송 (Standard Delivery)',
          '- 프놈펜 시내: 1~2 영업일 이내 배송',
          '- 지방 도시: 2~5 영업일 이내 배송 (전문 택배사 이용)',
          'VIP 퀵 서비스 (VIP Express Delivery — 프놈펜 전용)',
          '더 빠른 수령을 원하시는 프놈펜 고객님을 위해 Grab, Lalamove 등을 활용한 즉시 배송 서비스를 제공합니다.',
          '이 옵션 선택 시 일반 배송비 외에 추가 비용이 발생하며, 결제 단계에서 실시간 거리 및 시간에 따른 할증료가 합산됩니다.',
        ],
      },
      {
        heading: '3. 정확한 연락처 및 주소 기재 안내 (필독)',
        body: [
          '캄보디아는 주소 체계가 복잡하여 배송 기사가 위치 확인을 위해 전화를 드리는 경우가 매우 많습니다.',
          '반드시 수신 가능한 현지 연락처(Phone Number)를 정확히 입력해 주세요.',
          '고객님과의 연락 두절로 인해 배송이 실패하거나 상품이 반송될 경우, 재배송에 따른 모든 추가 비용은 고객님께서 부담하시게 됨을 유의해 주시기 바랍니다.',
        ],
      },
      {
        heading: '4. 배송 지연에 관한 면책 조항',
        body: [
          '캄보디아 특유의 도로 정체, 우천으로 인한 침수 상황, 국가 공휴일 등 예기치 못한 현지 사정으로 인해 배송이 지연될 수 있습니다.',
          '위와 같은 불가항력적인 사유로 인한 지연에 대해서는 당사가 법적 책임을 지지 않습니다. 다만, 모든 주문은 최대한 신속하고 안전하게 전달될 수 있도록 관리팀에서 상시 모니터링하고 있습니다.',
        ],
      },
    ],
  },
  en: {
    title: 'Delivery Information',
    lastUpdated: 'Last Updated: March 19, 2026',
    sections: [
      {
        heading: '',
        body: [
          'Thank you for shopping with KKShop (kkshop.cc). We provide delivery services optimized for the local conditions of Cambodia to ensure your valuable purchases arrive safely. Please read the following information carefully.',
        ],
      },
      {
        heading: '1. Real-Time Delivery Updates by Email',
        body: [
          'Order Confirmation: Once your payment is approved, an order confirmation email will be sent to you immediately by our system.',
          'Tracking Information: As soon as your order is dispatched, detailed shipping information and a tracking number will be sent to your registered email address. You can monitor your delivery status in real time via email.',
        ],
      },
      {
        heading: '2. Delivery Options and Estimated Timeframes',
        body: [
          'Standard Delivery',
          '- Phnom Penh City: Delivered within 1–2 business days',
          '- Provincial Cities: Delivered within 2–5 business days (via professional courier services)',
          'VIP Express Delivery (Phnom Penh Only)',
          'For customers in Phnom Penh who require faster delivery, we offer an on-demand express service utilizing platforms such as Grab and Lalamove.',
          'Selecting this option incurs additional charges beyond the standard delivery fee. A real-time surcharge based on distance and estimated travel time will be calculated and added at the checkout stage.',
        ],
      },
      {
        heading: '3. Providing Accurate Contact Information and Address (Important)',
        body: [
          'Due to the complexity of the address system in Cambodia, our delivery personnel frequently need to contact customers by phone to confirm their location.',
          'Please ensure that you provide a reachable local phone number when placing your order.',
          'Please be advised that if delivery fails or your parcel is returned due to an inability to contact you, all additional costs for re-delivery will be borne by the customer.',
        ],
      },
      {
        heading: '4. Disclaimer for Delivery Delays',
        body: [
          'Delivery may be delayed due to unforeseen local circumstances unique to Cambodia, including but not limited to road congestion, flooding caused by heavy rain, and national public holidays.',
          'KKShop shall not be held legally liable for delays caused by such force majeure events. However, our operations team continuously monitors all orders to ensure each delivery is completed as promptly and safely as possible.',
        ],
      },
    ],
  },
  km: {
    title: 'ព័ត៌មានអំពីការដឹកជញ្ជូន',
    lastUpdated: 'ថ្ងៃចុងក្រោយធ្វើបច្ចុប្បន្នភាព៖ ថ្ងៃទី ១៩ ខែមីនា ឆ្នាំ ២០២៦',
    sections: [
      {
        heading: '',
        body: [
          'អរគុណសម្រាប់ការជ្រើសរើសសេវាកម្ម KKShop (kkshop.cc)។ យើងផ្តល់សេវាដឹកជញ្ជូនដែលបានបង្កើនប្រសិទ្ធភាពសម្រាប់លក្ខខណ្ឌក្នុងស្រុករបស់កម្ពុជា ដើម្បីធានាថាការទិញរបស់អ្នកមកដល់ដោយសុវត្ថិភាព។ សូមអានព័ត៌មានខាងក្រោមដោយប្រុងប្រយ័ត្ន។',
        ],
      },
      {
        heading: '១. ការធ្វើបច្ចុប្បន្នភាពការដឹកជញ្ជូនតាមពេលវេលាជាក់ស្តែងតាមអ៊ីមែល',
        body: [
          'ការបញ្ជាក់ការបញ្ជាទិញ៖ នៅពេលការទូទាត់របស់អ្នកត្រូវបានអនុម័ត អ៊ីមែលបញ្ជាក់ការបញ្ជាទិញនឹងត្រូវផ្ញើទៅអ្នកភ្លាមៗ។',
          'ព័ត៌មានតាមដាន៖ ភ្លាមៗនៅពេលការបញ្ជាទិញរបស់អ្នកត្រូវបានផ្ញើ ព័ត៌មានលម្អិតអំពីការដឹកជញ្ជូន និងលេខតាមដាននឹងត្រូវផ្ញើទៅអាសយដ្ឋានអ៊ីមែលដែលអ្នកបានចុះឈ្មោះ។ អ្នកអាចតាមដានស្ថានភាពការដឹកជញ្ជូនរបស់អ្នកតាមពេលវេលាជាក់ស្តែង។',
        ],
      },
      {
        heading: '២. ជម្រើសដឹកជញ្ជូន និងរយៈពេលប៉ាន់ស្មាន',
        body: [
          'ការដឹកជញ្ជូនស្តង់ដារ',
          '- ក្នុងក្រុងភ្នំពេញ៖ ដឹកជញ្ជូនក្នុងរយៈពេល ១–២ ថ្ងៃធ្វើការ',
          '- ក្រុងខេត្ត៖ ដឹកជញ្ជូនក្នុងរយៈពេល ២–៥ ថ្ងៃធ្វើការ (តាមរយៈសេវាដឹកជញ្ជូនដែលមានជំនាញ)',
          'សេវាដឹកជញ្ជូនបន្ទាន់ VIP (តែសម្រាប់ភ្នំពេញ)',
          'សម្រាប់អតិថិជននៅភ្នំពេញដែលត្រូវការការដឹកជញ្ជូនលឿនជាងនេះ យើងផ្តល់សេវាដឹកជញ្ជូនតាមតម្រូវការ ដោយប្រើប្រាស់វេទិកាដូចជា Grab និង Lalamove។',
          'ការជ្រើសរើសជម្រើសនេះនឹងមានការចំណាយបន្ថែមលើសថ្លៃដឹកជញ្ជូនស្តង់ដារ។ ការបន្ថែមតម្លៃតាមពេលវេលាជាក់ស្តែង ដោយគិតតាមចម្ងាយ និងពេលវេលាធ្វើដំណើរ នឹងត្រូវបានគណនានៅដំណាក់កាលបង់ប្រាក់។',
        ],
      },
      {
        heading: '៣. ការផ្តល់ព័ត៌មានទំនាក់ទំនង និងអាសយដ្ឋានត្រឹមត្រូវ (សំខាន់)',
        body: [
          'ដោយសារភាពស្មុគស្មាញនៃប្រព័ន្ធអាសយដ្ឋាននៅកម្ពុជា បុគ្គលិកដឹកជញ្ជូនរបស់យើងច្រើនតែត្រូវទាក់ទងអតិថិជនតាមទូរស័ព្ទ ដើម្បីបញ្ជាក់ទីតាំង។',
          'សូមធានាថាអ្នកបានផ្តល់លេខទូរស័ព្ទក្នុងស្រុកដែលអាចទំនាក់ទំនងបាន នៅពេលដាក់ការបញ្ជាទិញ។',
          'សូមទราបថា ប្រសិនបើការដឹកជញ្ជូនបរាជ័យ ឬកញ្ចប់ត្រូវបានប្រគល់ត្រឡប់មកវិញ ដោយសារការមិនអាចទំនាក់ទំនងជាមួយអ្នក ការចំណាយបន្ថែមទាំងអស់សម្រាប់ការដឹកជញ្ជូនឡើងវិញ នឹងជាការទទួលខុសត្រូវរបស់អតិថិជន។',
        ],
      },
      {
        heading: '៤. បទបញ្ញាត្តិអំពីការពន្យារការដឹកជញ្ជូន',
        body: [
          'ការដឹកជញ្ជូនអាចត្រូវពន្យារដោយសារកាលៈទេសៈក្នុងស្រុកដែលមិនអាចទស្សន៍ទាយបាន ជាប់ទាក់ទងទៅនឹងកម្ពុជា ដូចជា ការស្ទះចរាចរណ៍ ការជន់លិចដោយសារភ្លៀងធ្លាក់ខ្លាំង និងថ្ងៃឈប់សម្រាករជាតិ។',
          'KKShop នឹងមិនទទួលខុសត្រូវតាមច្បាប់ចំពោះការពន្យារដែលបណ្តាលមកពីហេតុការណ៍បង្ខំទាំងនោះឡើយ។ ទោះបីជាយ៉ាងនេះក្តី ក្រុមប្រតិបត្តិការរបស់យើងតាមដានការបញ្ជាទិញទាំងអស់ ដើម្បីធានាថាការដឹកជញ្ជូននីមួយៗត្រូវបានបំពេញដោយរហ័ស និងសុវត្ថិភាពតាមដែលអាចធ្វើទៅបាន។',
        ],
      },
    ],
  },
  zh: {
    title: '配送信息说明',
    lastUpdated: '最后更新：2026年3月19日',
    sections: [
      {
        heading: '',
        body: [
          '感谢您选择KKShop（kkshop.cc）。我们提供针对柬埔寨本地情况优化的配送服务，确保您的宝贵购物安全送达。请仔细阅读以下信息。',
        ],
      },
      {
        heading: '一、实时配送邮件通知',
        body: [
          '订单确认：付款获批后，系统将立即向您发送订单确认邮件。',
          '物流追踪信息：订单发货后，详细物流信息及运单号将立即发送至您注册的电子邮箱，您可通过邮件实时跟踪配送状态。',
        ],
      },
      {
        heading: '二、配送方式及预计时效',
        body: [
          '标准配送（Standard Delivery）',
          '- 金边市内：1–2个工作日内送达',
          '- 省级城市：2–5个工作日内送达（通过专业快递公司）',
          'VIP特快配送（VIP Express Delivery — 仅限金边）',
          '为需要更快收货的金边客户，我们提供按需即时配送服务，借助Grab、Lalamove等平台完成配送。',
          '选择此选项将在标准配送费之外产生额外费用，结算时将根据实时距离和预计时间计算附加费并一并显示。',
        ],
      },
      {
        heading: '三、填写准确的联系方式和地址（重要）',
        body: [
          '由于柬埔寨地址体系较为复杂，配送员经常需要致电客户以确认位置。',
          '下单时请务必提供可正常接听的当地电话号码。',
          '请注意，若因无法联系到您导致配送失败或包裹被退回，所有重新配送的额外费用将由客户承担。',
        ],
      },
      {
        heading: '四、配送延误免责声明',
        body: [
          '受柬埔寨特有的交通拥堵、暴雨引发的内涝及国家法定节假日等不可预见的本地情况影响，配送可能出现延误。',
          'KKShop对上述不可抗力原因造成的延误不承担法律责任。但我们的运营团队会持续监控所有订单，确保每笔配送尽快、安全地完成。',
        ],
      },
    ],
  },
};

export default function ShippingPage() {
  const { language, setLanguage } = useAppStore();
  const [lang, setLang] = useState<Lang>('en');

  // GNB 언어 변경 시 실시간 동기화
  useEffect(() => {
    if (['ko', 'en', 'km', 'zh'].includes(language)) {
      setLang(language as Lang);
    }
  }, [language]);
  const c = content[lang];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Language tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['ko', 'en', 'km', 'zh'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setLanguage(l); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                lang === l
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {l === 'ko'
                ? '🇰🇷 한국어'
                : l === 'en'
                ? '🇺🇸 English'
                : l === 'km'
                ? '🇰🇭 ខ្មែរ'
                : '🇨🇳 中文'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{c.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{c.lastUpdated}</p>

          {c.sections.map((section, i) => (
            <div key={i} className="mb-6">
              {section.heading && (
                <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                  {section.heading}
                </h2>
              )}
              {section.body.map((para, j) => (
                <p key={j} className="text-sm text-gray-600 leading-relaxed mb-2">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-blue-600 hover:underline">
            ← Back to KKShop
          </a>
        </div>
      </div>
    </div>
  );
}
