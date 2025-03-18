// notionClient.js
import { Client as NotionClient } from "@notionhq/client";

// Ensure your environment variable NOTION_API_KEY is set with your Notion integration token.
const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });

export default notion;
