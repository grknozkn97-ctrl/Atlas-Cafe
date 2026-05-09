import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
 
// ── Tüm extras logic aynı, hiç dokunulmadı ──────────────────────────────────
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
  default: [],
};
 
const getExtrasForProduct = (product) => {
  if (!product) return [];
  const category = (product.category || '').toLowerCase().trim();
  const mainCategory = (product.mainCategory || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();
 
  if (category === 'frozen') return extrasMapping.frozen;
  if (category === 'milkshake') return extrasMapping.milkshake;
  if (category === 'chicken') return extrasMapping.chicken;
  if (category === 'beer') return extrasMapping.beer;
  if (category === 'breakfast') return extrasMapping.breakfast;
  if (category === 'snacks') return extrasMapping.snacks;
  if (category === 'pasta') return extrasMapping.pasta;
 
  const kitchenCategories = ['breakfast', 'snacks', 'pasta', 'meat', 'salad', 'toast', 'kitchen'];
  if (mainCategory.includes('kitchen') || kitchenCategories.includes(category)) {
    return extrasMapping.breakfast;
  }
 
  if (name.includes('frozen')) return extrasMapping.frozen;
  if (name.includes('milkshake')) return extrasMapping.milkshake;
  if (name.includes('chicken')) return extrasMapping.chicken;
  if (name.includes('beer')) return extrasMapping.beer;
  if (name.includes('breakfast')) return extrasMapping.breakfast;
  if (name.includes('snacks')) return extrasMapping.snacks;
  if (name.includes('pasta')) return extrasMapping.pasta;
 
  return extrasMapping.default;
};
// ─────────────────────────────────────────────────────────────────────────────
 
const ProductModal = ({ product, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);
 
  const totalPrice = product ? Number(product.price) : 0;
  const currentExtras = getExtrasForProduct(product) || [];
 
  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
 
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="w-full sm:max-w-lg pointer-events-auto relative flex flex-col"
              style={{
                maxHeight: '92dvh',
                backgroundColor: 'hsl(40, 33%, 98%)',
                borderRadius: '24px 24px 0 0',
                overflow: 'hidden',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
              }}
              // sm ekranda köşeli
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Drag handle — sadece mobilde */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div style={{
                  width: '36px', height: '4px',
                  borderRadius: '100px',
                  backgroundColor: 'hsl(38, 20%, 82%)',
                }} />
              </div>
 
              {/* Kapat butonu */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-3 right-3 z-10 bg-black/25 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
 
              {/* Fotoğraf */}
              <div className="relative w-full shrink-0" style={{ height: '220px' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%)' }}
                />
              </div>
 
              {/* İçerik */}
              <div className="overflow-y-auto flex-grow" style={{ padding: '20px 20px 32px' }}>
 
                {/* İsim + Fiyat */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <h2
                    id="modal-title"
                    style={{
                      fontFamily: 'Lora, serif',
                      fontSize: '22px',
                      fontWeight: '700',
                      color: 'hsl(24, 10%, 10%)',
                      lineHeight: 1.2,
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {product.name}
                  </h2>
                  <span style={{
                    flexShrink: 0,
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '17px',
                    fontWeight: '700',
                    color: 'hsl(24, 45%, 35%)',
                    backgroundColor: 'hsl(38, 40%, 91%)',
                    padding: '5px 13px',
                    borderRadius: '100px',
                    lineHeight: 1.4,
                    whiteSpace: 'nowrap',
                  }}>
                    €{totalPrice.toFixed(2)}
                  </span>
                </div>
 
                {/* Ağırlık */}
                {product.weight && (
                  <p style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: 'hsl(24, 10%, 55%)',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    margin: '0 0 16px',
                  }}>
                    Weight: {product.weight}
                  </p>
                )}
 
                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'hsl(38, 20%, 88%)', margin: '0 0 16px' }} />
 
                {/* Description */}
                {product.description && (
                  <div style={{ marginBottom: currentExtras.length > 0 ? '20px' : 0 }}>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'hsl(24, 10%, 52%)',
                      margin: '0 0 8px',
                    }}>
                      Description
                    </p>
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      color: 'hsl(24, 10%, 28%)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}>
                      {product.description}
                    </p>
                  </div>
                )}
 
                {/* Ekstra */}
                {currentExtras.length > 0 && (
                  <div>
                    <div style={{ height: '1px', backgroundColor: 'hsl(38, 20%, 88%)', margin: '0 0 16px' }} />
                    <p style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'hsl(24, 10%, 52%)',
                      margin: '0 0 10px',
                    }}>
                      Ekstra
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {currentExtras.map((extra, i) => (
                        <div
                          key={extra.id ?? i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'hsl(0, 0%, 100%)',
                            border: '1px solid hsl(38, 20%, 88%)',
                          }}
                        >
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: 'hsl(24, 10%, 20%)' }}>
                            {extra.name}
                          </span>
                          {extra.price > 0 && (
                            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', fontWeight: '600', color: 'hsl(24, 45%, 35%)' }}>
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
