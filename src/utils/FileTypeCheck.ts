/**
 * 输入文件名，返回后缀(扩展名)
 * @param FileName string
 */
export function EXT(FileName: string) {
  return FileName?.split(".").pop() || "Null";
}

/**
 * 输入文件名，返回文件名(除去扩展名)
 * @param FileName string
 * @returns
 */
export function FNeEXT(FileName: string) {
  return FileName?.substring(0, FileName?.lastIndexOf("."));
}
