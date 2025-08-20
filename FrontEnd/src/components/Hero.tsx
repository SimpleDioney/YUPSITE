import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import featuredCake from "@/assets/featured-cake.jpg";

export const Hero = () => {
  return (
    <section className="bg-gradient-warm py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                <Heart className="w-4 h-4 mr-2 fill-current" />
                YUP
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Sabores únicos que 
                <span className="text-primary"> conquistam paladares</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Descubra experiências gastronômicas especiais com sabores únicos e irresistíveis. 
                Cada produto é criado com amor e os melhores ingredientes selecionados.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gradient" size="xl" className="flex items-center group">
                Ver Produtos
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
            </div>

            
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={featuredCake} 
                alt="Bolo Trufado Especial" 
                className="w-full h-[500px] object-cover rounded-2xl shadow-orange"
              />
              
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-orange opacity-20 rounded-2xl transform rotate-3 scale-105 -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};