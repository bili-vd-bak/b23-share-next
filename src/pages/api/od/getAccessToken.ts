import request from "../../../tiny-request";
import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json(await getAccessTokens(req.query?.d));
};

const timestamp = () => (Date.now() / 1000) || 0;

/**
 * 返回参数：\
 * {t: number时间, r: [][]}\
 * r下4个string\
 * [分享链接，组织sharepoint域名，token，本次请求api]
 * @returns {*}
 */

export async function getAccessTokens(
  res?: string | string[] | undefined
): Promise<{
  t: number;
  r: {
    sharelink: string;
    orgdomain: string;
    accesskey: string;
    api: string;
  }[];
}> {
  let refresh: { t: number; r: [string, string, string, string][] } = {
    t: timestamp(),
    r: [],
  };
  // let access: { t: number; r: [string, string, string, string][] } = {
  //   t: 0,
  //   r: [],
  // };
  let access: {
    t: number;
    r: {
      sharelink: string;
      orgdomain: string;
      accesskey: string;
      api: string;
    }[];
  } = {
    t: timestamp(),
    r: [],
  };
  if (!res) return access;
  else if (typeof res === "string") res = [res];
  let arr1: [string, string][] = [];
  for (const sharelink of res) {
    await fetch(sharelink, {
      headers: {
        cookie: "",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0",
      },
      redirect: "manual",
    }).then((res) => {
      const cookie = res.headers.get("set-cookie") || "";
      /*const real_cookie = cookie
              .replace(/expires=(.+?);\s/gi, "")
              .replace(/path=\/(,?)(\s?)/gi, "")
              .trim();*/
      arr1.push([sharelink, cookie]);
    });
  }
  let arr2: [string, string, string, string][] = [];
  for (const CookieWithLink of arr1) {
    const sl = new URL(CookieWithLink[0]);
    const pathnames = sl.pathname.split("/");
    const path = `/${pathnames[3]}/${pathnames[4]}/`;
    arr2.push([CookieWithLink[0], sl.origin, path, CookieWithLink[1]]);
  }
  refresh = { t: timestamp(), r: arr2 };

  // let arr3: [string, string, string, string][] = [];
  let arr3: {
    sharelink: string;
    orgdomain: string;
    accesskey: string;
    api: string;
  }[] = [];
  for (const Links of refresh.r) {
    const url = `${Links[1]}${Links[2]}_api/web/GetListUsingPath(DecodedUrl=@a1)/RenderListDataAsStream`;
    const config = {
      headers: {
        origin: Links[1],
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0",
        Cookie: Links[3],
      },
      params: {
        "@a1": `'${Links[2]}Documents'`,
        RootFolder: `${Links[2]}Documents/`,
        TryNewExperienceSingle: "TRUE",
      },
    };
    const data = {
      parameters: {
        ViewXml: `<View ><Query><OrderBy><FieldRef Name="LinkFilename" Ascending="true"></FieldRef></OrderBy></Query><ViewFields>
<FieldRef Name="CurrentFolderSpItemUrl"/>
<FieldRef Name="FileLeafRef"/>
<FieldRef Name="FSObjType"/>
<FieldRef Name="SMLastModifiedDate"/>
<FieldRef Name="SMTotalFileStreamSize"/>
<FieldRef Name="SMTotalFileCount"/>
</ViewFields><RowLimit Paged="TRUE">20</RowLimit></View>`,
        RenderOptions: 136967,
        AllowMultipleValueFilterForTaxonomyFields: true,
        AddRequiredFields: true,
      },
    };
    const res = await request.post(url, data, config);
    // arr3.push([
    //   Links[0],
    //   Links[1],
    //   res.data?.ListSchema[".driveAccessToken"].slice(13),
    //   res.data?.ListSchema[".driveUrl"],
    // ]);
    arr3.push({
      sharelink: Links[0],
      orgdomain: Links[1],
      accesskey: res.data?.ListSchema[".driveAccessToken"].slice(13),
      api: res.data?.ListSchema[".driveUrl"],
    });
    access = { t: timestamp(), r: arr3 };
  }
  return access;
}
