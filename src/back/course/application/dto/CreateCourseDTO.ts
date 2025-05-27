export interface CreateCourseDTO {
  title: string;
  description: string;
  coverImageUrl: string;
  price: number;
  language: string;
  level: string;
  instructorId: string;
  tags?: string[];
  whatYouWillLearn: string[];
  whyChooseThisCourse: string[];
  idealFor: string[];
  enrollCallToAction: string;
  moduleIds?: string[]; 
  type: 'course' | 'membership';
}
