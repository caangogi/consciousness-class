import AboutOne from "@/components/AboutOne";
import BannerOne from "@/components/BannerOne";
import BlogOne from "@/components/BlogOne";
import BrandOne from "@/components/BrandOne";
import CertificateOne from "@/components/CertificateOne";
import ChooseUsOne from "@/components/ChooseUsOne";
import CounterOne from "@/components/CounterOne";
import ExploreCourseOne from "@/components/ExploreCourseOne";
import FeaturesOne from "@/components/FeaturesOne";
import FooterOne from "@/components/FooterOne";
import HeaderOne from "@/components/HeaderOne";
import InstructorOne from "@/components/InstructorOne";
import TestimonialsOne from "@/components/TestimonialsOne";
import Animation from "@/helper/Animation";

export const metadata = {
  title: "Consciousness Class - Plataforma de Membresías para tu Expansión Personal",
  description:
    "Consciousness Class es una plataforma de membresías diseñada para acompañarte en tu evolución personal y expansión de conciencia. Creada por Yenniser y desarrollada en NEXT.js, ofrece un espacio donde puedes desbloquear tu verdadero potencial a través de recursos exclusivos, guías transformadoras y una comunidad en crecimiento. Consciousness Class es el lugar donde la conciencia se convierte en acción, impulsándote a crear la vida que mereces. Ideal para buscadores de crecimiento interior, transformación y conexión auténtica.",
};

const page = () => {
  return (
    <>
      {/* HeaderOne */}
      <HeaderOne />

      {/* Animation */}
      <Animation />

      {/* BannerOne */}
      <BannerOne />

      {/* BrandOne */}
      <BrandOne />

      {/* FeaturesOne */}
      <FeaturesOne />

      {/* ExploreCourseOne  TO-DO */}
      {/* <ExploreCourseOne />
 */}
      {/* AboutOne */}
      <AboutOne />

      {/* InstructorOne  TO-DO */}
      {/* <InstructorOne /> */}

      {/* CHooseUsOne */}
      <ChooseUsOne />

      {/* CounterOne */}
      <CounterOne />

      {/* TestimonialsOne */}
      <TestimonialsOne />

      {/* BlogOne */}
      <BlogOne />

      {/* CertificateOne */}
      <CertificateOne />

      {/* FooterOne */}
      <FooterOne />
    </>
  );
};

export default page;
