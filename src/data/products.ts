import { Product } from "@/types/product";
import appleImg from "@/assets/product-apple.jpg";
import bananaImg from "@/assets/product-banana.jpg";
import orangeImg from "@/assets/product-orange.jpg";
import milkImg from "@/assets/product-milk.jpg";
import breadImg from "@/assets/product-bread.jpg";
import eggsImg from "@/assets/product-eggs.jpg";

export const products: Product[] = [
  { id: "1", name: "Apples", image: appleImg },
  { id: "2", name: "Bananas", image: bananaImg },
  { id: "3", name: "Oranges", image: orangeImg },
  { id: "4", name: "Milk", image: milkImg },
  { id: "5", name: "Bread", image: breadImg },
  { id: "6", name: "Eggs", image: eggsImg },
];
