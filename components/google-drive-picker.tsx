"use client";

import React, { useEffect, useState } from "react";

interface FileData {
  id: string;
  name: string;
  url: string;
}

interface GoogleDrivePickerProps {
  onFileSelect: (file: FileData) => void;
}

export function GoogleDrivePicker(props: GoogleDrivePickerProps) {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("google-drive-access-token")
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [authInitiated, setAuthInitiated] = useState<boolean>(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => setGapiLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return; // Security check

      if (event.data.accessToken) {
        setAccessToken(event.data.accessToken);
        localStorage.setItem(
          "google-drive-access-token",
          event.data.accessToken
        );
        console.log("Received access token:", event.data.accessToken);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const authenticate = async () => {
    setAuthInitiated(true);
    const res = await fetch("/api/google-auth");
    const { url } = await res.json();

    const w = 500,
      h = 500;
    const y = window.outerHeight / 2 + window.screenY - h / 2;
    const x = window.outerWidth / 2 + window.screenX - w / 2;

    window.open(
      url,
      "popUpWindow",
      ` width=${w}, height=${h}, top=${y}, left=${x}, sizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes`
    );
  };

  const loadPicker = () => {
    if (!accessToken) return authenticate();

    setLoading(true);
    window.gapi?.load("picker", () => {
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!)
        .setCallback((data: any) => {
          if (data.action === "picked") {
            const file = data.docs[0];
            props.onFileSelect(file);
          }
          setLoading(false);
        })
        .build();
      picker.setVisible(true);
    });
  };

  useEffect(() => {
    if (authInitiated && accessToken) {
      loadPicker();
    }
  }, [authInitiated, accessToken]);

  return (
    <button onClick={loadPicker} disabled={!gapiLoaded || loading} {...props}>
      {loading ? "Google Picker Loading..." : "Upload from Google Drive"}
    </button>
  );
}
