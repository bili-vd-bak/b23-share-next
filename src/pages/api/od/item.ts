import { wrapPath } from "./pathHandler";
import { encode, decode } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokens } from "./getAccessToken";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { d, p, n }: { d?: string; p?: string; n?: string } = req.query;
  res.status(200).json(
    await onedrive_item({
      access_tokens_base64: d,
      path: p,
      nextPageToken: n,
    })
  );
};

const top = 500;

async function getItem(
  drive_api: string,
  path: string,
  nextPageToken: string,
  access_token: any
): Promise<Object> {
  const requestUrl =
    `${drive_api}${wrapPath(
      path,
      "/children"
    )}?select=name,size,lastModifiedDateTime,file,folder&$top=${top}` +
    (nextPageToken ? `&$skiptoken=${nextPageToken}` : "");
  console.log(requestUrl);
  const res = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });
  return (await res.json()) as Object;
}

function DataHandler(data: any) {
  delete data["@odata.context"];
  if (data["@odata.nextLink"]) {
    data["nextPageToken"] = new URL(data["@odata.nextLink"]).searchParams.get(
      "$skiptoken"
    );
  }
  // delete data["@odata.nextLink"];
  // if ("value" in data) {
  //   for (const i of data.value) {
  //     delete i["@odata.etag"];
  //     if ("file" in i) delete i["file"]["hashes"];
  //   }
  // } else {
  //   delete data["@odata.etag"];
  //   if ("file" in data) delete data["file"]["hashes"];
  // }
  return data;
}

export async function onedrive_item({
  access_tokens_base64 = "",
  // drive = "", //same as sharelink
  path = "",
  nextPageToken = "",
}) {
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
      items: [],
    };
  }

  let arr1 = [];
  for (const i of access_tokens.r) {
    if (i.accesskey) {
      let access_token = i.accesskey;
      let data: any;

      const re_gen_accesskey = async () => {
        // console.log("re_gen_accesskey");
        const access_tokens = (await getAccessTokens(i.sharelink)).r[0];
        access_token = access_tokens.accesskey;
        data = await getItem(
          access_tokens.api,
          path,
          nextPageToken,
          access_token
        );
      };

      if (access_token === "dynamic") await re_gen_accesskey();
      else data = await getItem(i.api, path, nextPageToken, access_token);
      if (
        data.error?.code === "unauthenticated" &&
        data.error?.innerError?.code === "expiredToken"
      )
        await re_gen_accesskey();
      data = DataHandler(data);
      if (!data) data = { value: [] };
      arr1.push({ sharelink: i.sharelink, folder: data });
    }
  }
  if (arr1.length === 0)
    return {
      errors: [
        {
          message: "Drive is not available.",
        },
      ],
      items: [],
    };

  return { items: arr1 };
}
