"use client";

import Aos from "aos";
import { useEffect } from "react";

const Animation = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import WOW.js dynamically to ensure it runs only on the client side
      import("wowjs").then((WOW) => {
        const wow = new WOW.WOW({
          boxClass: "wow", // Class name for animations
          animateClass: "animate__animated", // Animation CSS class
          offset: 0, // Trigger animations when elements are in view
          mobile: true, // Enable animations on mobile
          live: true, // Check for dynamically added elements
        });
        wow.init();
      });
    }

    // Initialize AOS
    Aos.init({
      offset: 0,
      easing: "ease",
      once: true,
      duration: 1200,
    });
    Aos.refresh();
  }, []);

  return null;
};

export default Animation;
