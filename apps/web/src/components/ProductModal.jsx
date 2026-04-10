import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const extrasMapping = {
  frozen: [
    { id: 'ext-top', name: 'Ekstra Toppings', price: 0.50 },
    { id: 'ext-sauce', name: 'Ekstra Sauce', price: 0.50 },
    { id: 'ext-whip', name: 'Ekstra Whipped Cream', price: 0.80 },
  ],
  milkshake: [
    { id: 'ext-cream', name: 'Ekstra Cream', price: 0.50 },
    { id: 'ext-syrup', name: 'Ekstra Syrup', price: 0.30 },
    { id: 'ext-choc', name: 'Ekstra Chocolate', price: 0.60 },
  ],
  chicken: [
    { id: 'ext-sauce-c', name: 'Ekstra Sauce', price: 0.50 },
    { id: 'ext-bread-c', name: 'Ekstra Bread', price: 0.50 },
    { id: 'ext-cheese-c', name: 'Ekstra Cheese', price: 1.00 },
  ],
  beer: [
    { id: 'ext-glass', name: 'Ekstra Glass', price: 0.00 },
    { id: 'ext-ice', name: 'Ekstra Ice', price: 0.00 },
  ],
  breakfast: [
    { id: 'ext-cheese-k', name: 'Cheese 30 GR', price: 0.50 },
    { id: 'ext-bread-k', name: 'Sausage 30 GR', price: 1.00 },
    { id: 'ext-sauce-k', name: 'Olives 30 GR', price: 1.00 },
    { id: 'ext-sauce-k', name: 'Tomato 50 GR', price: 0.40 },
    { id: 'ext-sauce-k', name: 'Cucumber 50 GR', price: 0.40 },
    { id: 'ext-sauce-k', name: 'Boailed Egg', price: 1.00 },
    { id: 'ext-sauce-k', name: 'Ajvar 30 GR', price: 0.70 },
    { id: 'ext-sauce-k', name: 'Honey 15 GR', price: 0.20 },
    { id: 'ext-sauce-k', name: 'Butter 20 GR', price: 1.00 },
    { id: 'ext-sauce-k', name: 'Bread 100 GR', price: 0.50 },
  ],
  snacks: [
    { id: 'ext-sauce-s', name: 'Cheddar Cheese 50 GR', price: 0.50 },
    { id: 'ext-dip-s', name: 'Ekstra Sauce', price: 0.20 },
  ],
  pasta: [
    { id: 'ext-cheese-p', name: 'Ekstra Parmesan', price: 1.00 },
    { id: 'ext-bread-p', name: 'Ekstra Pasta +50 GR', price: 1.00 },
  ],
  default: [
    
  ]
};

const getExtrasForProduct = (product) => {
  if (!product) return [];
  
  const category = (product.category || '').toLowerCase().trim();
  const mainCategory = (product.mainCategory || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();

  // 1. Check explicit exact category matches first
  if (category === 'frozen') return extrasMapping.frozen;
  if (category === 'milkshake') return extrasMapping.milkshake;
  if (category === 'chicken') return extrasMapping.chicken;
  if (category === 'beer') return extrasMapping.beer;
  if (category === 'breakfast') return extrasMapping.breakfast;
  if (category === 'snacks') return extrasMapping.snacks;
  if (category === 'pasta') return extrasMapping.pasta;

  // 2. Check kitchen categories (handles both MenuPage mainCategory and FoodMenuPage subcategories)
  const kitchenCategories = ['breakfast', 'snacks', 'pasta', 'meat', 'salad', 'toast', 'kitchen'];
  if (mainCategory.includes('kitchen') || kitchenCategories.includes(category)) {
    // Fallback to breakfast extras for general kitchen items if not specifically matched above
    return extrasMapping.breakfast;
  }

  // 3. Fallback to name matching if category wasn't specific enough
  if (name.includes('frozen')) return extrasMapping.frozen;
  if (name.includes('milkshake')) return extrasMapping.milkshake;
  if (name.includes('chicken')) return extrasMapping.chicken;
  if (name.includes('beer')) return extrasMapping.beer;
  if (name.includes('breakfast')) return extrasMapping.breakfast;
  if (name.includes('snacks')) return extrasMapping.snacks;
  if (name.includes('pasta')) return extrasMapping.pasta;

  // 4. Default fallback for everything else (drinks, desserts, etc.)
  return extrasMapping.default;
};

const ProductModal = ({ product, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Calculate total price (extras no longer affect the total)
  const totalPrice = product ? Number(product.price) : 0;
  const currentExtras = getExtrasForProduct(product) || [];

  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              className="bg-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl pointer-events-auto relative flex flex-col max-h-[90vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="relative h-64 sm:h-80 w-full shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto flex-grow">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold text-foreground">
                    {product.name}
                  </h2>
                  <span className="text-xl font-semibold text-primary shrink-0 bg-primary/10 px-3 py-1 rounded-lg">
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
                
                {product.weight && (
                  <div className="text-sm font-medium text-muted-foreground mb-5">
                    Weight: {product.weight}
                  </div>
                )}

                {product.description && (
                  <div className="mt-2">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                      Description
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Extras Section (Display Only) */}
                {currentExtras.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                      Ekstra
                    </h3>
                    <div className="space-y-2">
                      {currentExtras.map((extra) => (
                        <div 
                          key={extra.id} 
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {extra.name}
                          </span>
                          {extra.price > 0 && (
                            <span className="text-sm font-medium text-muted-foreground">
                              +€{extra.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;