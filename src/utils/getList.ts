import { decode, encodeURI } from "js-base64";
import apis from "./accessApi";
import * as FTC from "./FileTypeCheck";

let list: any[] = [];

async function getRaw(accesskey: string, path: string) {
  const res = await apis.od.raw({
    access_tokens_base64: accesskey,
    path: path,
  });
  return res?.dlinks[0]
    ? fetch(res?.dlinks[0].dlink).then((res) => res.json())
    : "";
}

async function getAllList(
  accesskey: string,
  path: string,
  nextPageToken: string
) {
  const res = await apis.od.item({
    access_tokens_base64: accesskey,
    path,
    nextPageToken,
  });
  list.push(...res.items[0].folder.value);
  if (res.items[0].folder.nextPageToken)
    await getAllList(accesskey, path, res.items[0].folder.nextPageToken);
}

/**
 * @param ori_list 此处为item接口获取到的value
 */
function fmtIDList(
  ori_list: { name: string }[],
  id_name_dic: { [key: string]: string }
) {
  let fmt_list = [];
  for (const i of ori_list) {
    fmt_list.push({
      name: id_name_dic[i.name] || "",
      id: i.name || "",
    });
  }
  return fmt_list;
}

interface info_file {
  code: number;
  result: {
    title: string;
    evaluate: string;
    episodes: ep[];
  };
}

interface ep {
  share_copy: string;
  badge?: string;
  dd_hash?: string;
  dd_epid?: number;
}

function fmtEpInfoList(ori_info: info_file) {
  //TODO 添加对 biliintl 的 ep 格式支持：modules-data-episodes
  const ok = ori_info.code === 0 && !!ori_info.result;
  /**
   * info_file进，episodes出
   */
  function skipSomeEpsInInfoFile(info: info_file) {
    let eps = [];
    for (let i = 0; i < info?.result?.episodes.length; i++) {
      if (info?.result?.episodes[i]?.badge !== "预告") {
        //符合BBDown下载行为：跳过预告、https://github.com/nilaoda/BBDown/commit/53051c92de2ecaa9ce76fc4687ad60ea8937301c
        eps.push(info?.result?.episodes[i]);
      }
    }
    return eps;
  }
  return {
    title: ok ? ori_info.result.title : "未知",
    evaluate: ok ? ori_info.result.evaluate : "",
    episodes: ok ? skipSomeEpsInInfoFile(ori_info) : [],
  };
}

interface co_struct {
  video: string;
  danmaku: boolean | string;
  sub_chs: boolean | string;
  sub_cht: boolean | string;
  dd_hash: string;
  dd_epid: number;
}

/**
 * @param ori_list 此处为item接口获取到的value
 */
function fmtEpList(ori_list: { name: string }[], epsInfo: ep[]) {
  let fmt_list = [];
  let co_cache: {
    [key: string]: co_struct;
  } = {};
  function init_co_cache(fn: string) {
    if (!co_cache[fn])
      co_cache[fn] = {
        video: "mp4",
        danmaku: false,
        sub_chs: false,
        sub_cht: false,
        dd_hash: "",
        dd_epid: 0,
      };
  }
  for (const i of ori_list) {
    const fn = FTC.FNeEXT(i.name),
      ext = FTC.EXT(i.name);
    if (ext === "xml") {
      init_co_cache(fn);
      co_cache[fn].danmaku = i.name;
    }
    if (ext === "srt") {
      const subtitleHead = FTC.FNeEXT(fn); //{number}----------
      const subtitleLanguage = FTC.EXT(fn); //[zh-Hans/zh-Hant]
      init_co_cache(subtitleHead);
      init_co_cache(fn);
      // {number}----------.[zh-Hans/zh-Hant].srt 格式
      if (subtitleLanguage === "zh-Hans")
        co_cache[subtitleHead].sub_chs = i.name;
      if (subtitleLanguage === "zh-Hant")
        co_cache[subtitleHead].sub_cht = i.name;
      // 视频同名 格式
      co_cache[fn].sub_chs = i.name;
      co_cache[fn].sub_cht = i.name;
    }
  }
  for (const i of ori_list) {
    const fn = FTC.FNeEXT(i.name),
      ext = FTC.EXT(i.name);
    init_co_cache(fn); //防无弹幕、字幕
    if (ext === "mp4" || ext === "mkv") {
      co_cache[fn].video = ext;
      const info = fn.split("-----"),
        ep = Number(info[0]),
        epinfo = epsInfo[ep - 1];
      fmt_list.push({
        ffn: fn || "未知", //完整文件名
        ep: ep || 0, //集数
        qn: info[1] || "未知", //清晰度
        fn: info[2] || "未知", //编码方式
        sn: epinfo?.share_copy || (typeof epinfo === "string" ? epinfo : ""), //B站上本集标题
        ot: info[3] || "", //文件名上备注的其它信息(第四段)
        co: {
          video: co_cache[fn]?.video || "unknown", // mp4/mkv/...
          danmaku: co_cache[fn]?.danmaku || co_cache[info[0]]?.danmaku || false,
          sub_chs:
            co_cache[fn]?.sub_chs || //同名
            co_cache[info[0] + "----------"]?.sub_chs || //BBDown
            co_cache[info[0]]?.sub_chs || //仅数字头
            false,
          sub_cht:
            co_cache[fn]?.sub_cht ||
            co_cache[info[0] + "----------"]?.sub_cht ||
            co_cache[info[0]]?.sub_cht || //仅数字头
            false,
          dd_hash: epinfo?.dd_hash || "",
          dd_epid: epinfo?.dd_epid || 0,
        },
      });
    }
  }
  return fmt_list;
}

export async function getAccesskey(sharelink: string) {
  const accesskey = encodeURI(
    JSON.stringify(await apis.od.getAccessToken(sharelink))
  );
  return accesskey;
}

export async function getList(accesskey: string, path?: string, fmt = true) {
  const id_name_dic_path = "/bangumi-index/id_name_dic.json";
  const id_lib_path = path || "/bangumi-index/md/";
  // const id_name_dic = await getRaw(accesskey, id_name_dic_path);
  // console.log(id_lib_path)
  const res = await apis.od.item({
    access_tokens_base64: accesskey,
    path: id_lib_path,
  });
  list = res.items[0].folder.value;
  if (res.items[0].folder.nextPageToken)
    await getAllList(accesskey, id_lib_path, res.items[0].folder.nextPageToken);
  console.log(list);
  const fmt_list: { name: string; id: string }[] = fmt
    ? fmtIDList(list, await getRaw(accesskey, id_name_dic_path))
    : list;
  list = [];
  return fmt_list;
}

export async function getEp(accesskey: string, id: string) {
  const id_lib_path = "/bangumi-index/md/";
  const info_file = "info.json";
  const info = fmtEpInfoList(
    (await getRaw(accesskey, id_lib_path + id + "/" + info_file)) || {
      code: 0,
      result: {
        title: "无",
        evaluate: "（番剧简介）本仓库暂无info.json信息文件。",
        episodes: [],
      },
    }
  );
  const res = await apis.od.item({
    access_tokens_base64: accesskey,
    path: id_lib_path + id + "/",
  });
  list = res.items[0].folder.value;
  if (res.items[0].folder.nextPageToken)
    await getAllList(
      accesskey,
      id_lib_path + id + "/",
      res.items[0].folder.nextPageToken
    );
  const fmt_list = fmtEpList(list, info.episodes);
  list = [];
  return {
    title: info.title,
    evaluate: info.evaluate,
    ep: fmt_list,
  };
}

export async function getVideoData(
  accesskey: string,
  id: string,
  ffn: string,
  co_raw: string
) {
  const co: co_struct = JSON.parse(decode(co_raw));
  const info = ffn.split("-----");
  const id_lib_path = "/bangumi-index/md/";
  const fils = {
    video: ffn + "." + (co.video || "mp4"),
    danmaku: co.danmaku,
    sub_chs: co.sub_chs,
    sub_cht: co.sub_cht,
  };
  let dlinks = { video: "", danmaku: "", sub_chs: "", sub_cht: "" };
  let dd_helper = { hash: co.dd_hash, epid: co.dd_epid };
  dlinks.video = (
    await apis.od.raw({
      access_tokens_base64: accesskey,
      path: id_lib_path + id + "/" + fils.video,
    })
  )?.dlinks[0].dlink;
  if (co.danmaku)
    dlinks.danmaku = (
      await apis.od.raw({
        access_tokens_base64: accesskey,
        path: id_lib_path + id + "/" + fils.danmaku,
      })
    )?.dlinks[0].dlink;
  if (co.sub_chs)
    dlinks.sub_chs = (
      await apis.od.raw({
        access_tokens_base64: accesskey,
        path: id_lib_path + id + "/" + fils.sub_chs,
      })
    )?.dlinks[0].dlink;
  if (co.sub_cht)
    dlinks.sub_cht = (
      await apis.od.raw({
        access_tokens_base64: accesskey,
        path: id_lib_path + id + "/" + fils.sub_cht,
      })
    )?.dlinks[0].dlink;
  return { dlinks, dd_helper };
}
