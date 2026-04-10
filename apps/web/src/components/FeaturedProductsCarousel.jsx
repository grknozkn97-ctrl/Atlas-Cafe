import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils.js';

const featuredProducts = [
  {
    id: 'f1',
    name: 'Dessert + Coffee',
    price: 4.99,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/f62e3667ed0e3d3229a9089dd8c0e053.png',
    targetId: 'dessert-sub',
    description: 'Special Offer'
  },
  {
    id: 'f2',
    name: 'French Fries + 2 Niksicko (500ml)',
    price: 6.00,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/57461599610c22066d7d59b1ade9d029.png',
    targetId: 'snacks',
    description: 'Cool down with niksicko'
  },
  {
    id: 'f3',
    name: 'Toast + Tea',
    price: 4.00,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/8f7d7fe256589569a8abb7d8eec9b715.png',
    targetId: 'toast',
    description: 'Cool down with our signature beverages'
  },
  {
    id: 'f4',
    name: '2 Pasta + 2 Red Wine (Glass)',
    price: 15.00,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/4ba4d8effa966d7c6fe4743afb4ab281.png',
    targetId: 'pasta',
    description: 'Carefully crafted pasta selections'
  },
];

const variants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
};

const FeaturedProductsCarousel = ({ onProductClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (isHovered || isDragging) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovered, isDragging]);

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? featuredProducts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const handleDragEnd = (event, info) => {
    setTimeout(() => setIsDragging(false), 100);

    const xOffset = info.offset.x;
    const xVelocity = info.velocity.x;

    if (xOffset < -50 || xVelocity < -500) {
      handleNext();
    } else if (xOffset > 50 || xVelocity > 500) {
      handlePrev();
    }
  };

  const handleCardClick = () => {
    if (!isDragging) {
      onProductClick(featuredProducts[currentIndex].targetId);
    }
  };

  return (
    <div
      className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] min-h-[300px] max-h-[600px] w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl bg-muted cursor-grab active:cursor-grabbing group">
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.6 }
            }}
            className="absolute inset-0 w-full h-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onClick={handleCardClick}
          >
            <img
              src={featuredProducts[currentIndex].image}
              alt={featuredProducts[currentIndex].name}
              className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
              <div className="text-white">
                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-2xl sm:text-4xl font-bold tracking-tight mb-2"
                >
                  {featuredProducts[currentIndex].name}
                </motion.h3>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-white/80 text-sm sm:text-base max-w-md"
                >
                  {featuredProducts[currentIndex].description}
                </motion.p>
              </div>

              {/* Fiyat etiketinin boydan boya uzaması sorunu burada 'w-max self-start sm:self-auto' eklenerek çözüldü */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="shrink-0 w-max self-start sm:self-auto bg-primary/90 backdrop-blur-sm text-primary-foreground px-6 py-2 rounded-full font-semibold text-lg sm:text-xl shadow-lg"
              >
                €{featuredProducts[currentIndex].price.toFixed(2)}
              </motion.div>

            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 sm:gap-3 z-10">
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(index);
              }}
              className={cn(
                "w-3 h-3 sm:w-3 sm:h-3 rounded-full transition-all duration-300",
                currentIndex === index
                  ? "bg-white w-8 sm:w-10"
                  : "bg-white/50 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductsCarousel;