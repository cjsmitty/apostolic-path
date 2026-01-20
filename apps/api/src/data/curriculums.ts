/**
 * Curriculum Definitions
 *
 * These define the standard lesson structures for common Apostolic
 * Bible study curricula. Churches can also create custom studies.
 */

export interface CurriculumLesson {
  number: number;
  title: string;
  description?: string;
}

export const CURRICULUMS: Record<string, CurriculumLesson[]> = {
  'search-for-truth': [
    { number: 1, title: 'The Bible', description: 'Understanding the Word of God' },
    { number: 2, title: 'God', description: 'The nature and character of God' },
    { number: 3, title: 'Man', description: 'The creation and fall of mankind' },
    { number: 4, title: 'Sin', description: 'Understanding sin and its consequences' },
    { number: 5, title: 'Jesus Christ', description: 'The deity and humanity of Christ' },
    { number: 6, title: 'Salvation', description: 'God\'s plan of redemption' },
    { number: 7, title: 'Repentance', description: 'Turning from sin to God' },
    { number: 8, title: 'Baptism', description: 'Water baptism in Jesus\' name' },
    { number: 9, title: 'The Holy Ghost', description: 'The gift of the Holy Spirit' },
    { number: 10, title: 'The Church', description: 'The body of Christ' },
    { number: 11, title: 'Holiness', description: 'Living a separated life' },
    { number: 12, title: 'The Second Coming', description: 'The return of Jesus Christ' },
  ],

  'exploring-gods-word': [
    { number: 1, title: 'The Word of God', description: 'Authority of Scripture' },
    { number: 2, title: 'One God', description: 'The Oneness of God' },
    { number: 3, title: 'The Name of Jesus', description: 'Power in the Name' },
    { number: 4, title: 'New Birth', description: 'Born of water and Spirit' },
    { number: 5, title: 'Repentance', description: 'The first step' },
    { number: 6, title: 'Water Baptism', description: 'Baptized into Christ' },
    { number: 7, title: 'Holy Spirit Baptism', description: 'Receiving the gift' },
    { number: 8, title: 'Living for God', description: 'The Christian walk' },
  ],

  'first-principles': [
    { number: 1, title: 'The Bible', description: 'Our guide for life' },
    { number: 2, title: 'God', description: 'Who is God?' },
    { number: 3, title: 'Jesus', description: 'God manifest in flesh' },
    { number: 4, title: 'Sin', description: 'The problem of sin' },
    { number: 5, title: 'Salvation', description: 'The solution' },
    { number: 6, title: 'Repentance', description: 'Changing direction' },
    { number: 7, title: 'Baptism', description: "Following Jesus' example" },
    { number: 8, title: 'Holy Ghost', description: 'Power to live' },
    { number: 9, title: 'Church', description: 'The family of God' },
    { number: 10, title: 'Christian Living', description: 'Walking in the light' },
  ],

  custom: [],
};

export function getCurriculumLessons(curriculum: string): CurriculumLesson[] {
  return CURRICULUMS[curriculum] || [];
}

export function getAvailableCurriculums(): string[] {
  return Object.keys(CURRICULUMS);
}
