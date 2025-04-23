import { Transform } from 'class-transformer';

export class GuidConverter {
  @Transform(({ value }) => {
    if (!value) return null;
    try {
      return value.toString();
    } catch (error) {
      return null;
    }
  })
  static toGuid(value: string): string {
    if (!value) return null;
    try {
      return value.toString();
    } catch (error) {
      return null;
    }
  }

  @Transform(({ value }) => {
    if (!value) return null;
    try {
      return value.toString();
    } catch (error) {
      return null;
    }
  })
  static fromGuid(value: string): string {
    if (!value) return null;
    try {
      return value.toString();
    } catch (error) {
      return null;
    }
  }
} 