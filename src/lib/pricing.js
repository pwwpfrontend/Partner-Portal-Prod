// Pricing configuration storage keys
const DEFAULT_DISCOUNTS_KEY = 'pricing_default_discounts';
const BRAND_OVERRIDES_KEY = 'pricing_brand_overrides';

// Default discount rates
const DEFAULT_DISCOUNTS = {
  level1: 10, // Professional - 10%
  level2: 20, // Expert - 20%
  level3: 30, // Master - 30%
};

/**
 * Get default discount rates
 * @returns {Object} Default discount rates for each role
 */
export const getDefaultDiscounts = () => {
  try {
    const stored = localStorage.getItem(DEFAULT_DISCOUNTS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_DISCOUNTS;
  } catch (error) {
    console.error('Error getting default discounts:', error);
    return DEFAULT_DISCOUNTS;
  }
};

/**
 * Set default discount rates
 * @param {Object} discounts - Discount rates for each role
 */
export const setDefaultDiscounts = (discounts) => {
  try {
    localStorage.setItem(DEFAULT_DISCOUNTS_KEY, JSON.stringify(discounts));
  } catch (error) {
    console.error('Error setting default discounts:', error);
  }
};

/**
 * Get all brand-specific discount overrides
 * @returns {Object} Brand overrides object
 */
export const getAllBrandOverrides = () => {
  try {
    const stored = localStorage.getItem(BRAND_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting brand overrides:', error);
    return {};
  }
};

/**
 * Get discount rates for a specific brand
 * @param {string} brand - Brand name
 * @returns {Object|null} Brand discount rates or null if not found
 */
export const getBrandDiscounts = (brand) => {
  try {
    const overrides = getAllBrandOverrides();
    return overrides[brand] || null;
  } catch (error) {
    console.error('Error getting brand discounts:', error);
    return null;
  }
};

/**
 * Update discount rates for a specific brand
 * @param {string} brand - Brand name
 * @param {Object} discounts - Discount rates for each role
 */
export const updateBrandDiscounts = (brand, discounts) => {
  try {
    const overrides = getAllBrandOverrides();
    overrides[brand] = discounts;
    localStorage.setItem(BRAND_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error updating brand discounts:', error);
  }
};

/**
 * Remove brand-specific discount overrides
 * @param {string} brand - Brand name to remove
 */
export const removeBrandDiscounts = (brand) => {
  try {
    const overrides = getAllBrandOverrides();
    delete overrides[brand];
    localStorage.setItem(BRAND_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Error removing brand discounts:', error);
  }
};

/**
 * Reset all brand overrides to defaults
 */
export const resetBrandOverrides = () => {
  try {
    localStorage.removeItem(BRAND_OVERRIDES_KEY);
  } catch (error) {
    console.error('Error resetting brand overrides:', error);
  }
};

/**
 * Calculate net price based on MSRP, role, and brand
 * @param {number} msrp - Manufacturer's Suggested Retail Price
 * @param {string} role - User role (level1, level2, level3)
 * @param {string} brand - Product brand (optional)
 * @returns {number} Calculated net price
 */
export const getNetPrice = (msrp, role, brand = null) => {
  try {
    // Get default discounts
    const defaultDiscounts = getDefaultDiscounts();
    
    // Check for brand-specific override
    let discountRate = defaultDiscounts[role] || 0;
    
    if (brand) {
      const brandDiscounts = getBrandDiscounts(brand);
      if (brandDiscounts && brandDiscounts[role] !== undefined) {
        discountRate = brandDiscounts[role];
      }
    }
    
    // Calculate net price: MSRP × (1 - discount)
    const netPrice = msrp * (1 - discountRate / 100);
    
    // Round to 2 decimal places
    return Math.round(netPrice * 100) / 100;
  } catch (error) {
    console.error('Error calculating net price:', error);
    return msrp; // Return MSRP if calculation fails
  }
};

/**
 * Get discount percentage for a role and brand
 * @param {string} role - User role (level1, level2, level3)
 * @param {string} brand - Product brand (optional)
 * @returns {number} Discount percentage
 */
export const getDiscountPercentage = (role, brand = null) => {
  try {
    // Get default discounts
    const defaultDiscounts = getDefaultDiscounts();
    
    // Check for brand-specific override
    let discountRate = defaultDiscounts[role] || 0;
    
    if (brand) {
      const brandDiscounts = getBrandDiscounts(brand);
      if (brandDiscounts && brandDiscounts[role] !== undefined) {
        discountRate = brandDiscounts[role];
      }
    }
    
    return discountRate;
  } catch (error) {
    console.error('Error getting discount percentage:', error);
    return 0;
  }
};

/**
 * Check if a brand has custom pricing
 * @param {string} brand - Brand name
 * @returns {boolean} True if brand has custom pricing
 */
export const hasBrandPricing = (brand) => {
  try {
    const brandDiscounts = getBrandDiscounts(brand);
    return brandDiscounts !== null;
  } catch (error) {
    console.error('Error checking brand pricing:', error);
    return false;
  }
};

/**
 * Get all available brands with custom pricing
 * @returns {Array} Array of brand names
 */
export const getBrandsWithPricing = () => {
  try {
    const overrides = getAllBrandOverrides();
    return Object.keys(overrides);
  } catch (error) {
    console.error('Error getting brands with pricing:', error);
    return [];
  }
};

/**
 * Export pricing configuration for backup
 * @returns {Object} Complete pricing configuration
 */
export const exportPricingConfig = () => {
  try {
    return {
      defaultDiscounts: getDefaultDiscounts(),
      brandOverrides: getAllBrandOverrides(),
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting pricing config:', error);
    return null;
  }
};

/**
 * Import pricing configuration from backup
 * @param {Object} config - Pricing configuration object
 * @returns {boolean} True if import was successful
 */
export const importPricingConfig = (config) => {
  try {
    if (config.defaultDiscounts) {
      setDefaultDiscounts(config.defaultDiscounts);
    }
    
    if (config.brandOverrides) {
      localStorage.setItem(BRAND_OVERRIDES_KEY, JSON.stringify(config.brandOverrides));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing pricing config:', error);
    return false;
  }
};

// Initialize default pricing if not exists
const initializePricing = () => {
  try {
    if (!localStorage.getItem(DEFAULT_DISCOUNTS_KEY)) {
      setDefaultDiscounts(DEFAULT_DISCOUNTS);
    }
  } catch (error) {
    console.error('Error initializing pricing:', error);
  }
};

// Initialize on module load
initializePricing();


