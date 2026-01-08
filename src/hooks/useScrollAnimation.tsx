import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'blur';

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
}

export function AnimateOnScroll(props: AnimateOnScrollProps) {
  const {
    children,
    className = '',
    animation = 'fade-up',
    delay = 0,
    duration = 600,
    threshold = 0.1,
  } = props;
  
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold });

  const baseStyles: CSSProperties = {
    transition: 'opacity ' + duration + 'ms ease-out, transform ' + duration + 'ms ease-out, filter ' + duration + 'ms ease-out',
    transitionDelay: delay + 'ms',
  };

  const getHiddenStyles = (anim: AnimationType): CSSProperties => {
    switch (anim) {
      case 'fade-up':
        return { opacity: 0, transform: 'translateY(40px)' };
      case 'fade-down':
        return { opacity: 0, transform: 'translateY(-40px)' };
      case 'fade-left':
        return { opacity: 0, transform: 'translateX(-40px)' };
      case 'fade-right':
        return { opacity: 0, transform: 'translateX(40px)' };
      case 'scale':
        return { opacity: 0, transform: 'scale(0.9)' };
      case 'blur':
        return { opacity: 0, filter: 'blur(10px)' };
      default:
        return { opacity: 0, transform: 'translateY(40px)' };
    }
  };

  const visibleStyles: CSSProperties = {
    opacity: 1,
    transform: 'translateY(0) translateX(0) scale(1)',
    filter: 'blur(0)',
  };

  const currentStyles = isVisible ? visibleStyles : getHiddenStyles(animation);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...baseStyles, ...currentStyles }}
    >
      {children}
    </div>
  );
}
