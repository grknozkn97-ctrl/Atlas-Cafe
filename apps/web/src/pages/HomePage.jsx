import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import SocialMediaIcons from '@/components/SocialMediaIcons.jsx';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Atlas Cafe | Warmth in Every Cup</title>
        <meta name="description" content="Welcome to Atlas Cafe. Experience artisanal coffee and fresh pastries in a warm, inviting atmosphere." />
      </Helmet>

      <main className="flex-grow">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1682142882978-c19f975d2407" 
              alt="Warm cafe interior with wooden tables and soft lighting" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/60 mix-blend-multiply" />
          </div>

          <div className="container relative z-10 px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-background mb-6 tracking-tight">
                Find Your <span className="text-primary italic">Sanctuary</span>
              </h1>
              <p className="text-lg md:text-2xl text-background/90 mb-10 font-light max-w-2xl mx-auto leading-relaxed">
                Artisanal coffee, freshly baked pastries, and a warm atmosphere designed for connection and comfort.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg">
                  <Link to="/drinks">
                    Explore Drinks <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-background/10 hover:bg-background/20 text-background border-background/30 rounded-full px-8 py-6 text-lg backdrop-blur-sm">
                  <Link to="/food">
                    View Food Menu
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Philosophy</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Atlas Cafe, we believe that a great cup of coffee is more than just a drink—it's a moment of pause in a busy world. We source our beans ethically, bake our pastries fresh daily, and design our spaces to feel like a second home.
            </p>
          </div>
        </section>

        <section className="relative z-10 py-20 sm:py-24 bg-muted/30 border-t border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="flex flex-col items-center gap-8 sm:gap-12">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Connect With Us</h2>
                <p className="text-muted-foreground text-sm sm:text-base">Follow our journey and stay updated with the latest offerings</p>
              </div>
              
              {/* Social Media Icons Component */}
              <SocialMediaIcons />
              
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;