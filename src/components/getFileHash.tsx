import { useEffect, useRef, useState } from "react";
import { md5 } from "hash-wasm";

const getFileHash = async (buffer: ArrayBuffer) => {
  // 计算前 16MB 的 MD5
  const length = 16 * 1024 * 1024;
  buffer = buffer.slice(0, length);
  const fileHash = md5(new Uint8Array(buffer));
  return fileHash;
};

const matchAudio = async (file?: File, title?: string, hash?: string) => {
  let payload = {};
  if (file) {
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

    payload = {
      fileHash: await getFileHash(arrayBuffer),
      fileName: file.name,
      fileSize: file.size,
    };
  } else if (title || hash)
    payload = {
      fileHash: hash || "8733483666773cacbd79ac6f6ad56d6d",
      fileName: title || "86",
      fileSize: 0,
    };

  // const url = "https://api.dandanplay.net/api/v2/match";
  const url = "/api/ddplay/api/v2/match";

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
  // const url = `https://api.dandanplay.net/api/v2/comment/${episodeId}?withRelated=true&chConvert=1`;
  const url = `/api/ddplay/api/v2/comment/${episodeId}?withRelated=true&chConvert=1`;

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

export const List = ({ data }: { data: any }) => {
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
    <table style={{ borderCollapse: "collapse", border: "1px solid black" }}>
      <thead>
        <tr style={{ border: "1px solid black" }}>
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

  const [titlename, setTitlename] = useState<string>("");
  const [hash, setHash] = useState<string>("");

  const onPlay = async (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.FormEventHandler<HTMLFormElement>
      | any
  ) => {
    if (!e.target.files) e.preventDefault();
    setDescription("正在匹配");
    let matchData: any = null;

    if (e.target.files) {
      const file = e.target.files[0];
      try {
        matchData = await matchAudio(file);
      } catch (e) {
        console.error(e);
        setDescription("匹配失败");
        return;
      }
    } else {
      try {
        matchData = await matchAudio(undefined, titlename, hash);
      } catch (e) {
        console.error(e);
        setDescription("匹配失败");
        return;
      }
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

    // setUrl(URL.createObjectURL(file));
    // setComments(comments);
    setDescription(
      `[${
        matchData[1].isMatched ? "精确" : "模糊"
      }匹配],文件信息：${JSON.stringify(matchData[0])}`
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>
          <input type="file" onChange={onPlay} />
        </div>
        <br />
        <div>
          <form onSubmit={onPlay}>
            以下两项二选一填写，数据越全搜索越准。
            <br />
            番剧名(空格+集数)：
            <input
              onChange={(e) => {
                setTitlename(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "5px 16px",
                margin: "8px 0",
                display: "inline-block",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
            <br />
            前16MB MD5值：
            <input
              onChange={(e) => {
                setHash(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "5px 16px",
                margin: "8px 0",
                display: "inline-block",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
            <br />
            <button
              type="submit"
              style={{
                width: "100%",
                backgroundColor: "#4CAF50",
                color: "white",
                padding: "5px 16px",
                margin: "8px 0",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              搜索
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
