import AboutThree from "@/components/AboutThree";
import BannerThree from "@/components/BannerThree";
import BlogTwo from "@/components/BlogTwo";
import BrandTwo from "@/components/BrandTwo";
import ChooseUsTwo from "@/components/ChooseUsTwo";
import CounterTwo from "@/components/CounterTwo";
import EventOne from "@/components/EventOne";
import FacultyOne from "@/components/FacultyOne";
import FooterThree from "@/components/FooterThree";
import HeaderOne from "@/components/HeaderOne";
import InfoTwo from "@/components/InfoTwo";
import TestimonialsThree from "@/components/TestimonialsThree";
import VideoOne from "@/components/VideoOne";
import Animation from "@/helper/Animation";

export const metadata = {
  title: "EduAll - LMS, Tutors, Education & Online Course NEXT JS Template",
  description:
    "EduAll is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It’s the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you’re offering online courses, running a tutoring platform, or managing an educational website, EduAll provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

const page = () => {
  return (
    <>
      {/* HeaderOne */}
      <HeaderOne />

      {/* Animation */}
      <Animation />

      {/* BannerThree */}
      <BannerThree />

      {/* InfoTwo */}
      <InfoTwo />

      {/* AboutThree */}
      <AboutThree />

      {/* VideoOne */}
      <VideoOne />

      {/* CounterTwo */}
      <CounterTwo />

      {/* FacultyOne */}
      <FacultyOne />

      {/* ChooseUsTwo */}
      <ChooseUsTwo />

      {/* TestimonialsThree */}
      <TestimonialsThree />

      {/* EventOne */}
      <EventOne />

      {/* BlogTwo */}
      <BlogTwo />

      {/* BrandTwo */}
      <BrandTwo />

      {/* FooterThree */}
      <FooterThree />
    </>
  );
};

export default page;
