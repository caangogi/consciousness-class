import AboutThreeWhiteBG from "@/components/AboutThreeWhiteBG";
import BrandTwo from "@/components/BrandTwo";
import Breadcrumb from "@/components/Breadcrumb";
import CounterOne from "@/components/CounterOne";
import FooterThree from "@/components/FooterThree";
import HeaderOne from "@/components/HeaderOne";
import TestimonialsThree from "@/components/TestimonialsThree";
import VideoOneV2 from "@/components/VideoOneV2";
import Animation from "@/helper/Animation";

export const metadata = {
  title: "EduAll - LMS, Tutors, Education & Online Course NEXT JS Template",
  description:
    "EduAll is a comprehensive and modern NEXT JS template designed for online education platforms, learning management systems (LMS), tutors, educational institutions, and online courses. It’s the perfect solution for creating an engaging and interactive online learning experience for students, educators, and institutions. Whether you’re offering online courses, running a tutoring platform, or managing an educational website, EduAll provides the tools to help you succeed. This template is tailored to meet the needs of educators, administrators, and students, providing a seamless and engaging user experience.",
};

const page = () => {
  return (
    <>
      {/* Animation */}
      <Animation />

      {/* HeaderTwo */}
      <HeaderOne />

      {/* Breadcrumb */}
      <Breadcrumb title={"About Us 03"} />

      {/* AboutThreeWhiteBG */}
      <AboutThreeWhiteBG />

      {/* CounterOne */}
      <CounterOne />

      {/* BrandTwo */}
      <BrandTwo />

      {/* VideoOneV2 */}
      <VideoOneV2 />

      {/* TestimonialsThree */}
      <TestimonialsThree />

      {/* FooterThree */}
      <FooterThree />
    </>
  );
};

export default page;
