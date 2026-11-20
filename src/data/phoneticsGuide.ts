export interface IPASound {
  symbol: string;
  example: string;
  ipaExample: string;
  meaning_vi: string;
}

export interface IPACategory {
  title: string;
  description: string;
  sounds: IPASound[];
}

export interface StressRule {
  title: string;
  rule: string;
  formula: string;
  examples: { word: string; stress: string; meaning: string }[];
  exception?: string;
}

export const IPA_GUIDE: IPACategory[] = [
  {
    title: 'Nguyên âm ngắn (Short Vowels)',
    description: 'Âm phát ra dứt khoát, gọn gàng, không kéo dài',
    sounds: [
      { symbol: '/ɪ/', example: 'sit', ipaExample: '/sɪt/', meaning_vi: 'ngồi' },
      { symbol: '/e/', example: 'bed', ipaExample: '/bed/', meaning_vi: 'giường ngủ' },
      { symbol: '/æ/', example: 'cat', ipaExample: '/kæt/', meaning_vi: 'con mèo' },
      { symbol: '/ɒ/', example: 'hot', ipaExample: '/hɒt/', meaning_vi: 'nóng' },
      { symbol: '/ʊ/', example: 'put', ipaExample: '/pʊt/', meaning_vi: 'đặt, để' },
      { symbol: '/ʌ/', example: 'cup', ipaExample: '/kʌp/', meaning_vi: 'chiếc cốc' },
      { symbol: '/ə/', example: 'about', ipaExample: '/əˈbaʊt/', meaning_vi: 'về, khoảng (âm Schwa)' }
    ]
  },
  {
    title: 'Nguyên âm dài (Long Vowels)',
    description: 'Có dấu hai chấm (:) biểu thị ngân dài và căng cơ miệng',
    sounds: [
      { symbol: '/iː/', example: 'sheep', ipaExample: '/ʃiːp/', meaning_vi: 'con cừu' },
      { symbol: '/ɑː/', example: 'father', ipaExample: '/ˈfɑː.ðər/', meaning_vi: 'người cha' },
      { symbol: '/ɔː/', example: 'door', ipaExample: '/dɔːr/', meaning_vi: 'cửa ra vào' },
      { symbol: '/uː/', example: 'blue', ipaExample: '/bluː/', meaning_vi: 'màu xanh lam' },
      { symbol: '/ɜː/', example: 'bird', ipaExample: '/bɜːd/', meaning_vi: 'con chim' }
    ]
  },
  {
    title: 'Nguyên âm đôi (Diphthongs)',
    description: 'Trượt mượt mà từ âm nguyên âm thứ nhất sang âm thứ hai',
    sounds: [
      { symbol: '/eɪ/', example: 'day', ipaExample: '/deɪ/', meaning_vi: 'ngày' },
      { symbol: '/aɪ/', example: 'eye', ipaExample: '/aɪ/', meaning_vi: 'mắt' },
      { symbol: '/ɔɪ/', example: 'boy', ipaExample: '/bɔɪ/', meaning_vi: 'cậu bé' },
      { symbol: '/aʊ/', example: 'now', ipaExample: '/naʊ/', meaning_vi: 'bây giờ' },
      { symbol: '/əʊ/', example: 'go', ipaExample: '/ɡəʊ/', meaning_vi: 'đi' },
      { symbol: '/ɪə/', example: 'near', ipaExample: '/nɪər/', meaning_vi: 'gần' },
      { symbol: '/eə/', example: 'hair', ipaExample: '/heər/', meaning_vi: 'mái tóc' },
      { symbol: '/ʊə/', example: 'tour', ipaExample: '/tʊər/', meaning_vi: 'chuyến du lịch' }
    ]
  },
  {
    title: 'Phụ âm hữu thanh & vô thanh (Consonants)',
    description: 'Các cặp âm quan trọng cần chú ý độ rung thanh quản và ending sounds',
    sounds: [
      { symbol: '/p/ vs /b/', example: 'pen / bag', ipaExample: '/pen/ - /bæɡ/', meaning_vi: 'bật hơi / rung môi' },
      { symbol: '/t/ vs /d/', example: 'time / door', ipaExample: '/taɪm/ - /dɔːr/', meaning_vi: 'đầu lưỡi chạm nướu' },
      { symbol: '/k/ vs /ɡ/', example: 'key / get', ipaExample: '/kiː/ - /ɡet/', meaning_vi: 'bật cuống họng' },
      { symbol: '/f/ vs /v/', example: 'fast / very', ipaExample: '/fɑːst/ - /ˈver.i/', meaning_vi: 'răng trên chạm môi dưới' },
      { symbol: '/θ/ vs /ð/', example: 'think / this', ipaExample: '/θɪŋk/ - /ðɪs/', meaning_vi: 'âm lưỡi đặt giữa 2 hàm răng' },
      { symbol: '/s/ vs /z/', example: 'sun / zoo', ipaExample: '/sʌn/ - /zuː/', meaning_vi: 'gió không rung / rung xì' },
      { symbol: '/ʃ/ vs /ʒ/', example: 'she / vision', ipaExample: '/ʃiː/ - /ˈvɪʒ.ən/', meaning_vi: 'chu môi thổi hơi / rung' }
    ]
  }
];

export const STRESS_RULES: StressRule[] = [
  {
    title: 'Quy tắc từ 2 âm tiết (Danh/Tính vs. Động từ)',
    rule: 'Đa phần Danh từ & Tính từ 2 âm tiết nhấn âm 1. Động từ 2 âm tiết nhấn âm 2.',
    formula: 'Noun/Adj: 1ST syllable | Verb: 2ND syllable',
    examples: [
      { word: 'record (n)', stress: 'RE-cord (/ˈrek.ɔːd/)', meaning: 'bản ghi âm' },
      { word: 'record (v)', stress: 're-CORD (/rɪˈkɔːd/)', meaning: 'ghi lại, thu âm' },
      { word: 'present (n/adj)', stress: 'PRE-sent (/ˈprez.ənt/)', meaning: 'món quà / hiện diện' },
      { word: 'present (v)', stress: 'pre-SENT (/prɪˈzent/)', meaning: 'thuyết trình, trao tặng' },
      { word: 'happy (adj)', stress: 'HAP-py (/ˈhæp.i/)', meaning: 'hạnh phúc' }
    ],
    exception: 'Ngoại lệ: machine (/məˈʃiːn/ - n âm 2), answer (/ˈɑːn.sər/ - v âm 1).'
  },
  {
    title: 'Hậu tố kéo trọng âm về âm tiết ngay trước nó',
    rule: 'Các từ kết thúc bằng: -tion, -sion, -ic, -ical, -ity, -ian, -ial, -graphy luôn nhấn vào âm tiết NGAY TRƯỚC đuôi đó.',
    formula: 'Word + [-tion / -ic / -ity] -> Stress = PENULTIMATE (ngay trước đuôi)',
    examples: [
      { word: 'communication', stress: 'com-mu-ni-CA-tion', meaning: 'sự giao tiếp' },
      { word: 'decision', stress: 'de-CI-sion', meaning: 'quyết định' },
      { word: 'economic', stress: 'e-co-NOM-ic', meaning: 'thuộc về kinh tế' },
      { word: 'serendipity', stress: 'ser-en-DIP-i-ty', meaning: 'cơ duyên may mắn' },
      { word: 'photographic', stress: 'pho-to-GRAPH-ic', meaning: 'thuộc nhiếp ảnh' }
    ]
  },
  {
    title: 'Hậu tố nhận trọng âm chính trực tiếp',
    rule: 'Các từ tận cùng bằng: -ee, -eer, -ese, -ique, -esque, -ette nhận trọng âm CHÍNH vào chính đuôi đó.',
    formula: 'Word + [-ee / -eer / -ese / -ique] -> Stress = ON THE SUFFIX',
    examples: [
      { word: 'engineer', stress: 'en-gi-NEER (/ˌen.dʒɪˈnɪər/)', meaning: 'kỹ sư' },
      { word: 'refugee', stress: 'ref-u-GEE (/ˌref.jʊˈdʒiː/)', meaning: 'người tị nạn' },
      { word: 'Vietnamese', stress: 'Viet-nam-ESE (/ˌvjet.nəˈmiːz/)', meaning: 'người/tiếng Việt Nam' },
      { word: 'unique', stress: 'u-NIQUE (/juːˈniːk/)', meaning: 'độc nhất vô nhị' }
    ]
  },
  {
    title: 'Quy tắc từ ghép (Compound Words)',
    rule: 'Danh từ ghép (Noun + Noun): nhấn âm 1. Tính từ ghép / Động từ ghép: thường nhấn thành phần thứ 2.',
    formula: 'Compound Noun: 1ST element | Compound Adj/Verb: 2ND element',
    examples: [
      { word: 'blackboard', stress: 'BLACK-board', meaning: 'bảng đen (danh từ ghép)' },
      { word: 'sunflower', stress: 'SUN-flow-er', meaning: 'hoa hướng dương' },
      { word: 'bad-tempered', stress: 'bad-TEM-pered', meaning: 'nóng tính (tính từ ghép)' },
      { word: 'understand', stress: 'un-der-STAND', meaning: 'hiểu (động từ ghép)' }
    ]
  }
];
