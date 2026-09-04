// composables/useProjects.ts
import fashionImg from "@/assets/images/high_fashion_runway_minimalist.png";
import beautyImg from "@/assets/images/beauty_skincare_light_minimalist.png"; // Re-using this one as it fits minimalist
import perfumeImg from "@/assets/images/minimalist_luxury_perfume_store.png";
import furnitureImg from "@/assets/images/architectural_furniture_luxury.png";
import watchImg from "@/assets/images/luxury_watch_boutique_minimalist.png";
import jewelryImg from "@/assets/images/jewelry_luxury_showcase.png"; // Re-using

export interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  featured?: boolean;
}

export const useProjects = () => {
  const projects: Project[] = [
    {
      id: "maison-noir",
      title: "Maison Noir",
      category: "Fashion E-Commerce",
      image: fashionImg,
      description:
        "Contemporary fashion redefined through the purity of minimalist design. A digital experience where every garment becomes a protagonist, every collection tells a story, and simplicity speaks volumes.",
      featured: true,
    },
    {
      id: "lumiere-beauty",
      title: "Lumière Beauty",
      category: "Beauty Platform",
      image: beautyImg,
      description:
        "A luxury cosmetics house brought to life through an immersive platform where beauty discovery becomes a personal journey. Technology and intuition merge to guide each customer to their perfect shade, their signature look.",
      featured: true,
    },
    {
      id: "aura-botanica",
      title: "Aura Botanica",
      category: "Fragrance",
      image: perfumeImg,
      description:
        "An olfactory journey expressed through digital serenity. The interface dissolves to let the essence of each fragrance breathe, creating a sensory space that is both intimate and expansive.",
      featured: true,
    },
    {
      id: "atelier-luna",
      title: "Atelier Luna",
      category: "Interior Design",
      image: furnitureImg,
      description:
        "Furniture as art. We created a digital gallery that mirrors the architectural precision of the physical pieces. Warm neutral tones and soft lighting invite users to inhabit the space virtually.",
      featured: false,
    },
    {
      id: "aurum-chronos",
      title: "Aurum & Chronos",
      category: "Horology",
      image: watchImg,
      description:
        "Precision engineering meets digital sophistication. A dark, sleek environment that highlights the mechanical beauty of fine timepieces with macro-level fidelity and effortless navigation.",
      featured: false,
    },
  ];

  const getFeaturedProjects = () => {
    return projects.filter((project) => project.featured).slice(0, 3);
  };

  const getAllProjects = () => {
    return projects;
  };

  return {
    projects,
    getFeaturedProjects,
    getAllProjects,
  };
};
