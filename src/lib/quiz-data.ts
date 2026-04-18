export interface QuizQuestion {
  number: number
  text: string
  options: { label: string; value: string }[]
  correctAnswer: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    number: 1,
    text: "What's Diccon's worst habit around the house?",
    options: [
      { label: 'A', value: 'Leaves everything everywhere' },
      { label: 'B', value: 'Clips his toenails on the sofa' },
      { label: 'C', value: '"Reorganises" things so no one can find them' },
      { label: 'D', value: 'Starts DIY projects and never finishes them' },
    ],
    correctAnswer: 'A',
  },
  {
    number: 2,
    text: "What's his guilty pleasure TV show?",
    options: [
      { label: 'A', value: 'Love Island' },
      { label: 'B', value: 'Friends (not even guilty about it)' },
      { label: 'C', value: 'Bargain Hunt' },
      { label: 'D', value: 'Real Housewives' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 3,
    text: "What's his most-used phrase?",
    options: [
      { label: 'A', value: '"It is what it is"' },
      { label: 'B', value: '"Damn, I look good! Look at those muscles!"' },
      { label: 'C', value: '"That\'s what she said"' },
      { label: 'D', value: '"Hold my beer"' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 4,
    text: "What's he most likely to cry at?",
    options: [
      { label: 'A', value: 'The end of Marley & Me' },
      { label: 'B', value: 'When France lose at rugby' },
      { label: 'C', value: 'His mum, Lu, or their cat Monty' },
      { label: 'D', value: 'Running out of wine' },
    ],
    correctAnswer: 'C',
  },
  {
    number: 5,
    text: "What's the most annoying thing about him?",
    options: [
      { label: 'A', value: "He's always right (and knows it)" },
      { label: 'B', value: 'Being messy and impatient' },
      { label: 'C', value: 'Chews with his mouth open' },
      { label: 'D', value: 'Takes 45 minutes in the bathroom' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 6,
    text: "What's the biggest lie he regularly tells?",
    options: [
      { label: 'A', value: '"I\'ve only had two beers"' },
      { label: 'B', value: '"I\'ll do it tomorrow"' },
      { label: 'C', value: 'He exaggerates everything' },
      { label: 'D', value: '"I\'m on my way"' },
    ],
    correctAnswer: 'C',
  },
  {
    number: 7,
    text: "What would be his go-to karaoke song?",
    options: [
      { label: 'A', value: 'Wonderwall — Oasis' },
      { label: 'B', value: 'Bohemian Rhapsody — Queen' },
      { label: 'C', value: 'Angels — Robbie Williams' },
      { label: 'D', value: 'I Will Survive — Gloria Gaynor' },
    ],
    correctAnswer: 'A',
  },
  {
    number: 8,
    text: "What would he grab first if the house was on fire?",
    options: [
      { label: 'A', value: 'His phone' },
      { label: 'B', value: 'Wet sheets and towels' },
      { label: 'C', value: 'The cat (Monty)' },
      { label: 'D', value: 'His passport' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 9,
    text: "What's his signature dance move?",
    options: [
      { label: 'A', value: 'The Sprinkler' },
      { label: 'B', value: 'Twerk / butt wiggling' },
      { label: 'C', value: 'The Robot' },
      { label: 'D', value: 'Finger guns with hip thrust' },
    ],
    correctAnswer: 'B',
  },
  {
    number: 10,
    text: "What does he think he's amazing at but really isn't?",
    options: [
      { label: 'A', value: 'Cooking' },
      { label: 'B', value: 'Picking jewellery for Lu' },
      { label: 'C', value: 'Parallel parking' },
      { label: 'D', value: 'Speaking French' },
    ],
    correctAnswer: 'B',
  },
]
