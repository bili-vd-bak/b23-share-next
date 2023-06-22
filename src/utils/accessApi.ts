import { getAccessTokens } from "@/pages/api/od/getAccessToken";
import { onedrive_item } from "@/pages/api/od/item";
import { onedrive_raw } from "@/pages/api/od/raw";

export default {
  od: {
    getAccessToken: getAccessTokens,
    item: onedrive_item,
    raw: onedrive_raw,
  },
};
