import { useEffect, useRef, useState } from "react";
import Crypto from "crypto-js";

const getFileHash = async (buffer: ArrayBuffer) => {
  // 计算前 16MB 的 MD5
  const length = 16 * 1024 * 1024;
  buffer = buffer.slice(0, length);

  // const array = Buffer.from(new Uint8Array(buffer));
  const wordArray = Crypto.lib.WordArray.create(buffer);
  const fileHash = Crypto.MD5(wordArray).toString();
  // crypto.createHash("md5").update(array).digest("hex");

  return fileHash;
};

const matchAudio = async (file: File) => {
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file.slice(0, 16 * 1024 * 1024));
    reader.onload = (e) => {
      resolve(e.target?.result as ArrayBuffer);
    };
    reader.onerror = (e) => {
      reject(e);
    };
  });

  const payload = {
    fileHash: await getFileHash(arrayBuffer),
    fileName: file.name,
    fileSize: file.size,
  };

  const url = "https://api.dandanplay.net/api/v2/match";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return [payload, data];
};

type Comment = {
  text: string;
  time: number;
  color: string;
  border: boolean;
  mode: 0 | 1;
};

const fetchComments = async (episodeId: string): Promise<Comment[]> => {
  const url = `https://api.dandanplay.net/api/v2/comment/${episodeId}?withRelated=true&chConvert=1`;

  const response = await fetch(url);
  const data = await response.json();

  const comments: Comment[] = [];
  for (const comment of data.comments) {
    const params = comment.p.split(",");

    comments.push({
      text: comment.m,
      time: parseInt(params[0]),
      color: params[2],
      border: false,
      mode: 0,
    });
  }

  return comments;
};

export const List = ({ data }) => {
  const listItems = data[1].matches.map((i: any) => (
    <tr key={i.episodeId}>
      <td>{i.episodeId}</td>
      <td>{i.animeId}</td>
      <td>{i.animeTitle}</td>
      <td>{i.episodeTitle}</td>
      <td>{i.typeDescription}</td>
    </tr>
  ));
  return (
    <table>
      <thead>
        <tr>
          <th>episodeId</th>
          <th>animeId</th>
          <th>animeTitle</th>
          <th>episodeTitle</th>
          <th>typeDescription</th>
        </tr>
      </thead>
      <tbody>{listItems}</tbody>
    </table>
  );
};

export default function Home() {
  const [description, setDescription] = useState<string>("请先选择文件");
  const [data, setData] = useState<any>([{}, { matches: [] }]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [url, setUrl] = useState<string>("");

  const onPlay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }

    setDescription("正在匹配");
    const file = e.target.files[0];

    let matchData: any = null;
    try {
      matchData = await matchAudio(file);
    } catch (e) {
      console.error(e);
      setDescription("匹配失败");
      return;
    }

    if (matchData[1].errorCode !== 0 || matchData[1]?.matches?.length === 0) {
      setDescription("匹配失败");
      return;
    }

    setDescription("正在获取弹幕");
    const match = matchData[1].matches[0];

    // 获取弹幕
    let comments: any = null;
    // try {
    //   comments = await fetchComments(match.episodeId);
    // } catch (e) {
    //   console.error(e);
    //   setDescription("弹幕获取失败");
    //   return;
    // }

    setUrl(URL.createObjectURL(file));
    setComments(comments);
    setDescription(
      `[${matchData[1].isMatched ? "精确" : "模糊"}匹配],文件信息：${JSON.stringify(
        matchData[0]
      )}`
    );
    setData(matchData);
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <p>{description}</p>
      <List data={data}></List>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input type="file" onChange={onPlay} />
      </div>
    </main>
  );
}
