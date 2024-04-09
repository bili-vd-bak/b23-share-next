import { getEp, getList, getVideoData } from "@/utils/getList";
import type { NextApiRequest, NextApiResponse } from "next";
import _lib from "@/pages/lib/_lib.json";
import { EXT } from "@/utils/FileTypeCheck";
import { encodeURI, decode } from "js-base64";
import * as FTC from "@/utils/FileTypeCheck";

interface alist_fs {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  sign: string;
  thumb: string;
  type: number;
  raw_url: string;
  readme: string;
  provider: string;
  related: null;
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
      path_raw: string = "/bangumi-index" + req.body.path, //TODO 逆查: 'name'-->'id'
      path = path_raw.substring(1).split("/"); //['bangumi-index','[id]name']
    // console.log(req.body.path);
    // console.log(path_raw);
    let c: alist_fs = {
      name: "root",
      size: 0,
      is_dir: true,
      modified: "0001-01-01T00:00:00Z",
      sign: "",
      thumb: "",
      type: 0,
      raw_url: "",
      readme: "",
      provider: "unknown",
      related: null,
    };
    // console.log(path_raw);
    if (
      !path[2]
      // path_raw === "/" ||
      // path_raw === "/bangumi-index" ||
      // path_raw === "/bangumi-index/"
    ) {
      c = {
        name: path[1] || "",
        size: 0, //TODO size get
        is_dir: true,
        modified: "1970-01-01T00:00:00+00:00",
        sign: "",
        thumb: "",
        type: 1,
        raw_url: "",
        readme: "",
        provider: "bvd",
        related: null,
      };
      // const c_raw = await getList(u_info[1]);
      // console.log(c_raw);
    } else if (path[2]) {
      const id = (path[1].match(/\[bvdid(.+?)\]/) || [])[1],
        ep = (path[2]?.match(/\[P(.+?)\]/) || [])[1],
        ext = EXT(path[2]);
      const EP_list_raw = await getEp(u_info[1], id),
        ep_info = EP_list_raw.ep.find((ele) => ele.ep === Number(ep)),
        c_raw = await getVideoData(
          u_info[1],
          id,
          ep_info?.ffn as string,
          encodeURI(JSON.stringify(ep_info?.co))
        );
      let raw_url = c_raw.dlinks.video;
      switch (ext) {
        case "xml":
          raw_url = c_raw.dlinks.danmaku;
          break;
        case "srt":
          raw_url = c_raw.dlinks.sub_chs || c_raw.dlinks.sub_cht;
        default:
          break;
      }
      c = {
        name: path[2],
        size: 0,
        is_dir: false,
        modified: "1970-01-01T00:00:00+00:00",
        sign: "",
        thumb: "",
        type: 0,
        raw_url,
        readme: "",
        provider: "bvd",
        related: null,
      };
    }
    console.log(c);
    return c;
  }
  const c = await cc();
  // console.log(c);
  // res.send(c);
  res.send({
    code: 200,
    message: "success",
    data: c,
  });
}
