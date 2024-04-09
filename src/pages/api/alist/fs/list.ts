import { getEp, getList } from "@/utils/getList";
import type { NextApiRequest, NextApiResponse } from "next";
import _lib from "@/pages/lib/_lib.json";
import { decode } from "js-base64";
import * as FTC from "@/utils/FileTypeCheck";

interface alist_fs {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  sign: string;
  thumb: string;
  type: number;
}

export default async function (req: NextApiRequest, res: NextApiResponse) {
  console.log(req.body);
  const h_auth = req.headers.authorization,
    u_info =
      h_auth && h_auth[0]
        ? h_auth?.split("---")
        : [
            "core",
            "eyJ0IjoxNzA3NjY0NjI1LjcxNywiciI6W3sic2hhcmVsaW5rIjoiaHR0cHM6Ly94cnpjbG91ZC1teS5zaGFyZXBvaW50LmNvbS86ZjovZy9wZXJzb25hbC9yZXBvc2l0b3J5X3hyemFwaV9ldV9vcmcvRWd6dzB1Z3hIcnBDa0ZVQTlDTXlGRHNCLTNXeFJhWWpfRTQ2azRTY244QkhrUT9lPUFxR1U0cCIsIm9yZ2RvbWFpbiI6Imh0dHBzOi8veHJ6Y2xvdWQtbXkuc2hhcmVwb2ludC5jb20iLCJhY2Nlc3NrZXkiOiJkeW5hbWljIiwiYXBpIjoiZHluYW1pYyJ9XX0",
          ];

  const timestamp = () => Date.now() / 1000 || 0;
  const decode_accesskey = JSON.parse(decode(u_info[1]));
  const jwt_payload = JSON.parse(
    decode(FTC.EXT(FTC.FNeEXT(decode_accesskey.r[0].accesskey)))
  );
  if (timestamp() >= jwt_payload.exp - 60)
    res.status(405).send({
      code: 405,
      message: "login info exp",
      data: null,
    });

  async function cc() {
    const lib: { [key: string]: string } = _lib,
      lib_id = u_info[0] || "core",
      path_raw: string = "/bangumi-index" + req.body.path,
      path = path_raw.substring(1).split("/"); //['bangumi-index','[id]name']
    let c: alist_fs[] = [
      // {
      //   name: "m",
      //   size: 0,
      //   is_dir: true,
      //   modified: "2023-07-19T09:48:13.695585868+08:00",
      //   sign: "",
      //   thumb: "",
      //   type: 1,
      // },
    ];
    // console.log(path_raw);
    if (
      path_raw === "/" ||
      path_raw === "/bangumi-index" ||
      path_raw === "/bangumi-index/"
    ) {
      const c_raw = await getList(u_info[1]);
      // console.log(c_raw);
      c_raw.forEach((e) => {
        c.push({
          name: `[bvdid${e.id}]${e.name}`,
          size: 0,
          is_dir: true,
          modified: "1970-01-01T00:00:00+00:00",
          sign: "",
          thumb: "",
          type: 1,
        });
      });
    } else {
      const id = (path[1].match(/\[bvdid(.+?)\]/) || [])[1];
      // t = (path[2].match(/\[t:(.+?)\]/) || [])[1];
      const c_raw = await getEp(u_info[1], id);
      // console.log(path_raw)
      // console.log(id)
      // console.log(c_raw)
      c_raw.ep.forEach((e) => {
        c.push({
          name: `[P${e.ep}][${e.qn}][${e.fn}].${e.co.video}`,
          size: 0,
          is_dir: false,
          modified: "1970-01-01T00:00:00+00:00",
          sign: "",
          thumb: "",
          type: 0,
        });
        if (e.co.danmaku) {
          c.push({
            name: `[P${e.ep}][${e.qn}][${e.fn}].xml`,
            size: 0,
            is_dir: false,
            modified: "1970-01-01T00:00:00+00:00",
            sign: "",
            thumb: "",
            type: 0,
          });
        }
        if (e.co.sub_chs || e.co.sub_cht) {
          c.push({
            name: `[P${e.ep}][${e.qn}][${e.fn}].srt`,
            size: 0,
            is_dir: false,
            modified: "1970-01-01T00:00:00+00:00",
            sign: "",
            thumb: "",
            type: 0,
          });
        }
      });
    }
    return c;
  }
  const c = await cc();
  // console.log(c);
  res.send({
    code: 200,
    message: "success",
    data: {
      content: c,
      total: c.length,
      readme: "",
      write: false,
      provider: "bvd",
    },
  });
  // res.send({
  //   code: 200,
  //   message: "success",
  //   data: {
  //     content: ,
  //     total: 1,
  //     readme: "# 开发环境/ntest",
  //     write: false,
  //     provider: "unknown",
  //   },
  // });
}
