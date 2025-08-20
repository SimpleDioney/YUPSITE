import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Products } from "@/components/Products";
import { Footer } from "@/components/Footer";
import { BannerCarousel } from "@/components/BannerCarousel";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <BannerCarousel />
      <Hero />
      <Products />
      <Footer />
    </div>
  );
};

export default Index;
