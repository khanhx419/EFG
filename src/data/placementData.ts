import { PlacementQuestion } from '../types/vocab';

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // A1
  {
    id: 'pq_1',
    level: 'A1',
    question: 'She ___ breakfast at seven o\'clock every morning.',
    options: ['eats', 'eat', 'eating', 'is eat'],
    correctIndex: 0,
    explanation: 'Với chủ ngữ ngôi thứ ba số ít "She" ở thì hiện tại đơn, động từ thêm đuôi -s ("eats").',
    type: 'cloze'
  },
  {
    id: 'pq_2',
    level: 'A1',
    question: 'Which word is the opposite of "expensive"?',
    options: ['cheap', 'heavy', 'fast', 'dark'],
    correctIndex: 0,
    explanation: '"Cheap" (rẻ) là từ trái nghĩa của "expensive" (đắt đỏ).',
    type: 'vocab'
  },

  // A2
  {
    id: 'pq_3',
    level: 'A2',
    question: 'We had to cancel the picnic ___ it was raining heavily.',
    options: ['because', 'although', 'unless', 'so that'],
    correctIndex: 0,
    explanation: '"Because" (bởi vì) chỉ nguyên nhân hủy chuyến dã ngoại do trời mưa to.',
    type: 'cloze'
  },
  {
    id: 'pq_4',
    level: 'A2',
    question: 'Choose the word that means "delicious food":',
    options: ['tasty', 'bitter', 'shallow', 'dull'],
    correctIndex: 0,
    explanation: '"Tasty" đồng nghĩa với "delicious" (ngon miệng, đậm đà).',
    type: 'vocab'
  },

  // B1
  {
    id: 'pq_5',
    level: 'B1',
    question: 'Good team members need to ___ with each other clearly to avoid errors.',
    options: ['communicate', 'hesitate', 'investigate', 'terminate'],
    correctIndex: 0,
    explanation: '"Communicate" (giao tiếp) phù hợp nhất với ngữ cảnh làm việc nhóm.',
    type: 'vocab'
  },
  {
    id: 'pq_6',
    level: 'B1',
    question: 'If you want to improve your fluency, you should take every ___ to speak English.',
    options: ['opportunity', 'accident', 'danger', 'punishment'],
    correctIndex: 0,
    explanation: 'Cụm "take every opportunity" nghĩa là tận dụng mọi cơ hội để nói tiếng Anh.',
    type: 'collocation'
  },

  // B2
  {
    id: 'pq_7',
    level: 'B2',
    question: 'With rapid technological shifts, major disruptions in the labor market are ___.',
    options: ['inevitable', 'trivial', 'obsolete', 'reluctant'],
    correctIndex: 0,
    explanation: '"Inevitable" nghĩa là không thể tránh khỏi, tất yếu sẽ xảy ra.',
    type: 'vocab'
  },
  {
    id: 'pq_8',
    level: 'B2',
    question: 'The two research labs decided to ___ on developing a sustainable battery.',
    options: ['collaborate', 'confiscate', 'contradict', 'disintegrate'],
    correctIndex: 0,
    explanation: '"Collaborate on" mang nghĩa hợp tác cùng nhau thực hiện dự án.',
    type: 'collocation'
  },

  // C1
  {
    id: 'pq_9',
    level: 'C1',
    question: 'In modern cities, digital payment systems have become virtually ___.',
    options: ['ubiquitous', 'provisional', 'archaic', 'negligible'],
    correctIndex: 0,
    explanation: '"Ubiquitous" chỉ sự hiện diện phổ biến ở mọi nơi trong xã hội số.',
    type: 'vocab'
  },
  {
    id: 'pq_10',
    level: 'C1',
    question: 'The minister unveiled targeted grants to ___ the acute economic pressure on households.',
    options: ['alleviate', 'exacerbate', 'obfuscate', 'galvanize'],
    correctIndex: 0,
    explanation: '"Alleviate" nghĩa là xoa dịu, giảm nhẹ áp lực/gánh nặng.',
    type: 'vocab'
  },

  // C2
  {
    id: 'pq_11',
    level: 'C2',
    question: 'Her ___ critique unraveled subtle design flaws that experienced engineers had missed.',
    options: ['perspicacious', 'myopic', 'indolent', 'gullible'],
    correctIndex: 0,
    explanation: '"Perspicacious" miêu tả khả năng nhìn nhận thấu suốt, sáng suốt sắc bén bậc thầy.',
    type: 'vocab'
  },
  {
    id: 'pq_12',
    level: 'C2',
    question: 'Throughout the heated boardroom standoff, the CEO conducted negotiations with admirable ___.',
    options: ['equanimity', 'trepidation', 'belligerence', 'indifference'],
    correctIndex: 0,
    explanation: '"Equanimity" là sự điềm tĩnh phi thường, sự thản nhiên vững vàng trước áp lực lớn.',
    type: 'vocab'
  }
];
