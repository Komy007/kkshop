'use client';
import { useState, useEffect } from 'react';

type Lang = 'ko' | 'en' | 'km' | 'zh';

const content: Record<Lang, { title: string; lastUpdated: string; sections: Array<{ heading: string; body: string[] }> }> = {
  ko: {
    title: '개인정보 처리방침',
    lastUpdated: '최종 업데이트: 2026년 3월 19일',
    sections: [
      {
        heading: '',
        body: [
          'KKShop(kkshop.cc)은 귀하의 개인정보를 소중히 여기며, 캄보디아 왕국의 법령을 준수하여 안전하게 관리하기 위해 최선을 다하고 있습니다. 본 방침은 귀하가 제공하는 정보가 어떻게 사용되는지 안내하며, 운영자의 책임 범위를 명확히 하기 위해 작성되었습니다.',
        ],
      },
      {
        heading: '1. 관련 법규 준수',
        body: [
          '본 서비스는 2019년 공표된 캄보디아 전자상거래법(Law on Electronic Commerce) 및 관련 시행령을 근거로 운영됩니다. 당사는 해당 법령이 제시하는 데이터 수집 및 보관 기준을 준수하며, 투명한 정보 처리를 원칙으로 합니다.',
        ],
      },
      {
        heading: '2. 수집하는 정보 및 이용 목적',
        body: [
          '수집 항목: 성함, 연락처, 배송지 주소, 이메일 주소 등 서비스 이용에 필수적인 최소한의 정보.',
          '이용 목적: 주문 확인, 상품 배송, 고객 상담 응대 및 서비스 품질 향상을 위한 기초 자료로만 활용됩니다.',
        ],
      },
      {
        heading: '3. 정보의 보호 및 안전 관리 (책임의 한계)',
        body: [
          '당사는 기술적, 관리적 보호 조치를 통해 귀하의 데이터를 안전하게 보호하기 위해 상업적으로 합리적인 최선의 노력을 다합니다.',
          '다만, 인터넷 환경의 특성상 완전무결한 보안을 보장하기는 어려우며, 당사의 고의 또는 중대한 과실이 없는 상태에서 발생하는 예기치 못한 제3자의 불법 해킹이나 통신망 장애로 인한 데이터 사고에 대해서는 법이 허용하는 범위 내에서 책임을 면합니다.',
        ],
      },
      {
        heading: '4. 제3자 제공 및 위탁',
        body: [
          '원활한 서비스 제공을 위해 결제 대행사(예: ABA Bank 등) 및 배송 업체(Grab, Lalamove 등)와 같이 필수적인 협력사에 한해 최소한의 정보를 공유합니다.',
          '이 외의 목적으로 귀하의 동의 없이 제3자에게 정보를 판매하거나 공유하지 않습니다.',
        ],
      },
      {
        heading: '5. 데이터 보관 기간 및 파기',
        body: [
          '귀하의 정보는 관련 법령에서 정한 보관 기간 또는 서비스 이용 목적이 달성될 때까지만 보유합니다.',
          '목적이 달성된 정보는 복구가 불가능한 안전한 방법으로 파기함을 원칙으로 합니다.',
        ],
      },
      {
        heading: '6. 이용자의 권리',
        body: [
          '귀하는 언제든지 본인의 개인정보를 조회하거나 수정, 삭제를 요청할 수 있습니다. 당사는 귀하의 요청이 접수되면 신속히 처리할 수 있도록 노력하겠습니다.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: March 19, 2026',
    sections: [
      {
        heading: '',
        body: [
          'KKShop (kkshop.cc) values your personal information and is committed to managing it securely in compliance with the laws of the Kingdom of Cambodia. This policy explains how the information you provide is used and clarifies the scope of our responsibilities as an operator.',
        ],
      },
      {
        heading: '1. Compliance with Applicable Law',
        body: [
          'This service operates in accordance with the Cambodian Law on Electronic Commerce promulgated in 2019 and its related implementing regulations. We adhere to the data collection and retention standards prescribed by applicable law and are committed to transparent data processing.',
        ],
      },
      {
        heading: '2. Information Collected and Purpose of Use',
        body: [
          'Information Collected: Minimum necessary information required to provide our service, including your name, contact number, delivery address, and email address.',
          'Purpose of Use: Information is used solely for order confirmation, product delivery, customer support, and improving service quality.',
        ],
      },
      {
        heading: '3. Data Protection and Security (Limitation of Liability)',
        body: [
          'KKShop employs commercially reasonable technical and administrative safeguards to protect your personal data.',
          'However, given the inherent nature of internet environments, absolute security cannot be guaranteed. To the extent permitted by law, KKShop shall not be liable for data incidents resulting from unauthorized third-party hacking or network failures that occur without our willful misconduct or gross negligence.',
        ],
      },
      {
        heading: '4. Sharing and Disclosure to Third Parties',
        body: [
          'We share the minimum necessary information only with essential service partners required to operate our services, such as payment processors (e.g., ABA Bank) and delivery providers (e.g., Grab, Lalamove).',
          'We do not sell or share your information with third parties for any other purpose without your consent.',
        ],
      },
      {
        heading: '5. Data Retention and Deletion',
        body: [
          'Your information will be retained only for the period prescribed by applicable law or until the purpose for which it was collected has been fulfilled.',
          'Upon fulfillment of the purpose, your information will be securely destroyed using methods that prevent recovery.',
        ],
      },
      {
        heading: '6. Your Rights',
        body: [
          'You may request to access, correct, or delete your personal information at any time. Upon receipt of your request, we will endeavor to process it promptly.',
        ],
      },
    ],
  },
  km: {
    title: 'គោលនយោបាយភាពឯកជន',
    lastUpdated: 'ថ្ងៃចុងក្រោយធ្វើបច្ចុប្បន្នភាព៖ ថ្ងៃទី ១៩ ខែមីនា ឆ្នាំ ២០២៦',
    sections: [
      {
        heading: '',
        body: [
          'KKShop (kkshop.cc) ឱ្យតម្លៃដល់ព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នក ហើយប្តេជ្ញាគ្រប់គ្រងព័ត៌មាននោះដោយសុវត្ថិភាព ស្របតាមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។ គោលនយោបាយនេះពន្យល់ពីរបៀបប្រើប្រាស់ព័ត៌មានដែលអ្នកផ្តល់ឱ្យ និងបញ្ជាក់ពីវិសាលភាពនៃការទទួលខុសត្រូវរបស់ KKShop ជាអ្នកប្រតិបត្តិ។',
        ],
      },
      {
        heading: '១. ការអនុលោមតាមច្បាប់ដែលអាចអនុវត្តបាន',
        body: [
          'សេវាកម្មនេះប្រតិបត្តិស្របតាមច្បាប់ស្តីពីពាណិជ្ជកម្មអេឡិចត្រូនិករបស់កម្ពុជា ដែលប្រកាសឱ្យប្រើក្នុងឆ្នាំ ២០១៩ និងបទប្បញ្ញត្តិអនុវត្តពាក់ព័ន្ធ។ យើងប្រកាន់ខ្ជាប់នូវស្តង់ដារនៃការប្រមូល និងការរក្សាទុកទិន្នន័យដែលច្បាប់ដែលអាចអនុវត្តបានចែងទុក ហើយប្តេជ្ញាចំពោះការដំណើរការទិន្នន័យដោយតម្លាភាព។',
        ],
      },
      {
        heading: '២. ព័ត៌មានដែលប្រមូល និងគោលបំណងប្រើប្រាស់',
        body: [
          'ព័ត៌មានដែលប្រមូល៖ ព័ត៌មានអប្បបរមាចាំបាច់ដើម្បីផ្តល់សេវាកម្ម រួមមាន ឈ្មោះ លេខទំនាក់ទំនង អាសយដ្ឋានដឹកជញ្ជូន និងអាសយដ្ឋានអ៊ីមែល។',
          'គោលបំណងប្រើប្រាស់៖ ព័ត៌មានត្រូវបានប្រើប្រាស់តែសម្រាប់ការបញ្ជាក់ការបញ្ជាទិញ ការដឹកជញ្ជូនទំនិញ ការគាំទ្រអតិថិជន និងការកែលម្អគុណភាពសេវាកម្ម។',
        ],
      },
      {
        heading: '៣. ការការពារទិន្នន័យ និងសុវត្ថិភាព (ដែនកំណត់នៃការទទួលខុសត្រូវ)',
        body: [
          'KKShop ប្រើប្រាស់វិធានការបច្ចេកទេស និងរដ្ឋបាលស្របតាមហេតុផលពាណិជ្ជកម្ម ដើម្បីការពារទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នក។',
          'ទោះជាយ៉ាងណាក៏ដោយ ដោយសារលក្ខណៈធម្មជាតិពិតប្រាកដនៃបរិយាកាសអ៊ីនធឺណិត យើងមិនអាចធានាសុវត្ថិភាពដាច់ខាតបានទេ។ ក្នុងករណីព្រឹត្តិការណ៍ទិន្នន័យដែលបណ្តាលមកពីការគ្រប់គ្រងខុសច្បាប់ ឬការខូចខាតបណ្តាញ ដែលកើតឡើងដោយគ្មានការប្រព្រឹត្តខុស ឬការធ្វេសប្រហែសធ្ងន់ធ្ងររបស់ KKShop យើងនឹងមិនទទួលខុសត្រូវតាមដែនកំណត់ដែលច្បាប់អនុញ្ញាតឡើយ។',
        ],
      },
      {
        heading: '៤. ការចែករំលែក និងការបង្ហាញដល់ភាគីទីបី',
        body: [
          'យើងចែករំលែកព័ត៌មានអប្បបរមាចាំបាច់ជាមួយដៃគូសេវាកម្មចាំបាច់ប៉ុណ្ណោះ ដូចជា អ្នកដំណើរការការទូទាត់ (ឧ. ABA Bank) និងអ្នកផ្តល់សេវាដឹកជញ្ជូន (ឧ. Grab, Lalamove)។',
          'យើងមិនលក់ ឬចែករំលែកព័ត៌មានរបស់អ្នកជាមួយភាគីទីបីសម្រាប់គោលបំណងណាផ្សេងទៀតដោយគ្មានការយល់ព្រមពីអ្នកឡើយ។',
        ],
      },
      {
        heading: '៥. ការរក្សាទុក និងការលុបចោលទិន្នន័យ',
        body: [
          'ព័ត៌មានរបស់អ្នកនឹងត្រូវរក្សាទុកតែក្នុងរយៈពេលដែលច្បាប់ដែលអាចអនុវត្តបានកំណត់ ឬរហូតដល់គោលបំណងប្រើប្រាស់ត្រូវបានសម្រេច។',
          'នៅពេលគោលបំណងត្រូវបានបំពេញ ព័ត៌មានរបស់អ្នកនឹងត្រូវបំផ្លាញដោយសុវត្ថិភាព ដោយប្រើប្រាស់វិធីសាស្ត្រដែលរារាំងការស្ដារឡើងវិញ។',
        ],
      },
      {
        heading: '៦. សិទ្ធិរបស់អ្នក',
        body: [
          'អ្នកអាចស្នើសុំចូលប្រើប្រាស់ កែប្រែ ឬលុបព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកបានគ្រប់ពេល។ នៅពេលទទួលបានសំណើរបស់អ្នក យើងនឹងព្យាយាមដំណើរការយ៉ាងរហ័ស។',
        ],
      },
    ],
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年3月19日',
    sections: [
      {
        heading: '',
        body: [
          'KKShop（kkshop.cc）重视您的个人信息，并致力于依据柬埔寨王国相关法律法规，安全、合规地管理您的个人数据。本政策旨在说明您所提供的信息将如何被使用，并明确本平台作为运营方的责任范围。',
        ],
      },
      {
        heading: '一、遵守适用法律',
        body: [
          '本服务依据2019年颁布的《柬埔寨电子商务法》（Law on Electronic Commerce）及相关实施条例运营。我们严格遵守适用法律规定的数据收集和保留标准，并致力于透明地处理个人信息。',
        ],
      },
      {
        heading: '二、收集的信息及使用目的',
        body: [
          '收集范围：提供服务所必需的最少量信息，包括姓名、联系电话、收货地址及电子邮件地址等。',
          '使用目的：所收集的信息仅用于订单确认、商品配送、客户服务支持及服务质量改善。',
        ],
      },
      {
        heading: '三、数据保护与安全（责任限制）',
        body: [
          'KKShop采取商业上合理的技术与管理保障措施，保护您的个人数据安全。',
          '然而，鉴于互联网环境的固有特性，无法保证绝对安全。对于在KKShop无故意不当行为或重大过失的情况下，因第三方非法入侵或网络故障导致的数据事故，我们将在法律允许的范围内免除相应责任。',
        ],
      },
      {
        heading: '四、向第三方的共享与披露',
        body: [
          '为提供正常服务，我们仅与必要的服务合作伙伴共享最少量信息，包括支付处理方（如ABA Bank）及物流配送方（如Grab、Lalamove）。',
          '未经您的同意，我们不会为任何其他目的向第三方出售或共享您的信息。',
        ],
      },
      {
        heading: '五、数据保留与删除',
        body: [
          '您的信息将仅保留至适用法律规定的期限届满或收集目的实现为止。',
          '目的实现后，您的信息将采用防止恢复的安全方式予以销毁。',
        ],
      },
      {
        heading: '六、您的权利',
        body: [
          '您可随时请求查阅、更正或删除您的个人信息。收到您的请求后，我们将尽力及时处理。',
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kkshop-lang');
      if (raw) {
        const l = JSON.parse(raw)?.state?.language;
        if (['ko', 'en', 'km', 'zh'].includes(l)) setLang(l as Lang);
      }
    } catch {}
  }, []);
  const c = content[lang];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Language tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['ko', 'en', 'km', 'zh'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
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
