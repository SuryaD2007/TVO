import "server-only";

/** Satori needs TTF/OTF, so fetch static files from Google Fonts, subset to `text`. */
export async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!url) throw new Error(`Could not load font ${family}`);
  return (await fetch(url)).arrayBuffer();
}
