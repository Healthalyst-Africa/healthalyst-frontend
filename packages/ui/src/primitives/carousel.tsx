"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";

import { cn } from "@healthalyst/ui/lib/utilities";
import { ActionButton } from "@healthalyst/ui/components/action-button";

type CarouselInstance = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProperties = {
  options?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  onCarouselReady?: (carouselInstance: CarouselInstance) => void;
};

type CarouselContextProperties = {
  carouselReference: ReturnType<typeof useEmblaCarousel>[0];
  carouselInstance: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrevious: () => void;
  scrollNext: () => void;
  canScrollPrevious: boolean;
  canScrollNext: boolean;
} & CarouselProperties;

const CarouselContext = React.createContext<CarouselContextProperties | null>(
  null
);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProperties
>(
  (
    {
      orientation = "horizontal",
      options,
      onCarouselReady,
      plugins,
      className,
      children,
      ...properties
    },
    elementReference
  ) => {
    const [carouselReference, carouselInstance] = useEmblaCarousel(
      {
        ...options,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    );
    const [canScrollPrevious, setCanScrollPrevious] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const updateScrollState = React.useCallback(
      (selectedCarousel: CarouselInstance) => {
        if (!selectedCarousel) {
          return;
        }

        setCanScrollPrevious(selectedCarousel.canScrollPrev());
        setCanScrollNext(selectedCarousel.canScrollNext());
      },
      []
    );

    const scrollPrevious = React.useCallback(() => {
      carouselInstance?.scrollPrev();
    }, [carouselInstance]);

    const scrollNext = React.useCallback(() => {
      carouselInstance?.scrollNext();
    }, [carouselInstance]);

    const handleKeyDown = React.useCallback(
      (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) => {
        if (keyboardEvent.key === "ArrowLeft") {
          keyboardEvent.preventDefault();
          scrollPrevious();
        } else if (keyboardEvent.key === "ArrowRight") {
          keyboardEvent.preventDefault();
          scrollNext();
        }
      },
      [scrollPrevious, scrollNext]
    );

    React.useEffect(() => {
      if (!carouselInstance || !onCarouselReady) {
        return;
      }

      onCarouselReady(carouselInstance);
    }, [carouselInstance, onCarouselReady]);

    React.useEffect(() => {
      if (!carouselInstance) {
        return;
      }

      updateScrollState(carouselInstance);
      carouselInstance.on("reInit", updateScrollState);
      carouselInstance.on("select", updateScrollState);

      return () => {
        carouselInstance.off("reInit", updateScrollState);
        carouselInstance.off("select", updateScrollState);
      };
    }, [carouselInstance, updateScrollState]);

    return (
      <CarouselContext.Provider
        value={{
          carouselReference,
          carouselInstance,
          options,
          orientation:
            orientation || (options?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrevious,
          scrollNext,
          canScrollPrevious,
          canScrollNext,
        }}
      >
        <div
          ref={elementReference}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...properties}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...properties }, elementReference) => {
  const { carouselReference, orientation } = useCarousel();

  return (
    <div ref={carouselReference} className="overflow-hidden">
      <div
        ref={elementReference}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...properties}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...properties }, elementReference) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={elementReference}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...properties}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ActionButton>
>(
  (
    { className, variant = "outline", size = "icon", ...properties },
    elementReference
  ) => {
    const { orientation, scrollPrevious, canScrollPrevious } = useCarousel();

    return (
      <ActionButton
        ref={elementReference}
        variant={variant}
        size={size}
        className={cn(
          "absolute size-8 rounded-full",
          orientation === "horizontal"
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
        disabled={!canScrollPrevious}
        onClick={scrollPrevious}
        {...properties}
      >
        <ChevronLeftIcon aria-hidden="true" />
        <span className="sr-only">Previous slide</span>
      </ActionButton>
    );
  }
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof ActionButton>
>(
  (
    { className, variant = "outline", size = "icon", ...properties },
    elementReference
  ) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <ActionButton
        ref={elementReference}
        variant={variant}
        size={size}
        className={cn(
          "absolute size-8 rounded-full",
          orientation === "horizontal"
            ? "-right-12 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...properties}
      >
        <ChevronRightIcon aria-hidden="true" />
        <span className="sr-only">Next slide</span>
      </ActionButton>
    );
  }
);
CarouselNext.displayName = "CarouselNext";

export {
  type CarouselInstance,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
