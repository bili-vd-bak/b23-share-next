// import apis from "@/utils/accessApi";
// import { getList } from "@/utils/getList";
// import { Base64 } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  console.log(req.headers);
  res.send({
    code: 200,
    message: "success",
    data: {
      id: 1,
      username: req.headers.authorization?.split("---")[0],
      Salt: "",
      password: "",
      base_path: "/",
      role: 2,
      disabled: false,
      permission: 0,
      sso_id: "",
      otp: false,
    },
  });
}
