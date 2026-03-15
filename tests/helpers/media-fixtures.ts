import path from "node:path";

export function imageFixturePath(filename: string) {
  return path.join(process.cwd(), "tests", "fixtures", "images", filename);
}
