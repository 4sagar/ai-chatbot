"use client";
import React, { useCallback, useEffect, useState } from "react";

interface NotionHandlerProps {
  onFileSelect: (files: string[]) => void;
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

      const pageRes = await fetch(`/api/notion/page/${data.results[0].id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const pageData = await pageRes.json();

      onFileSelect(pageData.files);
    } catch (error) {
      console.error("Error fetching Notion data:", error);
    }

    setLoading(false);
  }, [accessToken, onFileSelect]);

  // trigger notion import, if the authentication is done
  useEffect(() => {
    if (authInitiated && accessToken) {
      triggerNotionImport();
    }
  }, [authInitiated, accessToken, triggerNotionImport]);

  // Assign the function to the ref prop if provided
  if (notionRef) {
    notionRef.triggerNotionImport = triggerNotionImport;
  }

  return loading ? <p>Importing images from notion...</p> : null;
}
