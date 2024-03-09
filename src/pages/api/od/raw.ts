import { wrapPath } from "./pathHandler";
import { encode, decode } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokens } from "./getAccessToken";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { d, p }: { d?: string; p?: string } = req.query;
  res.status(200).json(
    await onedrive_raw({
      access_tokens_base64: d,
      path: p,
    })
  );
};

async function getRaw(drive_api: string, path: string, access_token: any) {
  // const requestUrl = `${drive_api}${wrapPath(path, '/children')}?select=@microsoft.graph.downloadUrl,name,size,lastModifiedDateTime,file&$top=${top}`
  const requestUrl = `${drive_api}${wrapPath(
    path,
    "/children"
  )}?select=@microsoft.graph.downloadUrl`;
  console.log(requestUrl);
  const res = await fetch(requestUrl, {
    headers: {
      Authorization: `bearer ${access_token}`,
    },
  });
  return await res.json();
}

export async function onedrive_raw({ path = "", access_tokens_base64 = "" }) {
  const access_tokens_str =
    decode(access_tokens_base64) ||
    JSON.stringify({
      t: 0,
      r: [{ sharelink: "", orgdomain: "", accesskey: "", api: "" }],
    } as {
      t: number;
      r: {
        sharelink: string;
        orgdomain: string;
        accesskey: string;
        api: string;
      }[];
    });
  let access_tokens = JSON.parse(access_tokens_str) as {
    t: number;
    r: {
      sharelink: string;
      orgdomain: string;
      accesskey: string;
      api: string;
    }[];
  };
  if (!access_tokens || access_tokens.r.length === 0) {
    console.error("access_token is empty.");
    return {
      errors: [
        {
          message: "Access token is not available.",
        },
      ],
      dlinks: [],
    };
  }

  let arr1 = [];
  for (const i of access_tokens.r) {
    let access_token = i.accesskey;
    let data;

    const re_gen_accesskey = async () => {
      // console.log("re_gen_accesskey");
      const access_tokens = (await getAccessTokens(i.sharelink)).r[0];
      access_token = (await getAccessTokens(i.sharelink)).r[0].accesskey;
      data = await getRaw(access_tokens.api, path, access_token);
    };

    if (access_token === "dynamic") await re_gen_accesskey();
    else data = await getRaw(i.api, path, access_token);
    if (
      data.error?.code === "unauthenticated" &&
      data.error?.innerError?.code === "expiredToken"
    )
      await re_gen_accesskey();
    if (data["@content.downloadUrl"]) {
      const downloadUrl: string = data["@content.downloadUrl"];
      arr1.push({ sharelink: i.sharelink, dlink: downloadUrl });
    }
  }
  if (arr1.length === 0)
    return {
      errors: [
        {
          message: "Drive is not available.",
        },
      ],
      dlinks: [],
    };
  return { dlinks: arr1 };
}
