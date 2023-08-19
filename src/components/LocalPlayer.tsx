import { useEffect, useRef, useState } from "react";
import Artplayer from "artplayer";
import { md5 } from "hash-wasm";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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

export default function Home() {
  const artRef = useRef<HTMLDivElement | null>(null);
  const [player, setPlayer] = useState<Artplayer>();
  const [description, setDescription] = useState<string>("请先选择文件");
  const [comments, setComments] = useState<Comment[]>([]);
  const [url, setUrl] = useState<string>("");
  const [url_sub, setUrlsub] = useState<string>("");
  const [url_dan, setUrldan] = useState<string>("");

  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd";
    // const baseURL = "https://fastly.jsdelivr.net/npm/@ffmpeg/core@0.12.2/dist/umd";
    // const baseURL = "http://localhost:3000/ffmpeg/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
      console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setLoaded(true);
    setIsLoading(false);
  };

  const eSub = async (url: File) => {
    const ffmpeg = ffmpegRef.current;
    // u can use 'https://ffmpegwasm.netlify.app/video/video-15s.avi' to download the video to public folder for testing
    await ffmpeg.writeFile("sub.srt", "");
    await ffmpeg.writeFile("input.mkv", await fetchFile(url));
    await ffmpeg.exec(["-i", "input.mkv", "-map", "0:s:0?", "sub.srt"]);
    const data = (await ffmpeg.readFile("sub.srt")) as any;
    setUrlsub(
      URL.createObjectURL(new Blob([data.buffer], { type: "text/srt" }))
    );
  };

  useEffect(() => {
    const newPlayer = new Artplayer({
      container: "#player",
      url: url,
      autoSize: true,
      playbackRate: true,
      aspectRatio: true,
      setting: true,
      hotkey: true,
      mutex: true,
      fullscreen: true,
      fullscreenWeb: true,
      fastForward: true,
      subtitleOffset: true,
      miniProgressBar: true,
      lang: "zh-cn",
      subtitle: url_sub
        ? {
            url: url_sub,
            type: "srt",
            encoding: "utf-8",
            style: {
              color: "#FFFFFF",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(0,0,0,0)",
              borderRadius: "5px",
              width: "36%",
              marginInline: "31.5%",
            },
          }
        : {},
      plugins: [
        artplayerPluginDanmuku({
          danmuku: url_dan || comments,
          synchronousPlayback: true,
          speed: 10,
        }),
      ],
    });

    setPlayer(newPlayer);

    return () => {
      if (newPlayer?.destroy) {
        newPlayer.destroy();
      }
    };
  }, [comments, url, url_sub, url_dan]);

  const onPlay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player || !e.target.files) {
      return;
    }

    // await load();

    setDescription("正在匹配");
    const file = e.target.files[0];
    console.log(file)

    let matchData: any = null;
      await eSub(file);
    try {
      matchData = (await matchAudio(file))[1];
      // setDescription(JSON.stringify(matchData))
    } catch (e) {
      console.error(e);
      setDescription("匹配失败");
      return;
    }

    if (matchData.errorCode !== 0 || matchData?.matches?.length === 0) {
      setDescription("匹配失败");
      return;
    }

    setDescription("正在获取弹幕");
    const match = matchData.matches[0];

    // 获取弹幕
    let comments: any = null;
    try {
      comments = await fetchComments(match.episodeId);
    } catch (e) {
      console.error(e);
      setDescription("弹幕获取失败");
      return;
    }

    setUrl(URL.createObjectURL(file));
    setComments(comments);
    setDescription(
      `[${matchData.isMatched ? "精确" : "模糊"}] [${match.episodeId}] ${
        match.animeTitle
      } ${match.episodeTitle} -> ${comments.length} 条弹幕`
    );
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
      <p>状态: {description}</p>
      <p ref={messageRef}></p>

      <div
        style={{
          width: "500px",
          height: "300px",
          margin: "30px auto 0",
        }}
        id="player"
      ></div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => {
            setComments([]);
            setUrl("");
            setUrldan("");
            setUrlsub("");
          }}
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
          重置播放器实例
        </button>
        {!loaded && (
          <button
            onClick={load}
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
            加载FFMpeg组件(~31MB)
          </button>
        )}
        {loaded && (
          <p>
            视频文件：
            <input type="file" onChange={onPlay} />
          </p>
        )}
        <br />
        {loaded && (
          <p>
            自定义字幕(.srt)：
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  setUrlsub(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
          </p>
        )}
        <br />
        {loaded && (
          <p>
            自定义弹幕(.xml)：
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files) {
                  setUrldan(URL.createObjectURL(e.target.files[0]));
                }
              }}
            />
          </p>
        )}
      </div>
    </main>
  );
}
