export interface SectionPairDto {
  courseId: string;
  expectedStudents: number;
}

export interface BulkSectionDto {
  sections: SectionPairDto[];
  defaultCapacity: number;
  termId: string;
}
