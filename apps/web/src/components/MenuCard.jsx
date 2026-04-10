import React from 'react';
import { motion } from 'framer-motion';

const MenuCard = ({ product, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(product)}
      className="w-full flex items-center bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-border/40 text-left group"
    >
      <div className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      
      <div className="flex-grow py-3 px-4 sm:px-6 flex flex-col justify-center min-w-0">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground truncate mb-1">
          {product.name}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
          {product.weight && <span className="font-medium text-primary/80 mr-2">{product.weight}</span>}
          {product.description}
        </p>
      </div>
      
      <div className="shrink-0 pr-4 sm:pr-6 pl-2">
        <span className="text-lg sm:text-xl font-medium text-primary">
          €{product.price.toFixed(2)}
        </span>
      </div>
    </motion.button>
  );
};

export default MenuCard;