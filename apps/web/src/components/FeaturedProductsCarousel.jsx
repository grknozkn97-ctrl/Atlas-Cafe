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
    tag: 'Special Offer',
  },
  {
    id: 'f2',
    name: 'French Fries + 2 Niksicko',
    price: 6.00,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/57461599610c22066d7d59b1ade9d029.png',
    targetId: 'snacks',
    tag: 'Fan Favourite',
  },
  {
    id: 'f3',
    name: 'Toast + Tea',
    price: 4.00,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/8f7d7fe256589569a8abb7d8eec9b715.png',
    targetId: 'toast',
    tag: 'Morning Pick',
  },
  {
    id: 'f4',
    name: '2 Pasta + 2 Red Wine',
    price: 15.00,
    image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/4ba4d8effa966d7c6fe4743afb4ab281.png',
    targetId: 'pasta',
    tag: "Chef's Choice",
  },
];
 
const FeaturedProductsCarousel = ({ onProductClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
 
  useEffect(() => {
    if (isHovered || isDragging) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, isDragging]);
 
  const goTo = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };
 
  const handleDragEnd = (_, info) => {
    setTimeout(() => setIsDragging(false), 100);
    if (info.offset.x < -50 || info.velocity.x < -500) {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % featuredProducts.length);
    } else if (info.offset.x > 50 || info.velocity.x > 500) {
      setDirection(-1);
      setCurrentIndex(prev => prev === 0 ? featuredProducts.length - 1 : prev - 1);
    }
  };
 
  const current = featuredProducts[currentIndex];
 
  return (
    <div
      className="w-full px-4 sm:px-6 lg:px-8 py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        style={{ height: 'clamp(280px, 45vw, 520px)' }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onClick={() => !isDragging && onProductClick(current.targetId)}
          >
            {/* Fotoğraf */}
            <img
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover pointer-events-none"
            />
 
            {/* Gradient — sadece alt */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
              }}
            />
 
            {/* Üst sol: Tag */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="absolute top-4 left-4 pointer-events-none"
            >
              <span style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '4px 10px',
                borderRadius: '100px',
              }}>
                {current.tag}
              </span>
            </motion.div>
 
            {/* Alt içerik */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 pointer-events-none">
 
              {/* İsim + Fiyat — aynı satırda, align-items: flex-end ile baseline hizası */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
 
                <motion.h3
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.45 }}
                  style={{
                    fontFamily: 'Lora, serif',
                    fontSize: 'clamp(18px, 4vw, 32px)',
                    fontWeight: '700',
                    color: '#fff',
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    textShadow: '0 1px 12px rgba(0,0,0,0.3)',
                    flex: 1,
                    minWidth: 0,
                    margin: 0,
                    /* fiyat pill ile aynı alt çizgide durması için */
                    paddingBottom: '2px',
                  }}
                >
                  {current.name}
                </motion.h3>
 
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
                  style={{
                    flexShrink: 0,
                    backgroundColor: 'hsl(24, 45%, 35%)',
                    color: '#fff',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 'clamp(14px, 2.5vw, 20px)',
                    fontWeight: '700',
                    padding: '7px 16px',
                    borderRadius: '100px',
                    letterSpacing: '0.01em',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    /* baseline hizası için aynı paddingBottom */
                    marginBottom: '2px',
                  }}
                >
                  €{current.price.toFixed(2)}
                </motion.div>
              </div>
 
              {/* Dot navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px' }}>
                {featuredProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); goTo(i); }}
                    style={{
                      height: '3px',
                      width: i === currentIndex ? '24px' : '8px',
                      borderRadius: '100px',
                      backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.35)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      pointerEvents: 'auto',
                    }}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
 
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
 
export default FeaturedProductsCarousel;
