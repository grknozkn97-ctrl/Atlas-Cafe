import React from 'react';
import { motion } from 'framer-motion';

const ProductCard = ({ product, onClick }) => {
  if (!product) return null;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={() => onClick && onClick(product)}
      className="group flex flex-col bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 h-full cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick && onClick(product);
        }
      }}
    >
      <div className="relative h-64 overflow-hidden shrink-0">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-4 mb-1">
          <h3 className="text-xl font-semibold text-foreground leading-tight">{product.name}</h3>
          {product.price !== undefined && (
            <span className="text-lg font-medium text-primary whitespace-nowrap">
              €{Number(product.price).toFixed(2)}
            </span>
          )}
        </div>
        
        {product.weight && (
          <div className="text-sm font-medium text-primary/80 mb-3">
            {product.weight}
          </div>
        )}
        
        {product.description ? (
          <p className="text-muted-foreground leading-relaxed flex-grow text-sm line-clamp-3">
            {product.description}
          </p>
        ) : (
          <div className="flex-grow"></div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;