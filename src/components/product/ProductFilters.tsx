"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { memo, useState, useEffect } from "react"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { FilterOption } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  /** Dynamic filters computed from actual products */
  dynamicFilters?: FilterOption[];
}

/** Default filters that always show regardless of subcategory if empty defaults are needed */
const defaultSizes = ["S", "M", "L", "XL"];
const defaultColors = [
  { name: "Siyah", hex: "#000000" },
  { name: "Beyaz", hex: "#FFFFFF" },
  { name: "Lacivert", hex: "#0A192F" },
  { name: "Gri", hex: "#808080" },
  { name: "Bej", hex: "#F5F5DC" },
];

export const ProductFilters = memo(function ProductFilters({ dynamicFilters = [] }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local price range state for slider to avoid stuttering during slide
  const [priceRange, setPriceRange] = useState([0, 10000]);

  // Read URL active states
  const activeSizes = searchParams.getAll("size");
  const activeColors = searchParams.getAll("color");

  const isSelected = (filterId: string, value: string) => {
    if (filterId === "size" || filterId === "beden") {
      return activeSizes.includes(value);
    }
    if (filterId === "color" || filterId === "renk") {
      return activeColors.includes(value);
    }
    return searchParams.getAll(filterId).includes(value);
  };

  const toggleFilter = (filterId: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(filterId);

    if (currentValues.includes(value)) {
      // Remove it
      params.delete(filterId);
      currentValues.filter(v => v !== value).forEach(v => params.append(filterId, v));
    } else {
      // Add it
      params.append(filterId, value);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("size");
    params.delete("color");
    params.delete("beden");
    params.delete("renk");
    params.delete("fabricType");
    params.delete("fit");
    params.delete("tip");
    params.delete("collarType");
    // Preserve 'sort' and 'sub' if they exist
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeFiltersCount = activeSizes.length + activeColors.length
    + searchParams.getAll("fabricType").length
    + searchParams.getAll("fit").length
    + searchParams.getAll("tip").length
    + searchParams.getAll("collarType").length;

  const hasDynamicFilters = dynamicFilters.length > 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <h3 className="text-lg font-light tracking-widest uppercase mb-4 text-white">
          Filtrele
        </h3>
        <div className="h-[1px] w-full bg-white/10 mb-4" />
      </div>

      <Accordion className="w-full text-white/80" defaultValue={["size", "color", "price"]}>
        
        {hasDynamicFilters ? (
          <>
            {dynamicFilters.map((filter) => (
              <AccordionItem key={filter.id} value={filter.id} className="border-b border-white/10">
                <AccordionTrigger className="hover:no-underline hover:text-white uppercase text-sm tracking-wider font-medium">
                  {filter.label}
                </AccordionTrigger>
                <AccordionContent>
                  {filter.id === "color" || filter.id === "renk" ? (
                    /* Color filter — show colored dots */
                    <div className="flex flex-col space-y-3 pt-2">
                      {filter.values.map((value) => {
                        const colorHex = getColorHex(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleFilter(filter.id, value)}
                            className="flex items-center space-x-3 cursor-pointer group"
                          >
                            <div className={cn(
                              "relative flex items-center justify-center w-5 h-5 rounded-full border transition-colors",
                              isSelected(filter.id, value) ? "border-white ring-1 ring-white" : "border-white/20 group-hover:border-white"
                            )}>
                              <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: colorHex }} />
                            </div>
                            <span className={cn(
                              "text-sm font-light transition-colors",
                              isSelected(filter.id, value) ? "text-white" : "text-white/70 group-hover:text-white"
                            )}>
                              {value}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : filter.id === "size" || filter.id === "beden" ? (
                    /* Size filter — grid of buttons */
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {filter.values.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleFilter(filter.id, value)}
                          className={cn(
                            "h-10 border flex items-center justify-center text-xs transition-colors cursor-pointer",
                            isSelected(filter.id, value)
                              ? "bg-white text-black border-white"
                              : "border-white/20 hover:bg-white hover:text-black"
                          )}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Generic filter — text list */
                    <div className="flex flex-col space-y-2 pt-2">
                      {filter.values.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleFilter(filter.id, value)}
                          className={cn(
                            "flex items-center space-x-3 cursor-pointer group text-left",
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                            isSelected(filter.id, value)
                              ? "bg-white border-white"
                              : "border-white/30 group-hover:border-white/60"
                          )}>
                            {isSelected(filter.id, value) && (
                              <svg className="w-3 h-3 text-black" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className={cn(
                            "text-sm font-light transition-colors",
                            isSelected(filter.id, value) ? "text-white" : "text-white/70 group-hover:text-white"
                          )}>
                            {value}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </>
        ) : (
          <>
            {/* Size Filter */}
            <AccordionItem value="size" className="border-b border-white/10">
              <AccordionTrigger className="hover:no-underline hover:text-white uppercase text-sm tracking-wider font-medium">
                Beden
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {defaultSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleFilter("size", size)}
                      className={cn(
                        "h-10 border flex items-center justify-center text-xs transition-colors cursor-pointer",
                        isSelected("size", size)
                          ? "bg-white text-black border-white"
                          : "border-white/20 hover:bg-white hover:text-black"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Color Filter */}
            <AccordionItem value="color" className="border-b border-white/10">
              <AccordionTrigger className="hover:no-underline hover:text-white uppercase text-sm tracking-wider font-medium">
                Renk
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col space-y-3 pt-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => toggleFilter("color", color.name)}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className={cn(
                        "relative flex items-center justify-center w-5 h-5 rounded-full border transition-colors",
                        isSelected("color", color.name) ? "border-white ring-1 ring-white" : "border-white/20 group-hover:border-white"
                      )}>
                        <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                      </div>
                      <span className={cn(
                        "text-sm font-light transition-colors",
                        isSelected("color", color.name) ? "text-white" : "text-white/70 group-hover:text-white"
                      )}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {/* Price Filter — always shown */}
        <AccordionItem value="price" className="border-b border-white/10">
          <AccordionTrigger className="hover:no-underline hover:text-white uppercase text-sm tracking-wider font-medium">
            Fiyat
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-6 pb-2 space-y-4">
              <Slider 
                defaultValue={[0, 10000]} 
                max={15000} 
                step={100}
                value={priceRange}
                onValueChange={(val) => Array.isArray(val) && setPriceRange(val as number[])}
                className="w-full"
              />
              <div className="flex justify-between items-center text-xs font-light text-white/50">
                <span>{priceRange[0]} TL</span>
                <span>{priceRange[1]}+ TL</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Active filter count & Clear */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full py-3 mt-4 text-[10px] sm:text-xs uppercase tracking-widest text-white/80 border border-white/20 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
        >
          Filtreleri Temizle ({activeFiltersCount})
        </button>
      )}
    </div>
  );
});

/** Helper — maps Turkish color names to hex values */
function getColorHex(colorName: string): string {
  const map: Record<string, string> = {
    "Siyah": "#000000",
    "Beyaz": "#FFFFFF",
    "Gri": "#808080",
    "Lacivert": "#0A192F",
    "Bej": "#F5F5DC",
    "Haki": "#5F6B4A",
    "Bordo": "#800020",
    "Kırmızı": "#E74C3C",
    "Mavi": "#3498DB",
  };
  return map[colorName] ?? "#808080";
}

