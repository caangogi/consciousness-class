"use client";
import { useEffect } from "react";

const LoadPhosphorIcons = () => {
  useEffect(() => {
    const head = document.getElementsByTagName("head")[0];

    for (const weight of [
      "regular",
      "thin",
      "light",
      "bold",
      "fill",
      "duotone",
    ]) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = `https://unpkg.com/@phosphor-icons/web@2.1.1/src/${weight}/style.css`;
      head.appendChild(link);
    }
  }, []); // Runs only once when the component mounts

  return null; // No UI output
};

export default LoadPhosphorIcons;
