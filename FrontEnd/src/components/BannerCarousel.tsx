import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface Banner {
  id: number;
  title: string;
  photo: string;
}

export const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta se é mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize(); // verifica logo ao montar

    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const bannerType = isMobile ? "celular" : "normal";

    api.get(`/banners?type=${bannerType}`)
      .then((res) => {
        setBanners(res.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar banners:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isMobile]);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  const nextSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading) {
    return (
      <div className="relative h-[500px] bg-gray-200 flex items-center justify-center">
        <p>Carregando Banners...</p>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative h-[500px] overflow-hidden bg-gray-900">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="relative h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(http://localhost:3000/uploads/banners/${banner.photo})`,
            }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="container mx-auto px-4 h-full flex items-center">
              <div className="text-white max-w-2xl">
                {/* Título do banner (opcional) */}
                {/* <h1 className="text-4xl font-bold">{banner.title}</h1> */}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Botões de navegação */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full"
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Ir para o slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
