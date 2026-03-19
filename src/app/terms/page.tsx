'use client';
import { useState, useEffect } from 'react';

type Lang = 'ko' | 'en' | 'km' | 'zh';

const content: Record<Lang, { title: string; lastUpdated: string; sections: Array<{ heading: string; body: string[] }> }> = {
  ko: {
    title: '이용약관',
    lastUpdated: '최종 업데이트: 2026년 3월 19일',
    sections: [
      {
        heading: '제1조 (목적 및 수락)',
        body: [
          'KKShop(kkshop.cc, 이하 "서비스")의 이용 조건과 절차, 회사와 이용자의 권리 및 의무를 규정함을 목적으로 합니다.',
          '귀하가 본 사이트를 이용하거나 주문을 완료하는 것은 본 약관의 모든 내용에 동의함을 의미하며, 이는 캄보디아 전자상거래법(Law on Electronic Commerce)에 의거하여 서면 계약과 동일한 법적 효력을 갖습니다.',
        ],
      },
      {
        heading: '제2조 (관할권 및 준거법)',
        body: [
          '준거법: 본 약관의 해석 및 서비스와 관련하여 발생하는 모든 사항은 캄보디아 왕국 법령(Laws of the Kingdom of Cambodia)의 적용을 받습니다.',
          '관할 법원: 서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁에 대해서는 캄보디아 내 관할 법원을 전속 관할로 하여 해결합니다.',
        ],
      },
      {
        heading: '제3조 (상품 정보 및 주문의 효력)',
        body: [
          '당사는 상품의 정확한 묘사를 위해 최선을 다하나, 모니터 해상도나 현지 공급 상황에 따른 미세한 차이는 발생할 수 있습니다.',
          '모든 주문은 당사의 최종 승인(Acceptance)이 있어야만 계약이 성립된 것으로 간주하며, 재고 부족이나 시스템 오류 등의 사유가 있을 경우 당사는 언제든지 주문을 취소하거나 거부할 권리를 보유합니다.',
        ],
      },
      {
        heading: '제4조 (책임의 제한)',
        body: [
          '서비스 중단: 시스템 점검, 통신 장애, 천재지변 등으로 인한 서비스 중단에 대해 당사는 어떠한 보상 책임도 지지 않습니다.',
          '배송 관련: 배송 업체(Grab, Lalamove 등 제3자)의 과실로 인한 지연, 파손, 분실에 대해 당사는 직접적인 책임을 지지 않으며, 고객의 수령 대행 업무를 지원하는 범위 내에서만 협조합니다.',
          '간접 손실 면책: 당사는 서비스 이용과 관련하여 발생한 특별 손해, 징벌적 손해, 이익 상실 등 어떠한 간접적 손실에 대해서도 책임을 지지 않습니다.',
        ],
      },
      {
        heading: '제5조 (이용자의 의무 및 계정 관리)',
        body: [
          '귀하는 본인의 계정 정보와 비밀번호를 관리할 책임이 있으며, 이를 제3자에게 노출하여 발생한 모든 유무형의 손해는 귀하의 책임입니다.',
          '부정한 방법으로 서비스를 이용하거나 시스템에 위해를 가하는 행위 적발 시, 당사는 사전 통지 없이 즉시 계정을 정지하고 법적 조치를 취할 수 있습니다.',
        ],
      },
      {
        heading: '제6조 (약관의 개정)',
        body: [
          '당사는 경영 환경 변화나 법률 개정에 따라 본 약관을 수시로 변경할 권리가 있습니다.',
          '변경된 약관은 웹사이트에 게시되는 즉시 효력이 발생하며, 게시 후 서비스를 계속 이용하는 것은 변경된 내용에 동의한 것으로 간주합니다.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: March 19, 2026',
    sections: [
      {
        heading: 'Article 1: Purpose and Acceptance',
        body: [
          'These Terms of Service govern the conditions and procedures for using the website and related services provided by KKShop (kkshop.cc, hereinafter "the Service"), and set forth the rights and obligations of KKShop and its users.',
          'By accessing this website or completing a purchase, you agree to be bound by all provisions of these Terms. Pursuant to the Cambodian Law on Electronic Commerce, such agreement carries the same legal force as a written contract.',
        ],
      },
      {
        heading: 'Article 2: Governing Law and Jurisdiction',
        body: [
          'Governing Law: All matters related to the interpretation of these Terms and the use of the Service shall be governed by the Laws of the Kingdom of Cambodia.',
          'Jurisdiction: Any dispute arising between KKShop and a user in connection with the use of the Service shall be resolved exclusively before the competent courts within Cambodia.',
        ],
      },
      {
        heading: 'Article 3: Product Information and Validity of Orders',
        body: [
          'KKShop endeavors to provide accurate product descriptions; however, minor discrepancies may occur due to monitor resolution or variations in local supply conditions.',
          'All orders are deemed contractually binding only upon KKShop\'s final acceptance. KKShop reserves the right to cancel or refuse any order at any time in the event of insufficient stock, system errors, or other valid reasons.',
        ],
      },
      {
        heading: 'Article 4: Limitation of Liability',
        body: [
          'Service Interruption: KKShop shall not be liable for any compensation in connection with service interruptions caused by system maintenance, communication failures, natural disasters, or other force majeure events.',
          'Delivery: KKShop shall not be directly liable for delays, damage, or loss caused by the fault of third-party delivery providers (such as Grab and Lalamove), and shall only cooperate within the scope of facilitating customer receipt.',
          'Indirect Losses: KKShop shall not be liable for any indirect losses arising from the use of the Service, including but not limited to special damages, punitive damages, and loss of profits.',
        ],
      },
      {
        heading: 'Article 5: User Obligations and Account Management',
        body: [
          'You are responsible for maintaining the confidentiality of your account credentials and password. You shall bear full responsibility for any and all losses, tangible or intangible, resulting from the unauthorized disclosure of your credentials to third parties.',
          'If you are found to be using the Service through fraudulent means or engaging in activities that harm our systems, KKShop reserves the right to immediately suspend your account and take legal action without prior notice.',
        ],
      },
      {
        heading: 'Article 6: Amendments to Terms',
        body: [
          'KKShop reserves the right to modify these Terms at any time in response to changes in the business environment or applicable laws and regulations.',
          'Amended Terms shall take effect immediately upon publication on the website. Your continued use of the Service following such publication shall constitute your acceptance of the amended Terms.',
        ],
      },
    ],
  },
  km: {
    title: 'លក្ខខណ្ឌនៃការប្រើប្រាស់',
    lastUpdated: 'ថ្ងៃចុងក្រោយធ្វើបច្ចុប្បន្នភាព៖ ថ្ងៃទី ១៩ ខែមីនា ឆ្នាំ ២០២៦',
    sections: [
      {
        heading: 'មាត្រា ១៖ គោលបំណង និងការទទួលយក',
        body: [
          'លក្ខខណ្ឌទាំងនេះគ្រប់គ្រងលក្ខខណ្ឌ និងនីតិវិធីក្នុងការប្រើប្រាស់គេហទំព័រ និងសេវាកម្មដែលផ្តល់ដោយ KKShop (kkshop.cc ហៅថា "សេវាកម្ម") ហើយកំណត់សិទ្ធិ និងកាតព្វកិច្ចរបស់ KKShop និងអ្នកប្រើប្រាស់។',
          'តាមរយៈការចូលប្រើប្រាស់គេហទំព័រនេះ ឬការបំពេញការទិញ អ្នកយល់ព្រមចងភ្ជាប់ដោយបទប្បញ្ញត្តិទាំងអស់នៃលក្ខខណ្ឌទាំងនេះ។ ស្របតាមច្បាប់ស្តីពីពាណិជ្ជកម្មអេឡិចត្រូនិករបស់កម្ពុជា ការយល់ព្រមបែបនេះមានអំណាចច្បាប់ដូចជាកិច្ចសន្យាជាលាយលក្ខណ៍អក្សរ។',
        ],
      },
      {
        heading: 'មាត្រា ២៖ ច្បាប់គ្រប់គ្រង និងយុត្តាធិការ',
        body: [
          'ច្បាប់គ្រប់គ្រង៖ រាល់បញ្ហាទាក់ទងនឹងការបកស្រាយលក្ខខណ្ឌទាំងនេះ និងការប្រើប្រាស់សេវាកម្ម នឹងត្រូវគ្រប់គ្រងដោយច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។',
          'យុត្តាធិការ៖ ជម្លោះណាមួយដែលកើតឡើងរវាង KKShop និងអ្នកប្រើប្រាស់ទាក់ទងនឹងការប្រើប្រាស់សេវាកម្ម នឹងត្រូវដោះស្រាយតាមការយុត្តាធិការតុលាការស្ថាបនភ្ជាប់ក្នុងប្រទេសកម្ពុជា។',
        ],
      },
      {
        heading: 'មាត្រា ៣៖ ព័ត៌មានផលិតផល និងភាពត្រឹមត្រូវនៃការបញ្ជាទិញ',
        body: [
          'KKShop ខិតខំផ្តល់ការពិពណ៌នាផលិតផលដែលត្រឹមត្រូវ ទោះជាយ៉ាងណាក៏ដោយ អាចមានភាពខុសគ្នាតិចតួចដោយសារការប្រែប្រួលនៃស្ថានភាពការផ្គត់ផ្គង់ក្នុងស្រុក ឬការប្រែប្រួលនៃវិច្ឆការ។',
          'ការបញ្ជាទិញទាំងអស់ត្រូវបានចាត់ទុកថាជាកិច្ចសន្យាតែប្រសិនបើ KKShop ផ្តល់ការទទួលស្គាល់ចុងក្រោយ។ KKShop រក្សាសិទ្ធិក្នុងការលុបចោល ឬបដិសេធការបញ្ជាទិញណាមួយ នៅពេលណាមួយ ក្នុងករណីស្តុកខ្វះ កំហុសប្រព័ន្ធ ឬហេតុផលត្រឹមត្រូវផ្សេងទៀត។',
        ],
      },
      {
        heading: 'មាត្រា ៤៖ ដែនកំណត់នៃការទទួលខុសត្រូវ',
        body: [
          'ការរំខានសេវាកម្ម៖ KKShop នឹងមិនទទួលខុសត្រូវចំពោះការសំណងណាមួយ ទាក់ទងនឹងការរំខានសេវាកម្មដែលបណ្តាលមកពីការថែទាំប្រព័ន្ធ ការខូចខាតទំនាក់ទំនង គ្រោះធម្មជាតិ ឬហេតុការណ៍បង្ខំផ្សេងទៀតឡើយ។',
          'ការដឹកជញ្ជូន៖ KKShop នឹងមិនទទួលខុសត្រូវដោយផ្ទាល់ចំពោះការពន្យារ ការខូចខាត ឬការបាត់បង់ ដែលបណ្តាលមកពីកំហុសរបស់ភាគីផ្តល់សេវាដឹកជញ្ជូនភាគីទីបី (ដូចជា Grab និង Lalamove) ហើយនឹងសហការតែក្នុងវិសាលភាពនៃការជួយសម្រួលការទទួលដោយអតិថិជន។',
          'ការខាតបង់ដោយប្រយោល៖ KKShop នឹងមិនទទួលខុសត្រូវចំពោះការខាតបង់ដោយប្រយោលណាមួយ ដែលកើតចេញពីការប្រើប្រាស់សេវាកម្ម រួមមាន ការខូចខាតពិសេស ការខូចខាតផ្តន្ទាទោស និងការបាត់បង់ប្រាក់ចំណេញ។',
        ],
      },
      {
        heading: 'មាត្រា ៥៖ កាតព្វកិច្ចអ្នកប្រើប្រាស់ និងការគ្រប់គ្រងគណនី',
        body: [
          'អ្នកទទួលខុសត្រូវក្នុងការរក្សាការសម្ងាត់នៃព័ត៌មានចូលប្រើ និងពាក្យសម្ងាត់របស់អ្នក។ អ្នកនឹងទទួលខុសត្រូវចំពោះការខាតបង់ទាំងអស់ ជាក់ស្តែង ឬមិនជាក់ស្តែង ដែលកើតចេញពីការបង្ហាញព័ត៌មានរបស់អ្នកដោយគ្មានការអនុញ្ញាតដល់ភាគីទីបី។',
          'ប្រសិនបើអ្នកត្រូវបានរកឃើញថាប្រើប្រាស់សេវាកម្មដោយមធ្យោបាយបោកប្រាស់ ឬចូលរួមក្នុងសកម្មភាពដែលបំផ្លាញប្រព័ន្ធ KKShop KKShop រក្សាសិទ្ធិក្នុងការផ្អាកគណនីរបស់អ្នកភ្លាមៗ និងចាត់វិធានការច្បាប់ដោយគ្មានការជូនដំណឹងជាមុន។',
        ],
      },
      {
        heading: 'មាត្រា ៦៖ ការកែប្រែលក្ខខណ្ឌ',
        body: [
          'KKShop រក្សាសិទ្ធិក្នុងការកែប្រែលក្ខខណ្ឌទាំងនេះនៅពេលណាមួយ ដើម្បីឆ្លើយតបនឹងការផ្លាស់ប្តូរបរិស្ថានអាជីវកម្ម ឬច្បាប់ និងបទប្បញ្ញត្តិដែលអាចអនុវត្តបាន។',
          'លក្ខខណ្ឌដែលបានកែប្រែនឹងចូលជាធរមានភ្លាមៗ នៅពេលបោះផ្សាយនៅលើគេហទំព័រ។ ការប្រើប្រាស់សេវាកម្មជាបន្តបន្ទាប់របស់អ្នក ក្រោយការបោះផ្សាយ នឹងចាត់ទុកជាការយល់ព្រមរបស់អ្នកលើលក្ខខណ្ឌដែលបានកែប្រែ។',
        ],
      },
    ],
  },
  zh: {
    title: '服务条款',
    lastUpdated: '最后更新：2026年3月19日',
    sections: [
      {
        heading: '第一条：目的与接受',
        body: [
          '本服务条款规定了使用KKShop（kkshop.cc，以下简称"服务"）网站及相关服务的条件与程序，并明确KKShop与用户之间的权利与义务。',
          '访问本网站或完成购买即表示您同意受本条款所有条款的约束。依据柬埔寨《电子商务法》，此类同意具有与书面合同相同的法律效力。',
        ],
      },
      {
        heading: '第二条：适用法律与管辖权',
        body: [
          '适用法律：与本条款的解释及服务使用相关的所有事项，均受柬埔寨王国法律管辖。',
          '管辖权：KKShop与用户之间因服务使用而产生的任何争议，应提交柬埔寨境内具有管辖权的法院专属管辖解决。',
        ],
      },
      {
        heading: '第三条：商品信息与订单效力',
        body: [
          'KKShop致力于提供准确的商品描述；然而，受显示器分辨率或本地供应情况变动影响，可能存在细微差异。',
          '所有订单仅在KKShop最终确认接受后，方构成具有约束力的合同。对于因库存不足、系统错误或其他正当理由，KKShop保留随时取消或拒绝任何订单的权利。',
        ],
      },
      {
        heading: '第四条：责任限制',
        body: [
          '服务中断：对于因系统维护、通信故障、自然灾害或其他不可抗力事件导致的服务中断，KKShop不承担任何赔偿责任。',
          '配送相关：对于第三方配送服务商（如Grab、Lalamove等）过失造成的延误、损坏或丢失，KKShop不承担直接责任，仅在协助客户收货的范围内予以配合。',
          '间接损失免责：对于因使用本服务而引起的任何间接损失，包括但不限于特殊损害、惩罚性损害赔偿及利润损失，KKShop概不负责。',
        ],
      },
      {
        heading: '第五条：用户义务与账户管理',
        body: [
          '您有责任维护账户信息及密码的保密性。因您将账户信息未经授权泄露给第三方所导致的一切有形或无形损失，均由您承担全部责任。',
          '如发现您以欺诈方式使用本服务或从事危害本系统的行为，KKShop保留在不事先通知的情况下立即暂停您的账户并采取法律行动的权利。',
        ],
      },
      {
        heading: '第六条：条款修订',
        body: [
          'KKShop保留根据业务环境变化或适用法律法规调整，随时修改本条款的权利。',
          '修订后的条款将在网站发布后立即生效。您在发布后继续使用本服务，即视为您接受修订后的条款。',
        ],
      },
    ],
  },
};

export default function TermsPage() {
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
