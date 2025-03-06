"use client";

import React, { useEffect, useState } from "react";

interface FileData {
  id: string;
  name: string;
  url: string;
}

interface OneDrivePickerProps {
  onFileSelect: (file: FileData) => void;
}

declare global {
  interface Window {
    OneDrive: any;
  }
}

export function OneDrivePicker({ onFileSelect }: OneDrivePickerProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const authenticate = async () => {
    const res = await fetch("/api/onedrive-auth");
    const { url } = await res.json();
    const w = 600,
      h = 600;
    const y = window.outerHeight / 2 + window.screenY - h / 2;
    const x = window.outerWidth / 2 + window.screenX - w / 2;

    window.open(
      url,
      "popUpWindow",
      ` width=${w}, height=${h}, top=${y}, left=${x}, sizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes`
    );
  };

  const openOneDrivePicker = () => {
    if (!accessToken) return authenticate();

    const odOptions = {
      clientId: process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID!,
      action: "download",
      multiSelect: false,
      openInNewWindow: true,
      advanced: { redirectUri: window.location.origin + "/onedrive-callback" },
      success: (files: any) => {
        const file = files.value[0];
        console.log("Selected File:", file);
        const fileUrl = file["@microsoft.graph.downloadUrl"];
        const fileName = file.name;

        onFileSelect({ id: file.id, url: fileUrl, name: fileName });
      },
      cancel: () => console.log("User canceled selection"),
      error: (err: any) => console.error("OneDrive Picker Error:", err),
    };

    window.OneDrive?.open(odOptions);
  };

  return <button onClick={openOneDrivePicker}>Add from OneDrive</button>;
}
