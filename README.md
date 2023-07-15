# 欢迎访问 b23-share-next

# 访问 https://share.xrzyun.top 或 `src/pages/index.mdx`，获取最新READEME。

请浏览 侧边栏(桌面端)/右上角**☰**(移动端) 以选择番剧仓库。  
网站切页时无进度条，点击按钮后，服务器获取数据时请耐心等待。

## 您也想分享番剧？

1. 获取一个 OneDrive 国际版企业/教育号(支持 sharepoint 分享)，可为 E5/A1 等。
2. (根目录 `/`)新建`bangumi-index`文件夹。
3. (`/bangumi-index/`)新建`id_name_dic.json`，写入

```json filename="id_name_dic.json"
{
  "番剧ID": "番剧名称",
  "28480920": "别当欧尼酱了 (手动上传库)",
  "4188": "约会大作战",
  "custom20230401": "天国大魔境",
  "custom20230402": "World Dai Star"
}
```

4. (`/bangumi-index/`)新建`md`文件夹。
5. (`/bangumi-index/md/`)新建`番剧ID`文件夹。
6. (`/bangumi-index/md/番剧ID/`)新建`info.json`,写入(`episodes`中第 n 个`share_copy`代表第 n 集的标题)

```json filename="info.json"
{
  "code": 0,
  "result": {
    "title": "番剧名称",
    "evaluate": "（番剧简介）本仓库为手动上传。环大陆上映，故在此手动上传。",
    "episodes": [
      {
        "share_copy": "第1集 xxx"
      },
      {
        "share_copy": "第2集"
      }
    ]
  }
}
```

7. (`/bangumi-index/md/番剧ID/`)上传视频(mp4/mkv)、弹幕(B 站格式 xml)、字幕(srt)，会自动识别有无弹幕、字幕。  
    单分隔符为 5 个-，即`-----`；字幕为双分隔符 10 个-，即`----------`  
    ~~弹幕请保证与视频同名，字幕可同名(与视频一一对应)或匹配同集通用字幕`{集数(整数)}----------[zh-Hans|zh-Hant].srt`~~  
   **视频**: 合法格式`1-----1080P-----HEVC.mp4` `2-----720P 60帧-----AVC-----其它信息.mkv`  
   **弹幕**: 合法格式`1-----1080P-----HEVC.xml` `2-----720P 60帧-----AVC-----其它信息.xml`  
   **字幕**: 合法格式 ~~(暂未实现)`1-----1080P-----HEVC.srt`~~ `2----------zh-Hans.srt`

```text filename="视频/弹幕"
{集数(整数)}-----{清晰度(字符串)}-----{编码方式(字符串)}(-----{其他信息(字符串)}).[mp4|mkv|xml]
```

```text filename="字幕"
{集数(整数)}----------[zh-Hans|zh-Hant].srt
```

8. 分享`bangumi-index`文件夹(不要设密码)，获取链接。(详情参考本 Github 上`src/pages/lib/extra.mdx`里`sharelink`)

```text filename="此时你OneDrive里的样子"
/
└bangumi-index
  ├md
  │ ├番剧ID
  │ │ ├1-----1080P-----HEVC.mp4
  │ │ ├1-----1080P-----HEVC.xml
  │ │ ├1----------.srt
  │ │ ├2-----720P 60帧-----AVC-----其它信息.mkv
  │ │ ├2-----720P 60帧-----AVC-----其它信息.xml
  │ │ ├1024-----4K-----AV1-----集数无需连续.mp4
  │ │ └info.json
  │ ├custom01
  │ │ └...
  │ └...
  └id_name_dic.json
```

9. 向本仓库发 PR，在`src/pages/lib/`下创建`{你的仓库名}.mdx`文件(以`core.mdx`为模板)，修改第 6 行`sharelink`为你的分享链接。
10. (可选)修改 mdx 下面的说明、`src/pages/lib/_meta.json`(修改侧边栏中你仓库的名字)。
11. 等待 PR 通过。

## 开发

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
