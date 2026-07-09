"use client";

// Adapted from cult-ui's logo-carousel (https://cult-ui.com/r/logo-carousel.json):
// the original ships a hardcoded set of brand SVGs; this version keeps its
// column-cycling animation but takes the logos as a prop so we can feed it
// the real breached-company logos from the HIBP API.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface CarouselLogo {
  id: string;
  name: string;
  src: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distributeLogos = (allLogos: CarouselLogo[], columnCount: number): CarouselLogo[][] => {
  const shuffled = shuffleArray(allLogos);
  const columns: CarouselLogo[][] = Array.from({ length: columnCount }, () => []);

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo);
  });

  const maxLength = Math.max(...columns.map((col) => col.length));
  columns.forEach((col) => {
    while (col.length < maxLength) {
      col.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }
  });

  return columns;
};

interface LogoColumnProps {
  logos: CarouselLogo[];
  index: number;
  currentTime: number;
}

const CYCLE_INTERVAL_MS = 2000;

const LogoColumn: React.FC<LogoColumnProps> = React.memo(({ logos, index, currentTime }) => {
  const columnDelay = index * 200;
  const adjustedTime = (currentTime + columnDelay) % (CYCLE_INTERVAL_MS * logos.length);
  const currentIndex = Math.floor(adjustedTime / CYCLE_INTERVAL_MS);
  const logo = logos[currentIndex];

  return (
    <motion.div
      className="relative h-14 w-24 overflow-hidden md:h-24 md:w-48"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${logo.id}-${currentIndex}`}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: "10%", opacity: 0, filter: "blur(8px)" }}
          animate={{
            y: "0%",
            opacity: 1,
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 300, damping: 20, mass: 1, bounce: 0.2, duration: 0.5 },
          }}
          exit={{
            y: "-20%",
            opacity: 0,
            filter: "blur(6px)",
            transition: { type: "tween", ease: "easeIn", duration: 0.3 },
          }}
        >
          <img
            src={logo.src}
            alt={logo.name}
            title={logo.name}
            loading="lazy"
            className="max-h-[70%] max-w-[80%] object-contain"
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
});

function LogoCarousel({ logos, columnCount = 4 }: { logos: CarouselLogo[]; columnCount?: number }) {
  const [logoSets, setLogoSets] = useState<CarouselLogo[][]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const stableLogos = useMemo(() => logos, [logos]);

  useEffect(() => {
    if (stableLogos.length === 0) return;
    setLogoSets(distributeLogos(stableLogos, columnCount));
  }, [stableLogos, columnCount]);

  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateTime, 100);
    return () => clearInterval(intervalId);
  }, [updateTime]);

  return (
    <div className="flex space-x-4">
      {logoSets.map((columnLogos, index) => (
        <LogoColumn key={index} logos={columnLogos} index={index} currentTime={currentTime} />
      ))}
    </div>
  );
}

export { LogoCarousel };
export default LogoCarousel;
