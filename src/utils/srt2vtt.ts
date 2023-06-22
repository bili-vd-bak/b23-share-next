/**由srt字符串转webvtt的blob链接  
 * *Copy from https://github.com/DIYgod/DPlayer/issues/406#issuecomment-436840771*
 * @param text
 * @returns
 */
export default function srtToVtt(text: string) {
  const vttText = "WEBVTT \r\n\r\n".concat(
    text
      .replace(/\{\\([ibu])\}/g, "</$1>")
      .replace(/\{\\([ibu])1\}/g, "<$1>")
      .replace(/\{([ibu])\}/g, "<$1>")
      .replace(/\{\/([ibu])\}/g, "</$1>")
      .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2")
      .concat("\r\n\r\n")
  );
  return URL.createObjectURL(
    new Blob([vttText], {
      type: "text/vtt",
    })
  );
}
