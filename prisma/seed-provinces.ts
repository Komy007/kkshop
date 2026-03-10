import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const provinces = [
  { nameEn: 'Phnom Penh',       nameKo: '프놈펜',       nameKm: 'ភ្នំពេញ',       nameZh: '金边',     shippingFee: 2.00, sortOrder: 1 },
  { nameEn: 'Kandal',           nameKo: '칸달',         nameKm: 'កណ្ដាល',         nameZh: '干丹',     shippingFee: 3.00, sortOrder: 2 },
  { nameEn: 'Siem Reap',        nameKo: '시엠립',       nameKm: 'សៀមរាប',         nameZh: '暹粒',     shippingFee: 4.00, sortOrder: 3 },
  { nameEn: 'Battambang',       nameKo: '바탐방',       nameKm: 'បាត់ដំបង',       nameZh: '马德望',   shippingFee: 5.00, sortOrder: 4 },
  { nameEn: 'Kampong Cham',     nameKo: '캄퐁참',       nameKm: 'កំពង់ចាម',       nameZh: '磅湛',     shippingFee: 4.00, sortOrder: 5 },
  { nameEn: 'Kampong Chhnang',  nameKo: '캄퐁치낭',     nameKm: 'កំពង់ឆ្នាំង',   nameZh: '磅清扬',   shippingFee: 4.00, sortOrder: 6 },
  { nameEn: 'Kampong Speu',     nameKo: '캄퐁스퍼',     nameKm: 'កំពង់ស្ពឺ',     nameZh: '磅士卑',   shippingFee: 3.50, sortOrder: 7 },
  { nameEn: 'Kampong Thom',     nameKo: '캄퐁톰',       nameKm: 'កំពង់ធំ',       nameZh: '磅同',     shippingFee: 4.50, sortOrder: 8 },
  { nameEn: 'Kampot',           nameKo: '캄포트',       nameKm: 'កំពត',           nameZh: '贡布',     shippingFee: 4.50, sortOrder: 9 },
  { nameEn: 'Kep',              nameKo: '켑',           nameKm: 'កែប',            nameZh: '戈公',     shippingFee: 5.00, sortOrder: 10 },
  { nameEn: 'Koh Kong',         nameKo: '코콩',         nameKm: 'កោះកុង',         nameZh: '哥公',     shippingFee: 6.00, sortOrder: 11 },
  { nameEn: 'Kratie',           nameKo: '크라체',       nameKm: 'ក្រចេះ',         nameZh: '桔井',     shippingFee: 5.00, sortOrder: 12 },
  { nameEn: 'Mondulkiri',       nameKo: '몬돌키리',     nameKm: 'មណ្ឌលគីរី',     nameZh: '蒙多基里', shippingFee: 7.00, sortOrder: 13 },
  { nameEn: 'Oddar Meanchey',   nameKo: '오달민체이',   nameKm: 'ឧត្តរមានជ័យ',   nameZh: '上丁',     shippingFee: 7.00, sortOrder: 14 },
  { nameEn: 'Pailin',           nameKo: '파일린',       nameKm: 'ប៉ៃលិន',         nameZh: '拜林',     shippingFee: 6.00, sortOrder: 15 },
  { nameEn: 'Preah Sihanouk',   nameKo: '시아누크빌',   nameKm: 'ព្រះសីហនុ',      nameZh: '西哈努克', shippingFee: 5.00, sortOrder: 16 },
  { nameEn: 'Preah Vihear',     nameKo: '프리아비히어', nameKm: 'ព្រះវិហារ',      nameZh: '柏威夏',   shippingFee: 7.00, sortOrder: 17 },
  { nameEn: 'Prey Veng',        nameKo: '프레이벵',     nameKm: 'ព្រៃវែង',        nameZh: '磅逊',     shippingFee: 4.00, sortOrder: 18 },
  { nameEn: 'Pursat',           nameKo: '포르사트',     nameKm: 'ពោធិ៍សាត់',      nameZh: '菩萨',     shippingFee: 5.00, sortOrder: 19 },
  { nameEn: 'Ratanakiri',       nameKo: '라타나키리',   nameKm: 'រតនគីរី',        nameZh: '腊塔纳基里',shippingFee: 8.00, sortOrder: 20 },
  { nameEn: 'Stung Treng',      nameKo: '스퉁트렝',     nameKm: 'ស្ទឹងត្រែង',     nameZh: '上丁',     shippingFee: 7.50, sortOrder: 21 },
  { nameEn: 'Svay Rieng',       nameKo: '스와이리엥',   nameKm: 'ស្វាយរៀង',       nameZh: '柴桢',     shippingFee: 4.50, sortOrder: 22 },
  { nameEn: 'Takeo',            nameKo: '타케오',       nameKm: 'តាកែវ',          nameZh: '茶胶',     shippingFee: 3.50, sortOrder: 23 },
  { nameEn: 'Tboung Khmum',     nameKo: '뜨보응크뭄',   nameKm: 'ត្បូងឃ្មុំ',     nameZh: '特本克蒙', shippingFee: 4.00, sortOrder: 24 },
  { nameEn: 'Banteay Meanchey', nameKo: '반테이민체이', nameKm: 'បន្ទាយមានជ័យ',  nameZh: '班迭棉吉', shippingFee: 6.00, sortOrder: 25 },
]

async function main() {
  console.log('Seeding Cambodia provinces...')
  for (const province of provinces) {
    await prisma.shippingProvince.upsert({
      where: { id: province.sortOrder },
      update: { ...province },
      create: { id: province.sortOrder, ...province },
    })
  }
  console.log(`✅ Seeded ${provinces.length} provinces.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
