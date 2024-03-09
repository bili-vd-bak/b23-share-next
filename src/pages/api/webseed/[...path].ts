import apis from "@/utils/accessApi";
import { getAccesskey, getList } from "@/utils/getList";
import { Base64 } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  // 预期 req.query.path = ['path', 'to', 'file'] req.query.sl = '{sharelink}'
  if (!req.query.path || !req.query.sl) return;

  const accesskey = Base64.encodeURI(
    JSON.stringify(await apis.od.getAccessToken(req.query.sl))
  );
  const path_arr = req.query.path as string[];
  const path = "/" + path_arr.join("/");

  if (req.query.i) {
    res.send(
      await getList(
        await getAccesskey(req.query.sl as string),
        path + "/",
        false
      )
    );
  } else {
    const dlinks = await apis.od.raw({
      path,
      access_tokens_base64: accesskey,
    });
    const dlink = dlinks.dlinks[0].dlink;
    // res.json(await (Number(req.query.uid)));
    // console.log(path_arr)
    // res.send(path_arr)
    res.redirect(dlink);
  }
}
