"use client";
import React, { useCallback, useEffect, useState } from "react";
import { LoaderIcon } from "./icons";

interface NotionHandlerProps {
  onFileSelect: (files: File[]) => void;
  notionRef?: { triggerNotionImport: () => void };
}

export function NotionHandler({ onFileSelect, notionRef }: NotionHandlerProps) {
  const [accessToken, setAccessToken] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [authInitiated, setAuthInitiated] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.notionAccessToken) {
        setAccessToken(event.data.notionAccessToken);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const authenticate = async () => {
    const res = await fetch("/api/notion/auth");
    const { url } = await res.json();

    const w = 500,
      h = 500;
    const y = window.outerHeight / 2 + window.screenY - h / 2;
    const x = window.outerWidth / 2 + window.screenX - w / 2;

    window.open(
      url,
      "popUpWindow",
      `width=${w}, height=${h}, top=${y}, left=${x}, resizable=yes,scrollbars=yes`
    );
    setAuthInitiated(true);
  };

  const triggerNotionImport = useCallback(async () => {
    if (!accessToken) return authenticate();
    setLoading(true);

    try {
      const res = await fetch("/api/notion/data", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      if (data.results.length === 0) throw new Error("No pages found.");

      // Fetch markdown for each page and create File objects
      const fileBlobs = await Promise.all(
        data.results.map(
          async (page: {
            id: string;
            properties: {
              title: { id: string; title: { plain_text: string }[] };
            };
          }) => {
            const pageRes = await fetch(
              `/api/notion/page/${page.id}/markdown`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            const blob = await pageRes.blob();
            const filename = `${
              page.properties?.title?.title[0]?.plain_text?.replaceAll(
                " ",
                "-"
              ) ?? "notion-file"
            }-${page.id}.md`;

            return new File([blob], filename, { type: blob.type });
          }
        )
      );

      onFileSelect(fileBlobs);
    } catch (error) {
      console.error("Error fetching Notion data:", error);
    }

    setLoading(false);
    setAuthInitiated(false);
  }, [accessToken, onFileSelect]);

  // trigger notion import after the authentication is done
  useEffect(() => {
    if (authInitiated && accessToken) {
      triggerNotionImport();
    }
  }, [authInitiated, accessToken, triggerNotionImport]);

  // Assign the function to the ref prop if provided
  if (notionRef) {
    notionRef.triggerNotionImport = triggerNotionImport;
  }

  return loading ? (
    <div className="ml-2 flex items-center justify-center gap-1">
      <div className="animate-spin text-sky-800">
        <LoaderIcon size={12} />
      </div>
      <p className="text-xs text-sky-800">Importing files from notion</p>
    </div>
  ) : null;
}
