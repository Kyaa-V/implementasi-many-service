import { ZodType } from "zod";

export class VALIDATION {
  static validation<T>(schema: ZodType<T>, request: T): T {
    return schema.parse(request);
  }
}