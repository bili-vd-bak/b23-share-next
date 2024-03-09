// import apis from "@/utils/accessApi";
// import { getList } from "@/utils/getList";
// import { Base64 } from "js-base64";
import { getAccesskey } from "@/utils/getList";
import _lib from "@/pages/lib/_lib.json";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  console.log(req.body);
  const lib: { [key: string]: string } = _lib,
    accesskey = await getAccesskey(lib[req.body.username || "core"]);
  res.send({
    code: 200,
    message: "success",
    data: {
      token: (req.body.username || "core") + "---" + accesskey,
    },
  });
}
